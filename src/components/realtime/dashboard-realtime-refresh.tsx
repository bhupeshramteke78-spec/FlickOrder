"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { playNotificationChime } from "@/lib/notification-sound";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

type DashboardRealtimeRefreshProps = {
  restaurantId: string | null;
};

const restaurantScopedTables = [
  "orders",
  "payments",
  "tables",
  "menu_items",
  "service_requests",
  "notifications",
  "restaurant_bookings",
] as const;

const notifiedOrderStorageKey = "flickorder_notified_order_ids";

type RealtimeOrderRow = {
  id: string;
  order_number: string | null;
  status: string | null;
  total: number | null;
};

type RealtimeBookingRow = {
  id: string;
  customer_name: string | null;
  party_size: number | null;
  booking_time: string | null;
};

type RealtimeServiceRequestRow = {
  id: string;
  table_number: string | null;
  type: string | null;
};

export function DashboardRealtimeRefresh({ restaurantId }: DashboardRealtimeRefreshProps) {
  const router = useRouter();
  const refreshTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!restaurantId) {
      return;
    }

    const unlockAudio = () => {
      // Audio unlock on user interaction
    };

    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    const supabase = createClient();
    const scheduleRefresh = () => {
      if (refreshTimer.current) {
        window.clearTimeout(refreshTimer.current);
      }

      refreshTimer.current = window.setTimeout(() => {
        router.refresh();
      }, 700);
    };

    const channel = supabase.channel(`dashboard:${restaurantId}`);

    // 1. Live Incoming Orders
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "orders",
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      async (payload) => {
        const order = payload.new as RealtimeOrderRow;

        if (!order.id || hasAlreadyNotified(order.id)) {
          scheduleRefresh();
          return;
        }

        rememberNotifiedOrder(order.id);

        const orderLabel = order.order_number ? `#${order.order_number}` : "New order";
        const totalLabel = formatCurrency(Number(order.total ?? 0));

        toast.success("New order received 🔔", {
          description: `${orderLabel} - ${totalLabel}`,
          action: {
            label: "Open",
            onClick: () => router.push("/dashboard/orders"),
          },
        });

        await playNotificationChime("order");
        scheduleRefresh();
      },
    );

    // 2. Order Status Updates (Kitchen / Waiter sounds)
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      async (payload) => {
        const newOrder = payload.new as RealtimeOrderRow;
        const oldOrder = payload.old as Partial<RealtimeOrderRow> | undefined;

        if (newOrder.status === "ACCEPTED" && oldOrder?.status !== "ACCEPTED") {
          toast.info("Kitchen order accepted 👨‍🍳", {
            description: `Order ${newOrder.order_number ?? ""} sent to kitchen queue.`,
          });
          await playNotificationChime("kitchen");
        } else if (newOrder.status === "READY" && oldOrder?.status !== "READY") {
          toast.success("Dishes ready to serve! 🍽️", {
            description: `Order ${newOrder.order_number ?? ""} is ready for table delivery.`,
          });
          await playNotificationChime("waiter");
        }

        scheduleRefresh();
      },
    );

    // 3. Guest Service Requests (Call Waiter / Water / Bill)
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "service_requests",
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      async (payload) => {
        const request = payload.new as RealtimeServiceRequestRow;
        toast.info(`Table ${request.table_number ?? "Guest"}: ${request.type ?? "Assistance"} Requested 🛎️`, {
          description: "Guest needs staff service at their table.",
        });
        await playNotificationChime("bell");
        scheduleRefresh();
      },
    );

    // 4. Table Bookings
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "restaurant_bookings",
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      async (payload) => {
        const booking = payload.new as RealtimeBookingRow;
        toast.success("New table booking 📅", {
          description: `${booking.customer_name ?? "Guest"} · ${booking.party_size ?? 1} guests${booking.booking_time ? ` · ${booking.booking_time.slice(0, 5)}` : ""}`,
          action: { label: "Open", onClick: () => router.push("/dashboard/bookings") },
        });
        await playNotificationChime("order");
        scheduleRefresh();
      },
    );

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

    channel.subscribe();

    return () => {
      if (refreshTimer.current) {
        window.clearTimeout(refreshTimer.current);
      }

      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      void supabase.removeChannel(channel);
    };
  }, [restaurantId, router]);

  return null;
}

function hasAlreadyNotified(orderId: string) {
  return getNotifiedOrderIds().includes(orderId);
}

function rememberNotifiedOrder(orderId: string) {
  const ids = [orderId, ...getNotifiedOrderIds().filter((id) => id !== orderId)].slice(0, 30);
  window.localStorage.setItem(notifiedOrderStorageKey, JSON.stringify(ids));
}

function getNotifiedOrderIds() {
  try {
    const raw = window.localStorage.getItem(notifiedOrderStorageKey);
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}
