import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export const DASHBOARD_RESTAURANT_COOKIE = "flickorder_restaurant_id";

export type DashboardRestaurantOption = {
  restaurantId: string;
  restaurantName: string;
  memberRole: string;
  initials: string;
};

export type SelectedDashboardRestaurant = {
  userId: string;
  selected: DashboardRestaurantOption;
  restaurants: DashboardRestaurantOption[];
};

export async function getSelectedDashboardRestaurant(
  supabase: SupabaseClient<Database>,
): Promise<SelectedDashboardRestaurant | null> {
  const { data: userResult } = await supabase.auth.getUser();

  if (!userResult.user) {
    return null;
  }

  const { data: memberships } = await supabase
    .from("restaurant_members")
    .select("restaurant_id,role,created_at")
    .eq("profile_id", userResult.user.id)
    .order("created_at", { ascending: true });

  if (!memberships || memberships.length === 0) {
    return null;
  }

  const restaurantIds = memberships.map((membership) => membership.restaurant_id);
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id,name")
    .in("id", restaurantIds);

  const restaurantById = new Map((restaurants ?? []).map((restaurant) => [restaurant.id, restaurant.name]));
  const options = memberships.map((membership) => {
    const restaurantName = restaurantById.get(membership.restaurant_id)?.trim() || "Restaurant";

    return {
      restaurantId: membership.restaurant_id,
      restaurantName,
      memberRole: membership.role,
      initials: getInitials(restaurantName),
    };
  });

  const cookieStore = await cookies();
  const selectedRestaurantId = cookieStore.get(DASHBOARD_RESTAURANT_COOKIE)?.value;
  const selected = options.find((option) => option.restaurantId === selectedRestaurantId) ?? options[0];

  return {
    userId: userResult.user.id,
    selected,
    restaurants: options,
  };
}

export function getInitials(name: string) {
  const words = name
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return "R";
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}
