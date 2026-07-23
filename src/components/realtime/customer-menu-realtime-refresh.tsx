"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type CustomerMenuRealtimeRefreshProps = {
  restaurantId: string | null;
};

const menuTables = ["categories", "menu_items", "restaurant_settings"] as const;

export function CustomerMenuRealtimeRefresh({ restaurantId }: CustomerMenuRealtimeRefreshProps) {
  const router = useRouter();
  const refreshTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!restaurantId) {
      return;
    }

    const supabase = createClient();
    const scheduleRefresh = () => {
      if (refreshTimer.current) {
        window.clearTimeout(refreshTimer.current);
      }

      refreshTimer.current = window.setTimeout(() => {
        router.refresh();
      }, 350);
    };

    const channel = supabase.channel(`customer-menu:${restaurantId}`);

    for (const table of menuTables) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        scheduleRefresh,
      );
    }

    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "restaurants",
        filter: `id=eq.${restaurantId}`,
      },
      scheduleRefresh,
    );

    channel.subscribe();

    return () => {
      if (refreshTimer.current) {
        window.clearTimeout(refreshTimer.current);
      }

      void supabase.removeChannel(channel);
    };
  }, [restaurantId, router]);

  return null;
}
