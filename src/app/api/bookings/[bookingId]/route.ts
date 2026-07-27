import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hasPermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { bookingStatusUpdateSchema } from "@/lib/validations/bookings";

export const runtime = "nodejs";

const paramsSchema = z.object({
  bookingId: z.string().uuid(),
});

export async function GET(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const parsedParams = paramsSchema.safeParse(await params);
  const token = new URL(request.url).searchParams.get("token");

  if (!parsedParams.success || !token) {
    return NextResponse.json({ error: "A valid booking link is required." }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data: booking, error } = await admin
    .from("restaurant_bookings")
    .select(
      "id,restaurant_id,table_id,customer_name,party_size,booking_date,booking_time,duration_minutes,special_request,status,confirmation_code,access_token_hash,decline_reason,created_at,updated_at",
    )
    .eq("id", parsedParams.data.bookingId)
    .eq("access_token_hash", hashAccessToken(token))
    .maybeSingle();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const [{ data: restaurant }, { data: table }] = await Promise.all([
    admin.from("restaurants").select("name,slug,address,city,state,google_maps_url").eq("id", booking.restaurant_id).maybeSingle(),
    booking.table_id
      ? admin.from("tables").select("table_number").eq("id", booking.table_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return NextResponse.json({
    booking: {
      id: booking.id,
      customerName: booking.customer_name,
      partySize: booking.party_size,
      bookingDate: booking.booking_date,
      bookingTime: booking.booking_time,
      durationMinutes: booking.duration_minutes,
      specialRequest: booking.special_request,
      status: booking.status,
      confirmationCode: booking.confirmation_code,
      declineReason: booking.decline_reason,
      tableNumber: table?.table_number ?? null,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
    },
    restaurant: restaurant
      ? {
          name: restaurant.name,
          slug: restaurant.slug,
          address: restaurant.address,
          city: restaurant.city,
          state: restaurant.state,
          googleMapsUrl: restaurant.google_maps_url,
        }
      : null,
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const parsedParams = paramsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid booking id." }, { status: 422 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const payload = bookingStatusUpdateSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Choose a valid booking action." }, { status: 422 });
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: booking } = await supabase
    .from("restaurant_bookings")
    .select("restaurant_id,status")
    .eq("id", parsedParams.data.bookingId)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from("restaurant_members")
    .select("role")
    .eq("restaurant_id", booking.restaurant_id)
    .eq("profile_id", auth.user.id)
    .maybeSingle();

  if (!membership || !hasPermission(membership.role, "manageBookings")) {
    return NextResponse.json({ error: "You do not have permission to manage bookings." }, { status: 403 });
  }

  const admin = createAdminClient();
  const update = {
    status: payload.data.status,
    accepted_by: payload.data.status === "CONFIRMED" ? auth.user.id : null,
    accepted_at: payload.data.status === "CONFIRMED" ? new Date().toISOString() : null,
    decline_reason: payload.data.status === "DECLINED" ? payload.data.declineReason ?? null : null,
  };
  const { error } = await admin
    .from("restaurant_bookings")
    .update(update)
    .eq("id", parsedParams.data.bookingId)
    .eq("restaurant_id", booking.restaurant_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await admin.from("audit_logs").insert({
    actor_id: auth.user.id,
    restaurant_id: booking.restaurant_id,
    action: `BOOKING_${payload.data.status}`,
    entity: "restaurant_booking",
    entity_id: parsedParams.data.bookingId,
    metadata: { previousStatus: booking.status, declineReason: payload.data.declineReason ?? null },
  });

  return NextResponse.json({ ok: true });
}

function hashAccessToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
