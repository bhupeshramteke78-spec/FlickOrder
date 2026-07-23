"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type DashboardRealtimeRefreshProps = {
  restaurantId: string | null;
};

const restaurantScopedTables = ["orders", "payments", "tables", "menu_items", "service_requests", "notifications"] as const;

export function DashboardRealtimeRefresh({ restaurantId }: DashboardRealtimeRefreshProps) {
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

    const channel = supabase.channel(`dashboard:${restaurantId}`);

    for (const table of restaurantScopedTables) {
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
        event: "*",
        schema: "public",
        table: "order_items",
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
