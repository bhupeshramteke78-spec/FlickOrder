"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { LocateFixed, MapPin, Search, Star, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import type { HomeRestaurant } from "@/components/marketing/home-page";
import { getBrowserLocation, getBrowserLocationMessage } from "@/lib/browser-location";
import { formatDistance, getDistanceKm, hasCoordinates, type Coordinates } from "@/lib/geo";

const filters = ["All", "Pure Veg", "Cafe", "Family", "Fine Dining", "Desserts"];

export function HomeRestaurantExplorer({ restaurants }: { restaurants: HomeRestaurant[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "failed">("idle");
  const [locationMessage, setLocationMessage] = useState("");
  const filteredRestaurants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedFilter = activeFilter.toLowerCase();

    const filtered = restaurants.filter((restaurant) => {
      const searchableText = [
        restaurant.name,
        restaurant.type,
        restaurant.city,
        restaurant.state,
        restaurant.address,
        ...restaurant.cuisine,
      ].join(" ").toLowerCase();
      const matchesSearch = !normalizedQuery || searchableText.includes(normalizedQuery);
      const matchesFilter = activeFilter === "All" || searchableText.includes(normalizedFilter);

      return matchesSearch && matchesFilter;
    });

    return filtered
      .map((restaurant) => ({
        ...restaurant,
        distanceKm: userLocation && hasCoordinates(restaurant) ? getDistanceKm(userLocation, restaurant) : null,
      }))
      .sort((first, second) => {
        if (!userLocation) {
          return 0;
        }

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
      });
  }, [activeFilter, query, restaurants, userLocation]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();

    const params = new URLSearchParams();

    if (trimmedQuery) {
      params.set("q", trimmedQuery);
    }

    if (userLocation) {
      params.set("lat", String(userLocation.latitude));
      params.set("lng", String(userLocation.longitude));
    }

    router.push(`/restaurants/search${params.toString() ? `?${params.toString()}` : ""}`);
  }

  async function useCurrentLocation() {
    setLocationMessage("");
    setLocationStatus("loading");

    const result = await getBrowserLocation();

    if (!result.ok) {
      setLocationMessage(getBrowserLocationMessage(result.reason));
      setLocationStatus("failed");
      return;
    }

    setUserLocation(result.coordinates);
    setLocationStatus("idle");
  }

  return (
    <>
      <form onSubmit={submitSearch} className="relative z-10 flex max-w-2xl flex-col gap-2 rounded-2xl border border-white/15 bg-[#0a1822]/90 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl sm:flex-row focus-within:border-orange-500/50 transition-colors">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-orange-400" />
          <Input
            className="border-0 bg-transparent pl-10 text-white placeholder:text-zinc-500 shadow-none focus-visible:ring-0 text-sm"
            placeholder="Search for restaurants, cuisines..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Button 
          type="button" 
          variant="glass" 
          onClick={useCurrentLocation} 
          disabled={locationStatus === "loading"}
          className="rounded-xl border-white/10 bg-white/[0.06] text-zinc-200 hover:bg-white/10 hover:text-white text-xs sm:text-sm"
        >
          <LocateFixed className="h-4 w-4 text-amber-400 mr-1.5" />
          {locationStatus === "loading" ? "Locating..." : "Near me"}
        </Button>
        <Button 
          type="submit" 
          className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs sm:text-sm px-6 shadow-md shadow-orange-500/25 hover:opacity-95 hover:scale-[1.02] transition"
        >
          Search
        </Button>
      </form>
      {locationStatus === "failed" && locationMessage ? (
        <p className="relative z-10 mt-2 max-w-2xl text-sm leading-6 text-orange-200">
          {locationMessage}
        </p>
      ) : null}

      <div className="relative z-10 mt-6 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold backdrop-blur-md transition ${
              activeFilter === filter
                ? "border border-orange-500/50 bg-gradient-to-r from-orange-500/25 to-amber-500/25 text-amber-200 shadow-md shadow-orange-500/20"
                : "border border-white/10 bg-white/[0.04] text-zinc-400 hover:border-white/20 hover:text-white"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {restaurants.length > 0 ? (
        <>
          <div className="mt-10 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">{query.trim() || activeFilter !== "All" ? "Search results" : "Popular Restaurants"}</h2>
            <Link href={buildSearchHref(query, userLocation)} className="text-sm font-semibold text-orange-300 hover:text-white transition">
              View All →
            </Link>
          </div>
          {filteredRestaurants.length > 0 ? (
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
    </>
  );
}

function RestaurantCard({ restaurant }: { restaurant: HomeRestaurant & { distanceKm?: number | null } }) {
  const distanceLabel = formatDistance(restaurant.distanceKm);

  return (
    <Link href={`/restaurants/${restaurant.slug}`}>
      <Card className="group overflow-hidden rounded-[24px] border border-white/10 bg-[#0c1822]/90 p-0 text-white shadow-xl shadow-black/40 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-2xl hover:shadow-orange-500/10">
        <div className="restaurant-photo relative h-36 w-full overflow-hidden bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent transition-transform duration-300 group-hover:scale-105" />
        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-bold text-white group-hover:text-orange-300 transition-colors">{restaurant.name}</h3>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold border ${
              restaurant.is_open 
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : "bg-zinc-800/80 border-white/10 text-zinc-400"
            }`}>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {restaurant.is_open ? "Open" : "Closed"}
            </span>
          </div>
          <p className="mt-1.5 truncate text-xs text-zinc-400">
            {restaurant.cuisine.length > 0 ? restaurant.cuisine.join(", ") : restaurant.type || restaurant.city}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.07] pt-3">
            <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
              <MapPin className="h-3.5 w-3.5 text-orange-400" />
              <span className="truncate max-w-[120px]">{distanceLabel ?? `${restaurant.city}`}</span>
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
              restaurant.availability.isFull
                ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
                : restaurant.availability.availableTables > 0
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                  : "bg-white/[0.05] border-white/10 text-zinc-300"
            }`}>
              <Table2 className="h-3 w-3" />
              {restaurant.availability.label}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function buildSearchHref(query: string, userLocation: Coordinates | null) {
  const params = new URLSearchParams();
  const trimmedQuery = query.trim();

  if (trimmedQuery) {
    params.set("q", trimmedQuery);
  }

  if (userLocation) {
    params.set("lat", String(userLocation.latitude));
    params.set("lng", String(userLocation.longitude));
  }

  return `/restaurants/search${params.toString() ? `?${params.toString()}` : ""}`;
}
