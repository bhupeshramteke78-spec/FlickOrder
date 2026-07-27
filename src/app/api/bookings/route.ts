import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import type { Json } from "@/lib/database.types";
import {
  addDaysToDateString,
  defaultBookingConfig,
  getIndiaDateString,
  isAlignedBookingSlot,
  isTimeWithinOpeningHours,
  timeToMinutes,
  type BookingConfig,
} from "@/lib/bookings";
import { notifyRestaurantNewBooking } from "@/lib/push-notifications";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createBookingSchema } from "@/lib/validations/bookings";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimitResponse = enforceRateLimit(request, {
    keyPrefix: "booking-create",
    limit: 8,
    windowMs: 10 * 60_000,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const payload = createBookingSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json(
      { error: "Check the booking details and try again.", details: payload.error.flatten() },
      { status: 422 },
    );
  }

  const serverClient = await createClient();
  const { data: authData } = await serverClient.auth.getUser();

  if (!authData.user) {
    return NextResponse.json({ error: "Login or create a customer account to book a table." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Complete your customer account before booking." }, { status: 403 });
  }

  const { data: restaurant, error: restaurantError } = await admin
    .from("restaurants")
    .select("id,name,slug,verification_status,deletion_requested_at,deleted_at")
    .eq("slug", payload.data.restaurantSlug)
    .eq("verification_status", "APPROVED")
    .is("deletion_requested_at", null)
    .is("deleted_at", null)
    .maybeSingle();

  if (restaurantError || !restaurant) {
    return NextResponse.json({ error: "This restaurant is not available for booking." }, { status: 404 });
  }

  const { data: settings } = await admin
    .from("restaurant_settings")
    .select(
      "opening_hours,booking_enabled,booking_slot_minutes,booking_duration_minutes,booking_advance_days,booking_min_notice_minutes,booking_max_party_size",
    )
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();

  const config = normalizeBookingConfig(settings);
  const validationError = validateBookingSchedule(payload.data, config);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 422 });
  }

  const accessToken = randomBytes(32).toString("base64url");
  const accessTokenHash = hashAccessToken(accessToken);

  const { data: bookingResult, error: bookingError } = await admin.rpc("create_restaurant_booking", {
    p_restaurant_id: restaurant.id,
    p_customer_id: authData.user.id,
    p_customer_name: payload.data.customerName,
    p_customer_phone: payload.data.customerPhone,
    p_party_size: payload.data.partySize,
    p_booking_date: payload.data.bookingDate,
    p_booking_time: payload.data.bookingTime,
    p_duration_minutes: config.durationMinutes,
    p_special_request: payload.data.specialRequest || null,
    p_access_token_hash: accessTokenHash,
  });

  const booking = bookingResult?.[0];

  if (bookingError || !booking) {
    const noAvailability = bookingError?.message.toLowerCase().includes("no table is available");

    return NextResponse.json(
      {
        error: noAvailability
          ? "No suitable table is available for that time. Please choose another slot."
          : "Unable to create the booking right now.",
      },
      { status: noAvailability ? 409 : 400 },
    );
  }

  await admin.from("notifications").insert({
    restaurant_id: restaurant.id,
    type: "NEW_BOOKING",
    payload: {
      bookingId: booking.booking_id,
      confirmationCode: booking.confirmation_code,
      customerName: payload.data.customerName,
      partySize: payload.data.partySize,
      bookingDate: payload.data.bookingDate,
      bookingTime: payload.data.bookingTime,
    } satisfies Json,
  });

  await notifyRestaurantNewBooking(admin, {
    id: booking.booking_id,
    restaurantId: restaurant.id,
    customerName: payload.data.customerName,
    partySize: payload.data.partySize,
    bookingDate: payload.data.bookingDate,
    bookingTime: payload.data.bookingTime,
  });

  return NextResponse.json(
    {
      bookingId: booking.booking_id,
      confirmationCode: booking.confirmation_code,
      statusUrl: `/bookings/${booking.booking_id}`,
    },
    { status: 201 },
  );
}

function validateBookingSchedule(
  input: {
    partySize: number;
    bookingDate: string;
    bookingTime: string;
  },
  config: BookingConfig,
) {
  if (!config.enabled) {
    return "Online table booking is currently unavailable for this restaurant.";
  }

  if (input.partySize > config.maxPartySize) {
    return `Online bookings are limited to ${config.maxPartySize} guests. Please contact the restaurant for a larger group.`;
  }

  const today = getIndiaDateString();
  const finalBookingDate = addDaysToDateString(today, config.advanceDays);

  if (input.bookingDate < today || input.bookingDate > finalBookingDate) {
    return `Choose a date within the next ${config.advanceDays} days.`;
  }

  const bookingTimestamp = Date.parse(`${input.bookingDate}T${input.bookingTime}:00+05:30`);

  if (!Number.isFinite(bookingTimestamp) || bookingTimestamp < Date.now() + config.minNoticeMinutes * 60_000) {
    return `Bookings require at least ${config.minNoticeMinutes} minutes notice.`;
  }

  const bookingMinutes = timeToMinutes(input.bookingTime);

  if (!isTimeWithinOpeningHours(bookingMinutes, config.openTime, config.closeTime)) {
    return "Choose a time within the restaurant's opening hours.";
  }

  if (!isAlignedBookingSlot(input.bookingTime, config)) {
    return "Choose one of the available booking times.";
  }

  return null;
}

function normalizeBookingConfig(
  settings:
    | {
        opening_hours: Json;
        booking_enabled: boolean;
        booking_slot_minutes: number;
        booking_duration_minutes: number;
        booking_advance_days: number;
        booking_min_notice_minutes: number;
        booking_max_party_size: number;
      }
    | null,
): BookingConfig {
  const openingHours = isJsonRecord(settings?.opening_hours) ? settings.opening_hours : null;

  return {
    enabled: settings?.booking_enabled ?? false,
    openTime: typeof openingHours?.open === "string" ? openingHours.open : defaultBookingConfig.openTime,
    closeTime: typeof openingHours?.close === "string" ? openingHours.close : defaultBookingConfig.closeTime,
    slotMinutes: settings?.booking_slot_minutes ?? defaultBookingConfig.slotMinutes,
    durationMinutes: settings?.booking_duration_minutes ?? defaultBookingConfig.durationMinutes,
    advanceDays: settings?.booking_advance_days ?? defaultBookingConfig.advanceDays,
    minNoticeMinutes: settings?.booking_min_notice_minutes ?? defaultBookingConfig.minNoticeMinutes,
    maxPartySize: settings?.booking_max_party_size ?? defaultBookingConfig.maxPartySize,
  };
}

function isJsonRecord(value: Json | undefined): value is { [key: string]: Json | undefined } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hashAccessToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
