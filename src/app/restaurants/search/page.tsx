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
    <main className="min-h-screen bg-[#071117] text-white selection:bg-orange-500/30">
      {/* Top Header & Search Hero with Seamless Sunset Horizon Glow */}
      <div className="relative overflow-hidden">
        {/* Radiant Sunset Horizon Glow behind Navbar and Hero */}
        <div 
          className="pointer-events-none absolute inset-x-0 -top-32 h-[680px] opacity-90"
          style={{
            background: "radial-gradient(ellipse 90% 65% at 50% -5%, rgba(249, 115, 22, 0.45), rgba(239, 68, 68, 0.25) 50%, rgba(7, 17, 23, 0) 90%)",
          }}
          aria-hidden="true"
        />
        <div 
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[900px] h-[380px] rounded-full blur-[110px] opacity-40 bg-gradient-to-b from-amber-400 via-orange-500 to-rose-600"
          aria-hidden="true"
        />

        <MarketingNav />

        <section className="relative z-10 mx-auto max-w-7xl px-5 pb-12 pt-6 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-300 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Dine Out With Confidence</span>
          </div>

          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="max-w-2xl text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Find a restaurant, explore the menu, and{" "}
                <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
                  dine your way.
                </span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-zinc-300">
                Search verified restaurants, check live floor seating, and scan the table QR code to order seamlessly.
              </p>
            </div>
          </div>

          <form action="/restaurants/search" className="mt-8 flex flex-col gap-2 rounded-2xl border border-white/15 bg-[#0a1822]/90 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl sm:flex-row focus-within:border-orange-500/50 transition-colors">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-orange-400" />
              <Input
                name="q"
                className="border-0 bg-transparent pl-10 text-white placeholder:text-zinc-500 shadow-none focus-visible:ring-0 text-sm"
                placeholder="Restaurant, cuisine, city, or area..."
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
            <Button 
              type="submit" 
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:opacity-95"
            >
              Search
            </Button>
          </form>

          <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => (
              <Link
                key={item}
                href={buildCategoryHref(item, query, userLocation)}
                className={`shrink-0 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold backdrop-blur-md transition ${
                  category === item
                    ? "border border-orange-500/50 bg-gradient-to-r from-orange-500/25 to-amber-500/25 text-amber-200 shadow-md shadow-orange-500/20"
                    : "border border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:text-white"
                }`}
              >
                {item}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-10">
        {/* Subtle Ambient Sunset Orb */}
        <div 
          className="pointer-events-none absolute left-1/3 top-10 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Restaurants</h2>
            <p className="mt-1 text-sm text-zinc-400">
              {restaurants.length} {restaurants.length === 1 ? "restaurant" : "restaurants"} available
            </p>
          </div>
        </div>

        {restaurants.length === 0 ? (
          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.02] p-10 text-center backdrop-blur-xl">
            <EmptyState
              icon={Search}
              title="No restaurants matched your search"
              description="Try another area, city, cuisine, or category keyword."
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
    <article className="group overflow-hidden rounded-[24px] border border-white/10 bg-[#0c1822]/90 text-white shadow-xl shadow-black/40 backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:border-orange-500/40 hover:shadow-2xl hover:shadow-orange-500/10 flex flex-col justify-between">
      <Link href={`/restaurants/${restaurant.slug}`} className="block">
        <div
          className="relative h-48 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent bg-cover bg-center overflow-hidden"
          style={restaurant.coverUrl ? { backgroundImage: `url("${restaurant.coverUrl}")` } : undefined}
        >
          {!restaurant.coverUrl ? <div className="restaurant-photo absolute inset-0" /> : null}
          <span className={`absolute left-3.5 top-3.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border backdrop-blur-md ${
            restaurant.isOpen 
              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" 
              : "bg-zinc-900/80 border-white/10 text-zinc-400"
          }`}>
            {restaurant.isOpen ? "Open" : "Closed"}
          </span>
          {restaurant.hasOffers ? (
            <span className="absolute bottom-3 left-3.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-md">
              Special Offers Available
            </span>
          ) : null}
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-white group-hover:text-orange-300 transition-colors">{restaurant.name}</h3>
              <p className="mt-1 truncate text-xs text-zinc-400">{restaurant.cuisine.join(", ") || restaurant.type}</p>
            </div>
            {restaurant.rating != null ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 text-xs font-bold text-amber-300">
                {restaurant.rating.toFixed(1)} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              </span>
            ) : null}
          </div>
          <div className="mt-4 grid gap-2 text-xs text-zinc-300 border-t border-white/[0.07] pt-4">
            <p className="inline-flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-orange-400" />
              {formatDistance(restaurant.distanceKm) ?? `${restaurant.city}, ${restaurant.state}`}
            </p>
            <p className="inline-flex items-center gap-2">
              <Table2 className="h-3.5 w-3.5 text-emerald-400" />
              {restaurant.availability.label}
            </p>
            {restaurant.reviewCount > 0 ? (
              <p className="inline-flex items-center gap-2 text-zinc-400">
                <Star className="h-3.5 w-3.5 text-amber-400" />
                {restaurant.reviewCount} verified reviews
              </p>
            ) : null}
          </div>
        </div>
      </Link>
      <div className="border-t border-white/10 p-3 bg-white/[0.02]">
        <Link 
          href={`/restaurants/${restaurant.slug}`} 
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white/[0.04] text-xs sm:text-sm font-bold text-orange-300 hover:bg-orange-500/15 hover:text-white transition"
        >
          <Utensils className="h-3.5 w-3.5 text-orange-400" /> View Menu & Details →
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
