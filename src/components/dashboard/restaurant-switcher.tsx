"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { DashboardRestaurantOption } from "@/lib/dashboard-restaurant";
import { cn } from "@/lib/utils";

export function RestaurantSwitcher({
  restaurants,
  selectedRestaurantId,
  className,
}: {
  restaurants: DashboardRestaurantOption[];
  selectedRestaurantId: string | null;
  className?: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const hasMultipleRestaurants = restaurants.length > 1;

  if (restaurants.length === 0) {
    return null;
  }

  async function selectRestaurant(restaurantId: string) {
    if (!restaurantId || restaurantId === selectedRestaurantId) {
      return;
    }

    setIsLoading(true);
    const response = await fetch("/api/dashboard/restaurant-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setIsLoading(false);

    if (!response.ok) {
      toast.error(body?.error ?? "Unable to switch restaurant.");
      return;
    }

    toast.success("Restaurant switched.");
    router.refresh();
  }

  return (
    <div className={cn("relative", className)}>
      <select
        value={selectedRestaurantId ?? ""}
        onChange={(event) => void selectRestaurant(event.target.value)}
        disabled={!hasMultipleRestaurants || isLoading}
        aria-label="Select restaurant"
        className={cn(
          "h-10 w-full appearance-none rounded-lg border border-white/10 bg-white/[0.06] py-2 pl-3 pr-9 text-sm font-semibold text-white outline-none transition focus:border-emerald-300/50 disabled:cursor-default disabled:opacity-100",
          hasMultipleRestaurants ? "cursor-pointer hover:bg-white/[0.09]" : "",
        )}
      >
        {restaurants.map((restaurant) => (
          <option key={restaurant.restaurantId} value={restaurant.restaurantId} className="bg-[#071117] text-white">
            {restaurant.restaurantName}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-300">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
      </div>
    </div>
  );
}
