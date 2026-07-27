import Link from "next/link";
import { CalendarCheck2, ChevronRight, Clock3, MapPin, Search, Table2, Users } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  emptyAvailability,
  getRestaurantAvailabilityMap,
  type RestaurantAvailability,
} from "@/lib/table-availability";

type BookableRestaurant = {
  id: string;
  name: string;
  slug: string;
  type: string;
  cuisine: string[];
  city: string;
  state: string;
  address: string;
  coverUrl: string | null;
  isOpen: boolean;
  slotMinutes: number;
  maxPartySize: number;
  advanceDays: number;
  availability: RestaurantAvailability;
};

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const queryValue = params.q;
  const query = (Array.isArray(queryValue) ? queryValue[0] : queryValue)?.trim() ?? "";
  const restaurants = await getBookableRestaurants(query);

  return (
    <main className="customer-surface min-h-screen text-white">
      <MarketingNav />

      <section className="border-y border-white/10 bg-[#071117]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase text-orange-400">Table reservations</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
                Plan the table before you arrive.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                Choose a verified restaurant, select your preferred time, and track confirmation from your customer account.
              </p>
            </div>
            <Link
              href="/customer/bookings"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
            >
              <CalendarCheck2 className="h-4 w-4 text-emerald-300" />
              My reservations
            </Link>
          </div>

          <form action="/bookings" className="mt-8 grid gap-2 rounded-lg bg-white p-2 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
              <Input
                name="q"
                className="border-0 bg-white pl-9 text-zinc-950 shadow-none focus:ring-0"
                placeholder="Restaurant, cuisine, city, or area"
                defaultValue={query}
              />
            </div>
            <Button type="submit" className="bg-orange-500 text-white hover:bg-orange-600">
              Find a table
            </Button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-9 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              {query ? `Reservation results for "${query}"` : "Restaurants accepting reservations"}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {restaurants.length} {restaurants.length === 1 ? "restaurant" : "restaurants"} available to book online
            </p>
          </div>
          <Link href="/restaurants/search" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-300">
            Browse all restaurants <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {restaurants.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {restaurants.map((restaurant) => (
              <BookableRestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              icon={CalendarCheck2}
              title={query ? "No bookable restaurants found" : "Online reservations are not available yet"}
              description={
                query
                  ? "Try another restaurant name, cuisine, city, or area."
                  : "Restaurants that enable table reservations will appear here."
              }
            />
          </div>
        )}
      </section>

      <MarketingFooter />
    </main>
  );
}

function BookableRestaurantCard({ restaurant }: { restaurant: BookableRestaurant }) {
  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-white text-zinc-950 shadow-xl shadow-black/20">
      <Link href={`/restaurants/${restaurant.slug}`} className="block">
        <div
          className="relative aspect-[16/9] bg-zinc-200 bg-cover bg-center"
          style={restaurant.coverUrl ? { backgroundImage: `url("${restaurant.coverUrl}")` } : undefined}
        >
          {!restaurant.coverUrl ? <div className="restaurant-photo absolute inset-0" /> : null}
          <span
            className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-xs font-semibold ${
              restaurant.isOpen ? "bg-emerald-600 text-white" : "bg-zinc-900 text-white"
            }`}
          >
            {restaurant.isOpen ? "Open now" : "Currently closed"}
          </span>
        </div>
        <div className="p-4">
          <h3 className="truncate text-lg font-semibold">{restaurant.name}</h3>
          <p className="mt-1 truncate text-sm text-zinc-500">
            {restaurant.cuisine.join(", ") || restaurant.type}
          </p>
          <div className="mt-4 grid gap-2 text-sm text-zinc-600">
            <p className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-700" />
              {restaurant.city}, {restaurant.state}
            </p>
            <p className="inline-flex items-center gap-2">
              <Table2 className="h-4 w-4 text-emerald-700" />
              {restaurant.availability.label}
            </p>
            <p className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-emerald-700" />
              {restaurant.slotMinutes}-minute slots · up to {restaurant.advanceDays} days ahead
            </p>
            <p className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-700" />
              Online booking for up to {restaurant.maxPartySize} guests
            </p>
          </div>
        </div>
      </Link>
      <div className="grid grid-cols-[0.8fr_1.2fr] border-t border-zinc-200">
        <Link
          href={`/restaurants/${restaurant.slug}`}
          className="inline-flex h-12 items-center justify-center text-sm font-semibold transition hover:bg-zinc-50"
        >
          Details
        </Link>
        <Link
          href={`/restaurants/${restaurant.slug}/book`}
          className="inline-flex h-12 items-center justify-center gap-2 border-l border-zinc-200 bg-emerald-700 text-sm font-semibold text-white transition hover:bg-emerald-800"
        >
          <CalendarCheck2 className="h-4 w-4" />
          Reserve a table
        </Link>
      </div>
    </article>
  );
}

async function getBookableRestaurants(query: string): Promise<BookableRestaurant[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createAdminClient();
  const { data: settings, error: settingsError } = await supabase
    .from("restaurant_settings")
    .select("restaurant_id,booking_slot_minutes,booking_advance_days,booking_max_party_size")
    .eq("booking_enabled", true);

  if (settingsError || !settings?.length) return [];

  const settingsByRestaurant = new Map(settings.map((setting) => [setting.restaurant_id, setting]));
  const { data: restaurants, error: restaurantsError } = await supabase
    .from("restaurants")
    .select("id,name,slug,type,cuisine,city,state,address,cover_url,is_open")
    .in("id", [...settingsByRestaurant.keys()])
    .eq("verification_status", "APPROVED")
    .is("deletion_requested_at", null)
    .is("deleted_at", null)
    .order("rating", { ascending: false, nullsFirst: false });

  if (restaurantsError || !restaurants) return [];

  const availability = await getRestaurantAvailabilityMap(
    supabase,
    restaurants.map((restaurant) => restaurant.id),
  );
  const normalizedQuery = query.toLowerCase();

  return restaurants
    .filter((restaurant) => {
      if (!normalizedQuery) return true;
      return [
        restaurant.name,
        restaurant.type,
        restaurant.city,
        restaurant.state,
        restaurant.address,
        ...restaurant.cuisine,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    })
    .map((restaurant) => {
      const bookingSettings = settingsByRestaurant.get(restaurant.id);

      return {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        type: restaurant.type,
        cuisine: restaurant.cuisine,
        city: restaurant.city,
        state: restaurant.state,
        address: restaurant.address,
        coverUrl: restaurant.cover_url,
        isOpen: restaurant.is_open,
        slotMinutes: bookingSettings?.booking_slot_minutes ?? 30,
        maxPartySize: bookingSettings?.booking_max_party_size ?? 10,
        advanceDays: bookingSettings?.booking_advance_days ?? 30,
        availability: availability.get(restaurant.id) ?? emptyAvailability(),
      };
    });
}
