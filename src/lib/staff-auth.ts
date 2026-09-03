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
  date: string; // YYYY-MM-DD
};

export type RestaurantStaffPins = {
  kitchenPin: string;
  waiterPin: string;
};

export type StoredStaffPins = {
  kitchenPin?: string;
  waiterPin?: string;
  updatedAtDate?: string; // YYYY-MM-DD
};

export function getTodayDateString(): string {
  // Use Indian Standard Time (Asia/Kolkata) date string YYYY-MM-DD
  const now = new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// Generate daily deterministic 4-digit PINs that rotate automatically every midnight
export function generateDailyStaffPins(
  restaurantId: string,
  dateStr = getTodayDateString(),
): RestaurantStaffPins {
  const seed = `${restaurantId}-${dateStr}`;
  let hash1 = 0;
  let hash2 = 0;

  for (let i = 0; i < seed.length; i++) {
    hash1 = (hash1 * 37 + seed.charCodeAt(i) * 17) % 2147483647;
    hash2 = (hash2 * 41 + seed.charCodeAt(seed.length - 1 - i) * 23) % 2147483647;
  }

  const kitchenNum = (Math.abs(hash1) % 9000) + 1000;
  let waiterNum = (Math.abs(hash2) % 9000) + 1000;
  if (waiterNum === kitchenNum) {
    waiterNum = ((waiterNum + 1357) % 9000) + 1000;
  }

  return {
    kitchenPin: String(kitchenNum),
    waiterPin: String(waiterNum),
  };
}

export async function getRestaurantStaffPins(
  supabase: SupabaseClient<Database>,
  restaurantId: string,
): Promise<RestaurantStaffPins> {
  const today = getTodayDateString();
  const dailyDefaults = generateDailyStaffPins(restaurantId, today);

  const { data: settings } = await supabase
    .from("restaurant_settings")
    .select("menu_preferences")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  const preferences = (settings?.menu_preferences as Record<string, unknown>) ?? {};
  const staffPins = preferences.staff_pins as StoredStaffPins | undefined;

  // If the owner explicitly reset/saved PINs TODAY, honor the owner's manual override
  if (staffPins && staffPins.updatedAtDate === today) {
    return {
      kitchenPin:
        staffPins.kitchenPin && /^\d{4,6}$/.test(staffPins.kitchenPin)
          ? staffPins.kitchenPin
          : dailyDefaults.kitchenPin,
      waiterPin:
        staffPins.waiterPin && /^\d{4,6}$/.test(staffPins.waiterPin)
          ? staffPins.waiterPin
          : dailyDefaults.waiterPin,
    };
  }

  // Otherwise, return today's daily auto-rotated PINs
  return dailyDefaults;
}

export async function saveRestaurantStaffPins(
  supabase: SupabaseClient<Database>,
  restaurantId: string,
  pins: RestaurantStaffPins,
): Promise<boolean> {
  const today = getTodayDateString();
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
      updatedAtDate: today,
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
    date: getTodayDateString(),
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
    const today = getTodayDateString();

    // Verify session belongs to today only
    if (decoded && decoded.restaurantId && decoded.role === role && decoded.date === today) {
      return decoded;
    }

    return null;
  } catch {
    return null;
  }
}
