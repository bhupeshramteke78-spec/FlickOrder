import Link from "next/link";
import { MapPin, Search, Table2 } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { LocationSearchButton } from "@/components/marketing/location-search-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { formatDistance, getDistanceKm, hasCoordinates, parseCoordinate, type Coordinates } from "@/lib/geo";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { emptyAvailability, getRestaurantAvailabilityMap, type RestaurantAvailability } from "@/lib/table-availability";

type SearchRestaurant = {
  name: string;
  slug: string;
  type: string;
  cuisine: string[];
  city: string;
  state: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  is_open: boolean;
  availability: RestaurantAvailability;
};

export default async function RestaurantSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; lat?: string | string[]; lng?: string | string[] }>;
}) {
  const params = await searchParams;
  const queryValue = params.q;
  const latitude = parseCoordinate(Array.isArray(params.lat) ? params.lat[0] : params.lat);
  const longitude = parseCoordinate(Array.isArray(params.lng) ? params.lng[0] : params.lng);
  const userLocation = latitude != null && longitude != null ? { latitude, longitude } : null;
  const query = (Array.isArray(queryValue) ? queryValue[0] : queryValue)?.trim() ?? "";
  const restaurants = await getRestaurants(query, userLocation);

  return (
    <main className="customer-surface min-h-screen text-white">
      <section className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="text-4xl font-semibold tracking-tight text-white">Search restaurants</h1>
        <form action="/restaurants/search" className="mt-6 grid gap-2 rounded-lg bg-white p-2 sm:grid-cols-[1fr_auto_auto]">
          <Input
            name="q"
            className="border-0 bg-white text-zinc-950 shadow-none focus:ring-0"
            placeholder="Search by restaurant, cuisine, city, or category"
            defaultValue={query}
          />
          {userLocation ? (
            <>
              <input type="hidden" name="lat" value={userLocation.latitude} />
              <input type="hidden" name="lng" value={userLocation.longitude} />
            </>
          ) : null}
          <LocationSearchButton />
          <Button type="submit" variant="glass" className="border-orange-200/40 bg-orange-500/45 text-white">Search</Button>
        </form>
        {userLocation ? (
          <p className="mt-3 text-sm text-zinc-300">Showing restaurants nearest to your selected location first.</p>
        ) : null}

        {restaurants.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {restaurants.map((restaurant) => (
              <Link key={restaurant.slug} href={`/restaurants/${restaurant.slug}`}>
                <Card className="overflow-hidden border-0 bg-white p-0 text-zinc-950 shadow-xl shadow-black/20">
                  <div className="restaurant-photo h-36" />
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="truncate text-lg font-semibold">{restaurant.name}</h2>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        {restaurant.is_open ? "Open" : "Closed"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-zinc-500">
                      {restaurant.cuisine.length > 0 ? restaurant.cuisine.join(", ") : restaurant.type}
                    </p>
                    <p className="mt-3 inline-flex items-center gap-1 text-sm text-zinc-500">
                      <MapPin className="h-4 w-4" />
                      {formatDistance(restaurant.distanceKm) ?? `${restaurant.city}, ${restaurant.state}`}
                    </p>
                    <p className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      restaurant.availability.isFull
                        ? "bg-rose-50 text-rose-700"
                        : restaurant.availability.availableTables > 0
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-zinc-100 text-zinc-600"
                    }`}>
                      <Table2 className="h-3 w-3" />
                      {restaurant.availability.label}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              icon={Search}
              title={query ? "No restaurants found" : "No restaurants available"}
              description={query ? "Try another restaurant name, cuisine, city, or category." : "Registered restaurants will appear here."}
            />
          </div>
        )}
      </section>
      <MarketingFooter />
    </main>
  );
}

async function getRestaurants(query: string, userLocation: Coordinates | null): Promise<SearchRestaurant[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id,name,slug,type,cuisine,city,state,address,latitude,longitude,is_open")
    .eq("verification_status", "APPROVED")
    .is("deletion_requested_at", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    return [];
  }

  const normalizedQuery = query.toLowerCase();

  const availabilityByRestaurantId = await getRestaurantAvailabilityMap(supabase, data.map((restaurant) => restaurant.id));
  const mappedRestaurants = data.map((restaurant) => ({
    name: restaurant.name,
    slug: restaurant.slug,
    type: restaurant.type,
    cuisine: restaurant.cuisine,
    city: restaurant.city,
    state: restaurant.state,
    address: restaurant.address,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
    distanceKm: userLocation && hasCoordinates(restaurant) ? getDistanceKm(userLocation, restaurant) : null,
    is_open: restaurant.is_open,
    availability: availabilityByRestaurantId.get(restaurant.id) ?? emptyAvailability(),
  }));

  const sortedRestaurants = userLocation
    ? mappedRestaurants.sort((first, second) => {
        if (first.distanceKm == null && second.distanceKm == null) {
          return 0;
        }

        if (first.distanceKm == null) {
          return 1;
        }

        if (second.distanceKm == null) {
          return -1;
        }

        return first.distanceKm - second.distanceKm;
      })
    : mappedRestaurants;

  if (!normalizedQuery) {
    return sortedRestaurants;
  }

  return sortedRestaurants.filter((restaurant) => {
    const searchableText = [
      restaurant.name,
      restaurant.type,
      restaurant.city,
      restaurant.state,
      restaurant.address,
      ...restaurant.cuisine,
    ].join(" ").toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
}
