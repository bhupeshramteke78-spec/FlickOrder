import Link from "next/link";
import { MapPin, Search, Star, Table2, Utensils } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { LocationSearchButton } from "@/components/marketing/location-search-button";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { formatDistance, getDistanceKm, hasCoordinates, parseCoordinate, type Coordinates } from "@/lib/geo";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { emptyAvailability, getRestaurantAvailabilityMap, type RestaurantAvailability } from "@/lib/table-availability";

type SearchRestaurant = {
  id: string;
  name: string;
  slug: string;
  type: string;
  cuisine: string[];
  city: string;
  state: string;
  address: string;
  coverUrl: string | null;
  logoUrl: string | null;
  rating: number | null;
  reviewCount: number;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  isOpen: boolean;
  hasOffers: boolean;
  availability: RestaurantAvailability;
};

const categories = ["All", "Pure Veg", "Cafe", "Family", "Fine Dining", "Desserts"];

export default async function RestaurantSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = getParam(params.q);
  const category = getParam(params.category) || "All";
  const latitudeValue = getParam(params.lat);
  const longitudeValue = getParam(params.lng);
  const latitude = latitudeValue ? parseCoordinate(latitudeValue) : null;
  const longitude = longitudeValue ? parseCoordinate(longitudeValue) : null;
  const userLocation = latitude != null && longitude != null ? { latitude, longitude } : null;
  const restaurants = await getRestaurants(query, category, userLocation);

  return (
    <main className="customer-surface min-h-screen text-white">
      <MarketingNav />
      <section className="border-b border-white/10 bg-[#071117]">
        <div className="mx-auto max-w-7xl px-5 py-8">
          <p className="text-sm font-semibold uppercase text-orange-400">Dine out with confidence</p>
          <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="max-w-2xl text-3xl font-semibold sm:text-4xl">Find a restaurant, explore the menu, and dine your way.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                Search verified restaurants, check live floor seating, and scan the table QR code to order seamlessly.
              </p>
            </div>
          </div>

          <form action="/restaurants/search" className="mt-7 grid gap-2 rounded-lg bg-white p-2 sm:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
              <Input
                name="q"
                className="border-0 bg-white pl-9 text-zinc-950 shadow-none focus:ring-0"
                placeholder="Restaurant, cuisine, city, or area"
                defaultValue={query}
              />
            </div>
            {userLocation ? (
              <>
                <input type="hidden" name="lat" value={userLocation.latitude} />
                <input type="hidden" name="lng" value={userLocation.longitude} />
              </>
            ) : null}
            <LocationSearchButton />
            <Button type="submit" className="bg-orange-500 text-white hover:bg-orange-600">Search</Button>
          </form>

          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => (
              <Link
                key={item}
                href={buildCategoryHref(item, query, userLocation)}
                className={`shrink-0 rounded-lg border px-4 py-2 text-sm transition ${
                  category === item ? "border-orange-400 bg-orange-500 text-white" : "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/25"
                }`}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Restaurants</h2>
            <p className="mt-1 text-sm text-zinc-400">
              {restaurants.length} {restaurants.length === 1 ? "restaurant" : "restaurants"} available
            </p>
          </div>
        </div>

        {restaurants.length === 0 ? (
          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.03] p-8">
            <EmptyState
              icon={Search}
              title="No restaurants matched your search"
              description="Try another area, city, cuisine, or category keyword."
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </section>
      <MarketingFooter />
    </main>
  );
}

function RestaurantCard({ restaurant }: { restaurant: SearchRestaurant }) {
  return (
    <article className="overflow-hidden rounded-lg border border-zinc-200 bg-white text-zinc-950 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <Link href={`/restaurants/${restaurant.slug}`} className="block">
        <div
          className="relative h-44 bg-zinc-100 bg-cover bg-center"
          style={restaurant.coverUrl ? { backgroundImage: `url("${restaurant.coverUrl}")` } : undefined}
        >
          {!restaurant.coverUrl ? <div className="restaurant-photo absolute inset-0" /> : null}
          <span className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-xs font-semibold ${restaurant.isOpen ? "bg-emerald-600 text-white" : "bg-zinc-900 text-white"}`}>
            {restaurant.isOpen ? "Open" : "Closed"}
          </span>
          {restaurant.hasOffers ? <span className="absolute bottom-3 left-3 rounded-md bg-orange-500 px-2.5 py-1 text-xs font-semibold text-white">Menu offers available</span> : null}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold">{restaurant.name}</h3>
              <p className="mt-1 truncate text-sm text-zinc-500">{restaurant.cuisine.join(", ") || restaurant.type}</p>
            </div>
            {restaurant.rating != null ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-700 px-2 py-1 text-xs font-semibold text-white">
                {restaurant.rating.toFixed(1)} <Star className="h-3 w-3 fill-white" />
              </span>
            ) : null}
          </div>
          <div className="mt-4 grid gap-2 text-sm text-zinc-600">
            <p className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{formatDistance(restaurant.distanceKm) ?? `${restaurant.city}, ${restaurant.state}`}</p>
            <p className="inline-flex items-center gap-2"><Table2 className="h-4 w-4" />{restaurant.availability.label}</p>
            {restaurant.reviewCount > 0 ? <p className="inline-flex items-center gap-2"><Star className="h-4 w-4" />{restaurant.reviewCount} verified reviews</p> : null}
          </div>
        </div>
      </Link>
      <div className="grid grid-cols-1 border-t border-zinc-200">
        <Link href={`/restaurants/${restaurant.slug}`} className="inline-flex h-12 items-center justify-center gap-2 text-sm font-semibold text-emerald-800 hover:bg-zinc-50">
          <Utensils className="h-4 w-4" /> View Menu & Details
        </Link>
      </div>
    </article>
  );
}

async function getRestaurants(query: string, category: string, userLocation: Coordinates | null): Promise<SearchRestaurant[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id,name,slug,type,cuisine,city,state,address,cover_url,logo_url,rating,latitude,longitude,is_open")
    .eq("verification_status", "APPROVED")
    .is("deletion_requested_at", null)
    .is("deleted_at", null)
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(100);

  if (error || !data) return [];

  const ids = data.map((restaurant) => restaurant.id);
  const [availability, reviewsResult, offersResult] = await Promise.all([
    getRestaurantAvailabilityMap(supabase, ids),
    supabase.from("reviews").select("restaurant_id").in("restaurant_id", ids),
    supabase.from("menu_items").select("restaurant_id").in("restaurant_id", ids).not("offer_price", "is", null).eq("is_available", true),
  ]);
  const reviewCounts = countByRestaurant(reviewsResult.data ?? []);
  const offerIds = new Set((offersResult.data ?? []).map((item) => item.restaurant_id));
  const normalizedQuery = query.toLowerCase();
  const normalizedCategory = category.toLowerCase();

  return data
    .map((restaurant) => ({
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      type: restaurant.type,
      cuisine: restaurant.cuisine,
      city: restaurant.city,
      state: restaurant.state,
      address: restaurant.address,
      coverUrl: restaurant.cover_url,
      logoUrl: restaurant.logo_url,
      rating: restaurant.rating == null ? null : Number(restaurant.rating),
      reviewCount: reviewCounts.get(restaurant.id) ?? 0,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      distanceKm:
        userLocation && hasCoordinates(restaurant)
          ? getDistanceKm(userLocation, { latitude: restaurant.latitude, longitude: restaurant.longitude })
          : null,
      isOpen: restaurant.is_open,
      hasOffers: offerIds.has(restaurant.id),
      availability: availability.get(restaurant.id) ?? emptyAvailability(),
    }))
    .filter((restaurant) => {
      if (normalizedCategory !== "all") {
        const matchesCategory =
          restaurant.type.toLowerCase().includes(normalizedCategory) ||
          restaurant.cuisine.some((item) => item.toLowerCase().includes(normalizedCategory));
        if (!matchesCategory) return false;
      }

      if (!normalizedQuery) return true;

      return (
        restaurant.name.toLowerCase().includes(normalizedQuery) ||
        restaurant.city.toLowerCase().includes(normalizedQuery) ||
        restaurant.state.toLowerCase().includes(normalizedQuery) ||
        restaurant.address.toLowerCase().includes(normalizedQuery) ||
        restaurant.type.toLowerCase().includes(normalizedQuery) ||
        restaurant.cuisine.some((item) => item.toLowerCase().includes(normalizedQuery))
      );
    });
}

function countByRestaurant(rows: Array<{ restaurant_id: string }>) {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.restaurant_id, (map.get(row.restaurant_id) ?? 0) + 1);
  }
  return map;
}

function buildCategoryHref(category: string, query: string, userLocation: Coordinates | null) {
  const params = new URLSearchParams();
  if (category !== "All") params.set("category", category);
  if (query) params.set("q", query);
  if (userLocation) {
    params.set("lat", userLocation.latitude.toString());
    params.set("lng", userLocation.longitude.toString());
  }
  const serialized = params.toString();
  return serialized ? `/restaurants/search?${serialized}` : "/restaurants/search";
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
