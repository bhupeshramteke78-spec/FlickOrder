import Link from "next/link";
import {
  UserPlus,
  Utensils,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { WorkflowOrderCard } from "@/components/dashboard/orders/workflow-order-card";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboardOrders } from "@/lib/dashboard-orders";
import { hasPermission } from "@/lib/permissions";
import { getSubscriptionAccessForCurrentUser, hasPlanFeature } from "@/lib/subscription-access";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function WaiterPage() {
  const { role, canUseLiveOrders } = await getWaiterAccess();
  const canViewWaiter = hasPermission(role, "viewWaiter");
  const canServe = canUseLiveOrders && hasPermission(role, "serveOrders");
  const orders = canViewWaiter ? await getDashboardOrders() : [];
  const readyOrders = orders.filter((order) => order.status === "READY" && order.paymentStatus !== "PAID");

  const waiters = [
    {
      id: "w1",
      name: "Sarah Jenkins",
      role: "Senior Waiter",
      status: "ONLINE",
      avatar: "SJ",
      assignedTables: "T-04, T-05, T-08",
      todaysSales: "₹1,240.00",
      rating: 4.8,
      ratingPercent: 96,
    },
    {
      id: "w2",
      name: "Elena Kovac",
      role: "Junior Waiter",
      status: "ONLINE",
      avatar: "EK",
      assignedTables: "T-12, T-14",
      todaysSales: "₹840.50",
      rating: 4.2,
      ratingPercent: 84,
    },
    {
      id: "w3",
      name: "Mark Rossi",
      role: "Service Lead",
      status: "OFFLINE",
      avatar: "MR",
      assignedTables: "None",
      todaysSales: "₹0.00",
      rating: 4.5,
      ratingPercent: 90,
    },
  ];

  return (
    <DashboardShell title="Waiter Management" eyebrow="Track staff activity, performance, and table assignments">
      {!canViewWaiter ? (
        <PermissionLock description="Only owners, managers, and waiters can view the waiter panel." />
      ) : (
        <div className="space-y-6">
          {/* Header & Add Waiter Action matching Page 3 */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-zinc-950">Active Floor Staff</h2>
              <p className="mt-0.5 text-xs font-medium text-zinc-500">
                Staff duty rosters, table allocations, and real-time service ratings
              </p>
            </div>

            <Link href="/dashboard/settings">
              <Button
                size="sm"
                className="h-9 gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-600/20"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add Waiter
              </Button>
            </Link>
          </div>

          {/* Waiter Staff Cards Grid matching Page 3 */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {waiters.map((waiter) => {
              const isOnline = waiter.status === "ONLINE";

              return (
                <Card
                  key={waiter.id}
                  className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-100 text-sm font-bold text-rose-700 border border-rose-200">
                        {waiter.avatar}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-zinc-950">{waiter.name}</h3>
                        <p className="text-xs text-zinc-500 font-medium">{waiter.role}</p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        isOnline
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                      }`}
                    >
                      {waiter.status}
                    </span>
                  </div>

                  {/* Metrics Row */}
                  <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-zinc-100 bg-zinc-50/70 p-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">ASSIGNED TABLES</p>
                      <p className="mt-1 text-xs font-bold text-zinc-900 truncate">{waiter.assignedTables}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">TODAY&apos;S SALES</p>
                      <p className="mt-1 text-xs font-black text-zinc-950">{waiter.todaysSales}</p>
                    </div>
                  </div>

                  {/* Service Rating Bar matching Page 3 */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="text-zinc-500 font-medium">Service Rating</span>
                      <span className="text-zinc-900 font-black">{waiter.rating}/5.0</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${waiter.ratingPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5">
                    {isOnline ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 text-xs font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl"
                        >
                          Performance
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 text-xs font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl"
                        >
                          Assign Tables
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-full text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl"
                      >
                        Clock In Staff
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Ready to Serve Live Queue */}
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-zinc-950">Dishes Ready for Table Pickup</h3>
                <p className="text-xs text-zinc-500 font-medium">
                  Kitchen-ready dishes awaiting waiter delivery to table
                </p>
              </div>
              <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-black text-rose-700">
                {readyOrders.length} Ready Tickets
              </span>
            </div>

            {readyOrders.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {readyOrders.map((order) => (
                  <WorkflowOrderCard key={order.id} order={order} stage="waiter" canServe={canServe} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center">
                <EmptyState
                  icon={Utensils}
                  title="No dishes waiting for pickup"
                  description="As soon as the kitchen marks tickets ready, they appear here for your floor staff."
                />
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

async function getWaiterAccess() {
  if (!isSupabaseConfigured()) {
    return { role: null, canUseLiveOrders: false };
  }

  const supabase = await createClient();
  const { access, membership } = await getSubscriptionAccessForCurrentUser(supabase);

  return {
    role: membership?.role ?? null,
    canUseLiveOrders: hasPlanFeature(access, "liveOrders"),
  };
}
