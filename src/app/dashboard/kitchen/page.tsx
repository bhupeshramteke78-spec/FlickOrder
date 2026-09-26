import { Activity, ChefHat, Clock, ListOrdered, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { WorkflowOrderCard, formatStatus } from "@/components/dashboard/orders/workflow-order-card";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboardOrders } from "@/lib/dashboard-orders";
import type { OrderStatus } from "@/lib/database.types";
import { hasPermission } from "@/lib/permissions";
import { getSubscriptionAccessForCurrentUser, hasPlanFeature } from "@/lib/subscription-access";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const kitchenColumns: Array<{
  status: OrderStatus;
  label: string;
  dotColor: string;
  description: string;
}> = [
  { status: "ACCEPTED", label: "To Prepare", dotColor: "bg-zinc-400", description: "Queued tickets ready for kitchen" },
  { status: "PREPARING", label: "Preparing", dotColor: "bg-amber-500", description: "Currently being prepared" },
  { status: "READY", label: "Ready / Pickup", dotColor: "bg-emerald-500", description: "Ready for waiter pickup" },
];

export default async function KitchenPage() {
  const { role, canUseLiveOrders } = await getKitchenAccess();
  const canViewKitchen = hasPermission(role, "viewKitchen");
  const canPrepare = canUseLiveOrders && hasPermission(role, "prepareOrders");
  const orders = canViewKitchen ? await getDashboardOrders() : [];
  const activeOrders = orders.filter((order) => order.paymentStatus !== "PAID" && order.status !== "CANCELLED");

  return (
    <DashboardShell title="Kitchen Display System (KDS)" eyebrow="Live production tracking and order fulfillment">
      {!canViewKitchen ? (
        <PermissionLock description="Only owners, managers, and kitchen staff can view the kitchen display." />
      ) : (
        <div className="space-y-6">
          {/* Top KDS Header Bar with Auto-Update badge matching Page 2 */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              {kitchenColumns.map((col) => {
                const count = activeOrders.filter((o) => o.status === col.status).length;
                return (
                  <div key={col.status} className="flex items-center gap-2 text-xs font-bold text-zinc-800">
                    <span className={`h-2 w-2 rounded-full ${col.dotColor}`} />
                    <span>{col.label}</span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-extrabold text-zinc-600">
                      {String(count).padStart(2, "0")} {count === 1 ? "Order" : "Orders"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 rounded-full bg-zinc-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Auto-Update: On</span>
            </div>
          </div>

          {/* 3 Status Columns Grid matching Page 2 */}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {kitchenColumns.map((col) => {
              const columnOrders = activeOrders.filter((order) => order.status === col.status);

              return (
                <section key={col.status} className="flex flex-col min-h-[480px] rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between rounded-xl bg-white p-3 border border-zinc-200/70 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
                      <div>
                        <h2 className="text-xs font-black text-zinc-950 uppercase tracking-wider">{col.label}</h2>
                        <p className="text-[10px] text-zinc-400 font-medium">{col.description}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-black text-zinc-800">
                      {columnOrders.length}
                    </span>
                  </div>

                  {columnOrders.length > 0 ? (
                    <div className="grid gap-3.5 flex-1 content-start">
                      {columnOrders.map((order) => (
                        <WorkflowOrderCard
                          key={order.id}
                          order={order}
                          stage="kitchen"
                          canPrepare={canPrepare}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 grid place-items-center rounded-xl border border-dashed border-zinc-200 bg-white/40 p-6 text-center">
                      <EmptyState
                        icon={col.status === "ACCEPTED" ? ListOrdered : col.status === "PREPARING" ? ChefHat : Activity}
                        title={`No ${col.label.toLowerCase()} tickets`}
                        description="New tickets will appear here automatically when orders are accepted."
                      />
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

async function getKitchenAccess() {
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
