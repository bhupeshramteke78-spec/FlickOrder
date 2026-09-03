"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Check, Lock, RefreshCw, Utensils } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardRealtimeRefresh } from "@/components/realtime/dashboard-realtime-refresh";
import type { DashboardOrder } from "@/lib/dashboard-orders";

export function WaiterKioskView({
  orders,
  restaurantName,
  restaurantId,
}: {
  orders: DashboardOrder[];
  restaurantName: string;
  restaurantId: string;
}) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Filter only READY orders that need table delivery
  const readyOrders = orders.filter(
    (order) => order.status === "READY" && order.paymentStatus !== "PAID",
  );

  async function markServed(orderId: string) {
    setIsUpdating(orderId);
    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SERVED" }),
    });
    setIsUpdating(null);

    if (!response.ok) {
      toast.error("Unable to mark order as delivered.");
      return;
    }

    toast.success("Order marked as Delivered to Table! 🎉");
    router.refresh();
  }

  async function handleLockStation() {
    await fetch("/api/staff/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "LOGOUT", role: "waiter", slug: "dummy" }),
    });
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#090D10] text-zinc-100 p-4 sm:p-6">
      <DashboardRealtimeRefresh restaurantId={restaurantId} />

      {/* Top Header Bar */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#161B22]/80 p-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Utensils className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              Waiter Service Station
              <span className="flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            </h1>
            <p className="text-xs text-zinc-400 font-medium">
              {restaurantName} · Ready to Deliver ({readyOrders.length} Orders)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => router.refresh()}
            className="h-9 gap-1.5 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 text-xs font-bold"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleLockStation}
            className="h-9 gap-1.5 border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-bold"
          >
            <Lock className="h-3.5 w-3.5" /> Lock Station
          </Button>
        </div>
      </header>

      {/* Ready Orders Grid */}
      {readyOrders.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {readyOrders.map((order) => (
            <Card
              key={order.id}
              className="p-5 flex flex-col justify-between border border-emerald-500/40 bg-[#161B22] shadow-[0_0_15px_rgba(16,185,129,0.15)]"
            >
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <span className="font-mono text-base font-black text-white">#{order.orderNumber}</span>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      Guest: <span className="text-zinc-200 font-bold">{order.customerName || "Table Guest"}</span>
                    </p>
                  </div>
                  <span className="rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1 text-sm font-black animate-pulse">
                    Table {order.tableNumber}
                  </span>
                </div>

                <div className="mt-3.5 space-y-1.5">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-white">
                        {item.quantity}x {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/10">
                <Button
                  type="button"
                  onClick={() => markServed(order.id)}
                  disabled={isUpdating === order.id}
                  className="w-full h-11 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md"
                >
                  <Check className="h-4 w-4" /> Mark Delivered to Table
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/5 border border-white/10 text-zinc-500">
            <BellRing className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-zinc-300">All Prepared Dishes Have Been Served</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Kitchen prepared orders will show up here immediately for table delivery.
          </p>
        </div>
      )}
    </div>
  );
}
