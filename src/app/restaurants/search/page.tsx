import Link from "next/link";
import { Search, Table2 } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { emptyAvailability, getRestaurantAvailabilityMap, type RestaurantAvailability } from "@/lib/table-availability";

type SearchRestaurant = {
  name: string;
  slug: string;
  type: string;
  cuisine: string[];
  city: string;
  is_open: boolean;
  availability: RestaurantAvailability;
};

export default async function RestaurantSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const queryValue = (await searchParams).q;
  const query = (Array.isArray(queryValue) ? queryValue[0] : queryValue)?.trim() ?? "";
  const restaurants = await getRestaurants(query);

  return (
    <main className="customer-surface min-h-screen text-white">
      <section className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="text-4xl font-semibold tracking-tight text-white">Search restaurants</h1>
        <form action="/restaurants/search" className="mt-6 flex gap-2 rounded-lg bg-white p-2">
          <Input
            name="q"
            className="border-0 bg-white text-zinc-950 shadow-none focus:ring-0"
            placeholder="Search by restaurant, cuisine, city, or category"
            defaultValue={query}
          />
          <Button type="submit" variant="glass" className="border-orange-200/40 bg-orange-500/45 text-white">Search</Button>
        </form>

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
                    <p className="mt-3 text-sm text-zinc-500">{restaurant.city}</p>
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

async function getRestaurants(query: string): Promise<SearchRestaurant[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id,name,slug,type,cuisine,city,is_open")
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
    is_open: restaurant.is_open,
    availability: availabilityByRestaurantId.get(restaurant.id) ?? emptyAvailability(),
  }));

  if (!normalizedQuery) {
    return mappedRestaurants;
  }

  return mappedRestaurants.filter((restaurant) => {
    const searchableText = [
      restaurant.name,
      restaurant.type,
      restaurant.city,
      ...restaurant.cuisine,
    ].join(" ").toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
}
