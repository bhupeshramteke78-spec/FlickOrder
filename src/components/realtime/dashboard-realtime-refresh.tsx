"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

type DashboardRealtimeRefreshProps = {
  restaurantId: string | null;
};

const restaurantScopedTables = ["orders", "payments", "tables", "menu_items", "service_requests", "notifications"] as const;
const newOrderSoundPath = "/sounds/new-order.mp3";
const notifiedOrderStorageKey = "flickorder_notified_order_ids";

type RealtimeOrderRow = {
  id: string;
  order_number: string | null;
  table_id: string | null;
  total: number | null;
};

type TableLookupRow = {
  table_number: string | number | null;
};

export function DashboardRealtimeRefresh({ restaurantId }: DashboardRealtimeRefreshProps) {
  const router = useRouter();
  const refreshTimer = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!restaurantId) {
      return;
    }

    audioRef.current = new Audio(newOrderSoundPath);
    audioRef.current.volume = 0.75;
    audioRef.current.preload = "auto";

    const unlockAudio = () => {
      audioRef.current?.load();
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
      }, 350);
    };

    const channel = supabase.channel(`dashboard:${restaurantId}`);

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

        const tableNumber = order.table_id ? await getTableNumber(order.table_id) : null;
        const orderLabel = order.order_number ? `#${order.order_number}` : "New order";
        const tableLabel = tableNumber ? `Table ${tableNumber}` : "Table order";
        const totalLabel = formatCurrency(Number(order.total ?? 0));

        toast.success("New order received", {
          description: `${orderLabel} - ${tableLabel} - ${totalLabel}`,
          action: {
            label: "Open",
            onClick: () => router.push("/dashboard/orders"),
          },
        });

        await playNewOrderSound(audioRef.current);
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

      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      void supabase.removeChannel(channel);
    };
  }, [restaurantId, router]);

  return null;
}

async function getTableNumber(tableId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("tables")
    .select("table_number")
    .eq("id", tableId)
    .returns<TableLookupRow[]>()
    .maybeSingle();

  return data?.table_number ? String(data.table_number) : null;
}

async function playNewOrderSound(audio: HTMLAudioElement | null) {
  if (!audio) {
    return;
  }

  try {
    audio.currentTime = 0;
    await audio.play();
  } catch {
    toast.info("Sound is ready after one click on this page.");
  }
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
