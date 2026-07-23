"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Clock, Search, Star, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { AboutSection } from "@/components/marketing/about-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { TrialSection } from "@/components/marketing/trial-section";
import type { RestaurantAvailability } from "@/lib/table-availability";

const filters = ["All", "Pure Veg", "Cafe", "Family", "Fine Dining", "Desserts"];

export type HomeRestaurant = {
  name: string;
  slug: string;
  type: string;
  cuisine: string[];
  city: string;
  is_open: boolean;
  availability: RestaurantAvailability;
};

export function HomePage({ restaurants }: { restaurants: HomeRestaurant[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const filteredRestaurants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedFilter = activeFilter.toLowerCase();

    return restaurants.filter((restaurant) => {
      const searchableText = [
        restaurant.name,
        restaurant.type,
        restaurant.city,
        ...restaurant.cuisine,
      ].join(" ").toLowerCase();
      const matchesSearch = !normalizedQuery || searchableText.includes(normalizedQuery);
      const matchesFilter = activeFilter === "All" || searchableText.includes(normalizedFilter);

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, query, restaurants]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();

    router.push(trimmedQuery ? `/restaurants/search?q=${encodeURIComponent(trimmedQuery)}` : "/restaurants/search");
  }

  return (
    <main className="customer-surface min-h-screen text-white">
      <MarketingNav />

      <section className="mx-auto max-w-7xl px-5 pb-10 pt-8">
        <div className="hero-blend relative overflow-hidden rounded-[28px] px-0 py-0 md:min-h-[430px]">
          <div className="hero-restaurant-art" aria-hidden="true" />
          <div className="relative z-10 max-w-2xl py-8 md:py-12">
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Great Food.
              <br />
              Better Experience.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-200">
              Discover restaurants near you. Scan, order, request service, and pay directly at your table.
            </p>
          </div>

          <form onSubmit={submitSearch} className="relative z-10 flex max-w-3xl gap-2 rounded-lg bg-white p-2 shadow-2xl shadow-black/30">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
              <Input
                className="border-0 pl-9 shadow-none focus:ring-0"
                placeholder="Search for restaurants, cuisines..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <Button type="submit" variant="glass" className="border-orange-200/40 bg-orange-500/45 text-white">Search</Button>
          </form>

          <div className="relative z-10 mt-5 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-lg border px-4 py-2 text-sm text-white backdrop-blur transition ${
                  activeFilter === filter
                    ? "border-orange-300/50 bg-orange-500/45"
                    : "border-white/10 bg-black/35 hover:border-white/25"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {restaurants.length > 0 ? (
          <>
            <div className="mt-10 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{query.trim() || activeFilter !== "All" ? "Search results" : "Popular Restaurants"}</h2>
              <Link href={query.trim() ? `/restaurants/search?q=${encodeURIComponent(query.trim())}` : "/restaurants/search"} className="text-sm text-zinc-300">View All</Link>
            </div>
            {filteredRestaurants.length > 0 ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {filteredRestaurants.map((restaurant) => (
                  <RestaurantCard key={restaurant.slug} restaurant={restaurant} />
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState icon={Search} title="No restaurants found" description="Try another restaurant name, cuisine, city, or category." />
              </div>
            )}
          </>
        ) : null}

        <AboutSection />

        <TrialSection />
      </section>
      <MarketingFooter />
    </main>
  );
}

function RestaurantCard({ restaurant }: { restaurant: HomeRestaurant }) {
  return (
    <Link href={`/restaurants/${restaurant.slug}`}>
      <Card className="overflow-hidden border-0 bg-white p-0 text-zinc-950 shadow-xl shadow-black/20">
        <div className="restaurant-photo h-32" />
        <div className="p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="truncate font-semibold">{restaurant.name}</h3>
            <span className="inline-flex items-center gap-1 text-xs text-amber-600">
              <Star className="h-3 w-3 fill-amber-400" />
              {restaurant.is_open ? "Open" : "Closed"}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-zinc-500">
            {restaurant.cuisine.length > 0 ? restaurant.cuisine.join(", ") : restaurant.type || restaurant.city}
          </p>
          <p className="mt-3 inline-flex items-center gap-1 text-xs text-zinc-500">
            <Clock className="h-3 w-3" />
            {restaurant.city}
          </p>
          <p className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
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
  );
}
