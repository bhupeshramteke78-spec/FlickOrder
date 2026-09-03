"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, Flame, Lock, RefreshCw, StickyNote, Utensils } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardRealtimeRefresh } from "@/components/realtime/dashboard-realtime-refresh";
import type { DashboardOrder } from "@/lib/dashboard-orders";

export function KitchenKioskView({
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

  // Filter only active cooking orders (ACCEPTED or PREPARING)
  const kitchenOrders = orders.filter(
    (order) => (order.status === "ACCEPTED" || order.status === "PREPARING") && order.paymentStatus !== "PAID",
  );

  async function updateStatus(orderId: string, nextStatus: "PREPARING" | "READY") {
    setIsUpdating(orderId);
    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setIsUpdating(null);

    if (!response.ok) {
      toast.error("Unable to update kitchen ticket.");
      return;
    }

    toast.success(nextStatus === "PREPARING" ? "Cooking started!" : "Dishes marked Ready for Waiter! 🍽️");
    router.refresh();
  }

  async function handleLockStation() {
    await fetch("/api/staff/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "LOGOUT", role: "chef", slug: "dummy" }),
    });
    router.refresh();
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-[#090D10] text-zinc-100 p-4 sm:p-6">
      <DashboardRealtimeRefresh restaurantId={restaurantId} />

      {/* Top Header Bar */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#161B22]/80 p-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              Kitchen Display System (KOD)
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            </h1>
            <p className="text-xs text-zinc-400 font-medium">
              {restaurantName} · Live Kitchen Stream ({kitchenOrders.length} Active Tickets)
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

      {/* Kitchen Ticket Grid */}
      {kitchenOrders.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {kitchenOrders.map((order) => {
            const isCooking = order.status === "PREPARING";
            return (
              <Card
                key={order.id}
                className={`p-5 flex flex-col justify-between border transition-all duration-200 ${
                  isCooking
                    ? "border-blue-500/40 bg-[#161B22] shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                    : "border-amber-500/40 bg-[#161B22] shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <span className="font-mono text-base font-black text-white">#{order.orderNumber}</span>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        Guest: <span className="text-zinc-200 font-bold">{order.customerName || "Table Guest"}</span>
                      </p>
                    </div>
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-black ${
                        isCooking ? "bg-blue-500/20 text-blue-400 border border-blue-500/40" : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      }`}
                    >
                      Table {order.tableNumber}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="mt-3.5 space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5 flex items-start justify-between gap-2"
                      >
                        <div>
                          <span className="text-sm font-bold text-white">
                            {item.quantity}x {item.name}
                          </span>
                          {item.options.length > 0 ? (
                            <p className="mt-0.5 text-[11px] text-zinc-400">{item.options.join(", ")}</p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.kitchenNotes ? (
                    <div className="mt-3 flex items-start gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300 font-medium">
                      <StickyNote className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" />
                      <span>Note: {order.kitchenNotes}</span>
                    </div>
                  ) : null}
                </div>

                {/* Bottom Action Button */}
                <div className="mt-5 pt-3 border-t border-white/10">
                  {order.status === "ACCEPTED" ? (
                    <Button
                      type="button"
                      onClick={() => updateStatus(order.id, "PREPARING")}
                      disabled={isUpdating === order.id}
                      className="w-full h-11 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md"
                    >
                      <Flame className="h-4 w-4" /> Start Cooking
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => updateStatus(order.id, "READY")}
                      disabled={isUpdating === order.id}
                      className="w-full h-11 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md"
                    >
                      <Utensils className="h-4 w-4" /> Mark Dishes Ready 🍽️
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/5 border border-white/10 text-zinc-500">
            <ChefHat className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-zinc-300">Kitchen Queue is Empty</h2>
          <p className="mt-1 text-xs text-zinc-500">
            New orders accepted by the manager will appear here instantly with live cooking sound.
          </p>
        </div>
      )}
    </div>
  );
}
