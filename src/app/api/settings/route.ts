import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import type { Json } from "@/lib/database.types";
import { hasPermission } from "@/lib/permissions";
import { getSubscriptionAccessForRestaurantId } from "@/lib/subscription-access";
import { isGoogleMapsUrl, normalizeGoogleMapsUrl } from "@/lib/maps";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm time format.");
const optionalUrlSchema = z.string().url().optional().nullable().or(z.literal(""));
const optionalGoogleMapsUrlSchema = optionalUrlSchema.refine((value) => {
  const normalized = normalizeGoogleMapsUrl(value);

  return !normalized || isGoogleMapsUrl(normalized);
}, "Use a valid Google Maps link.");

const settingsSchema = z.object({
  restaurant: z.object({
    name: z.string().min(2).max(120),
    type: z.string().min(2).max(80),
    cuisine: z.array(z.string().min(1).max(50)).max(12),
    email: z.string().email(),
    phone: z.string().min(7).max(20),
    city: z.string().min(2).max(80),
    state: z.string().min(2).max(80),
    address: z.string().min(5).max(300),
    googleMapsUrl: optionalGoogleMapsUrlSchema,
    logoUrl: optionalUrlSchema,
    coverUrl: optionalUrlSchema,
    isOpen: z.boolean(),
  }),
  settings: z.object({
    brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    upiId: z.string().min(3).max(80),
    upiDisplayName: z.string().min(2).max(120),
    taxRate: z.number().min(0).max(50),
    qrOrderingEnabled: z.boolean(),
    openingHours: z.object({
      open: timeSchema,
      close: timeSchema,
    }),
    menuPreferences: z.object({
      showPopularFirst: z.boolean(),
      showUnavailableItems: z.boolean(),
      defaultFoodTypeFilter: z.enum(["ALL", "VEG", "NON_VEG", "EGG"]),
    }),
  }),
});

async function getEditableMembership() {
  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context) {
    return { supabase, error: NextResponse.json({ error: "Restaurant membership not found." }, { status: 404 }) };
  }

  const membership = {
    restaurant_id: context.selected.restaurantId,
    role: context.selected.memberRole,
  };

  if (!hasPermission(membership.role, "manageSettings")) {
    return { supabase, error: NextResponse.json({ error: "Only owners and managers can update settings." }, { status: 403 }) };
  }

  const access = await getSubscriptionAccessForRestaurantId(supabase, membership.restaurant_id);

  if (!access.canManageRestaurant) {
    return { supabase, error: NextResponse.json({ error: access.message ?? "Subscription required to update settings." }, { status: 403 }) };
  }

  return { supabase, membership, error: null };
}

export async function PATCH(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const payload = settingsSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid settings details.", details: payload.error.flatten() }, { status: 422 });
  }

  const { supabase, membership, error } = await getEditableMembership();

  if (error || !membership) {
    return error;
  }

  const input = payload.data;
  const { error: restaurantError } = await supabase
    .from("restaurants")
    .update({
      name: input.restaurant.name,
      type: input.restaurant.type,
      cuisine: input.restaurant.cuisine,
      email: input.restaurant.email,
      phone: input.restaurant.phone,
      city: input.restaurant.city,
      state: input.restaurant.state,
      address: input.restaurant.address,
      google_maps_url: normalizeGoogleMapsUrl(input.restaurant.googleMapsUrl),
      logo_url: input.restaurant.logoUrl || null,
      cover_url: input.restaurant.coverUrl || null,
      is_open: input.restaurant.isOpen,
    })
    .eq("id", membership.restaurant_id);

  if (restaurantError) {
    return NextResponse.json({ error: restaurantError.message }, { status: 400 });
  }

  const { error: settingsError } = await supabase
    .from("restaurant_settings")
    .upsert({
      restaurant_id: membership.restaurant_id,
      brand_color: input.settings.brandColor,
      upi_id: input.settings.upiId,
      upi_display_name: input.settings.upiDisplayName,
      tax_rate: input.settings.taxRate,
      qr_ordering_enabled: input.settings.qrOrderingEnabled,
      opening_hours: input.settings.openingHours as Json,
      menu_preferences: input.settings.menuPreferences as Json,
    }, {
      onConflict: "restaurant_id",
    })

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
