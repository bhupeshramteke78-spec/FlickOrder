import { HomePage } from "@/components/marketing/home-page";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { emptyAvailability, getRestaurantAvailabilityMap } from "@/lib/table-availability";

export default async function Page() {
  const restaurants = await getRegisteredRestaurants();

  return <HomePage restaurants={restaurants} />;
}

async function getRegisteredRestaurants() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id,name,slug,type,cuisine,city,state,address,is_open")
    .eq("verification_status", "APPROVED")
    .is("deletion_requested_at", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    return [];
  }

  const availabilityByRestaurantId = await getRestaurantAvailabilityMap(supabase, data.map((restaurant) => restaurant.id));

  return data.map((restaurant) => ({
    name: restaurant.name,
    slug: restaurant.slug,
    type: restaurant.type,
    cuisine: restaurant.cuisine,
    city: restaurant.city,
    state: restaurant.state,
    address: restaurant.address,
    is_open: restaurant.is_open,
    availability: availabilityByRestaurantId.get(restaurant.id) ?? emptyAvailability(),
  }));
}
