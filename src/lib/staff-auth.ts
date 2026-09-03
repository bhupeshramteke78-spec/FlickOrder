import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

export type StaffRole = "chef" | "waiter";

export type StaffSession = {
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
  role: StaffRole;
};

export type RestaurantStaffPins = {
  kitchenPin: string;
  waiterPin: string;
};

// Default fallback PINs generated deterministically from restaurant ID
export function generateDefaultStaffPins(restaurantId: string): RestaurantStaffPins {
  let hash = 0;
  for (let i = 0; i < restaurantId.length; i++) {
    hash = (hash * 31 + restaurantId.charCodeAt(i)) % 100000;
  }
  const kitchenNum = (Math.abs(hash) % 9000) + 1000;
  const waiterNum = ((Math.abs(hash * 7) + 53) % 9000) + 1000;

  return {
    kitchenPin: String(kitchenNum),
    waiterPin: String(waiterNum),
  };
}

export async function getRestaurantStaffPins(
  supabase: SupabaseClient<Database>,
  restaurantId: string,
): Promise<RestaurantStaffPins> {
  const { data: settings } = await supabase
    .from("restaurant_settings")
    .select("menu_preferences")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  const preferences = (settings?.menu_preferences as Record<string, unknown>) ?? {};
  const staffPins = preferences.staff_pins as Partial<RestaurantStaffPins> | undefined;

  const defaults = generateDefaultStaffPins(restaurantId);

  return {
    kitchenPin: staffPins?.kitchenPin && /^\d{4,6}$/.test(staffPins.kitchenPin) ? staffPins.kitchenPin : defaults.kitchenPin,
    waiterPin: staffPins?.waiterPin && /^\d{4,6}$/.test(staffPins.waiterPin) ? staffPins.waiterPin : defaults.waiterPin,
  };
}

export async function saveRestaurantStaffPins(
  supabase: SupabaseClient<Database>,
  restaurantId: string,
  pins: RestaurantStaffPins,
): Promise<boolean> {
  const { data: settings } = await supabase
    .from("restaurant_settings")
    .select("menu_preferences")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  const currentPrefs = (settings?.menu_preferences as Record<string, unknown>) ?? {};
  const updatedPrefs = {
    ...currentPrefs,
    staff_pins: {
      kitchenPin: pins.kitchenPin.trim(),
      waiterPin: pins.waiterPin.trim(),
    },
  };

  const { error } = await supabase
    .from("restaurant_settings")
    .update({ menu_preferences: updatedPrefs })
    .eq("restaurant_id", restaurantId);

  return !error;
}

export async function verifyAndCreateStaffSession(
  slug: string,
  role: StaffRole,
  pin: string,
): Promise<StaffSession | null> {
  const admin = createAdminClient();
  const { data: restaurant } = await admin
    .from("restaurants")
    .select("id, name, slug, verification_status, deleted_at, is_open")
    .eq("slug", slug)
    .maybeSingle();

  if (!restaurant || restaurant.deleted_at) {
    return null;
  }

  const staffPins = await getRestaurantStaffPins(admin, restaurant.id);
  const targetPin = role === "chef" ? staffPins.kitchenPin : staffPins.waiterPin;

  if (pin.trim() !== targetPin.trim()) {
    return null;
  }

  return {
    restaurantId: restaurant.id,
    restaurantSlug: restaurant.slug,
    restaurantName: restaurant.name,
    role,
  };
}

export async function getStaffSessionFromCookie(role: StaffRole): Promise<StaffSession | null> {
  try {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(`flickorder_staff_${role}`)?.value;

    if (!cookieValue) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(cookieValue, "base64").toString("utf-8")) as StaffSession;

    if (decoded && decoded.restaurantId && decoded.role === role) {
      return decoded;
    }

    return null;
  } catch {
    return null;
  }
}
