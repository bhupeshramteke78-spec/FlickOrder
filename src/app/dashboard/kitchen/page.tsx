import { ChefHat, ListOrdered } from "lucide-react";
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

const kitchenStatuses: OrderStatus[] = ["ACCEPTED", "PREPARING"];

export default async function KitchenPage() {
  const { role, canUseLiveOrders } = await getKitchenAccess();
  const canViewKitchen = hasPermission(role, "viewKitchen");
  const canPrepare = canUseLiveOrders && hasPermission(role, "prepareOrders");
  const orders = canViewKitchen ? await getDashboardOrders() : [];
  const activeOrders = orders.filter((order) => order.paymentStatus !== "PAID");

  return (
    <DashboardShell title="Kitchen display" eyebrow="Accepted orders and preparation">
      {!canViewKitchen ? (
        <PermissionLock description="Only owners, managers, and kitchen staff can view the kitchen display." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {kitchenStatuses.map((status) => {
            const columnOrders = activeOrders.filter((order) => order.status === status);

            return (
              <section key={status} className="min-h-80 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm shadow-zinc-200/70">
                <div className="mb-3 flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-800">{status === "ACCEPTED" ? "New kitchen tickets" : formatStatus(status)}</h2>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {status === "ACCEPTED" ? "Admin accepted and sent these orders here." : "Orders currently being prepared."}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-zinc-500">{columnOrders.length}</span>
                </div>

                {columnOrders.length > 0 ? (
                  <div className="grid gap-3">
                    {columnOrders.map((order) => (
                      <WorkflowOrderCard key={order.id} order={order} stage="kitchen" canPrepare={canPrepare} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={status === "ACCEPTED" ? ListOrdered : ChefHat}
                    title={status === "ACCEPTED" ? "No accepted tickets" : "Nothing preparing"}
                    description="Kitchen orders appear only after admin acceptance."
                  />
                )}
              </section>
            );
          })}
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
