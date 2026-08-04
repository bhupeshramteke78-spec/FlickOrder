import { Utensils } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { WorkflowOrderCard } from "@/components/dashboard/orders/workflow-order-card";
import { PermissionLock } from "@/components/dashboard/permission-lock";
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

  return (
    <DashboardShell title="Waiter panel" eyebrow="Prepared orders and service">
      {!canViewWaiter ? (
        <PermissionLock description="Only owners, managers, and waiters can view the waiter panel." />
      ) : (
        <section className="min-h-80 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm shadow-zinc-200/70">
          <div className="mb-3 flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
            <div>
              <h2 className="text-sm font-semibold text-zinc-800">Ready to serve</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Prepared orders arrive here from the kitchen.</p>
            </div>
            <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-zinc-500">{readyOrders.length}</span>
          </div>

          {readyOrders.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {readyOrders.map((order) => (
                <WorkflowOrderCard key={order.id} order={order} stage="waiter" canServe={canServe} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Utensils}
              title="No prepared orders"
              description="Kitchen-prepared orders appear here for serving."
            />
          )}
        </section>
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
