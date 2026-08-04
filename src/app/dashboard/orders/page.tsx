import { ListOrdered } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { OrderHistoryList, type OrderHistoryRow } from "@/components/dashboard/orders/order-history-list";
import { WorkflowOrderCard, formatStatus } from "@/components/dashboard/orders/workflow-order-card";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { SubscriptionLock } from "@/components/dashboard/subscription-lock";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboardOrders, getOrderCustomerName } from "@/lib/dashboard-orders";
import type { OrderStatus } from "@/lib/database.types";
import { getAllowedOrderStatuses, hasPermission } from "@/lib/permissions";
import { getSubscriptionAccessForCurrentUser, hasPlanFeature } from "@/lib/subscription-access";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function OrdersPage() {
  const { access, memberRole } = await getOrdersAccess();
  const canViewOrders = hasPermission(memberRole, "viewOrders");
  const orders = canViewOrders ? await getDashboardOrders() : [];
  const dashboardOrderStatuses = [...getAllowedOrderStatuses(memberRole)] as OrderStatus[];
  const activeOrders = orders.filter((order) => order.paymentStatus !== "PAID");
  const canUseOrderHistory = hasPlanFeature(access, "orderHistory");
  const canUseLiveOrders = hasPlanFeature(access, "liveOrders");
  const canAcceptOrders = canUseLiveOrders && hasPermission(memberRole, "acceptOrders");
  const canConfirmPayments = canUseLiveOrders && hasPermission(memberRole, "confirmPayments");
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const paidOrders: OrderHistoryRow[] = orders
    .filter((order) => canUseOrderHistory && order.paymentStatus === "PAID" && new Date(order.createdAt) >= startOfToday)
    .map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      customerName: getOrderCustomerName(order),
      total: order.total,
      createdAt: order.createdAt,
      items: order.items,
    }));

  return (
    <DashboardShell title="Orders" eyebrow="Admin order control" showClock>
      {!canViewOrders ? (
        <PermissionLock description="This staff role cannot view the live orders board." />
      ) : (
        <>
          <SubscriptionLock access={access} feature="liveOrders" />
          <div className="grid gap-4">
            <div className={`grid gap-4 ${canUseOrderHistory ? "xl:grid-cols-3" : "xl:grid-cols-2"}`}>
              {dashboardOrderStatuses.map((status) => {
                const columnOrders = activeOrders.filter((order) => order.status === status);

                return (
                  <section key={status} className="min-h-72 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm shadow-zinc-200/70">
                    <div className="mb-3 flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2">
                      <h2 className="text-sm font-semibold text-zinc-700">{status === "SERVED" ? "Payment desk" : formatStatus(status)}</h2>
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-zinc-500">{columnOrders.length}</span>
                    </div>

                    {columnOrders.length > 0 ? (
                      <div className="grid gap-3">
                        {columnOrders.map((order) => (
                          <WorkflowOrderCard
                            key={order.id}
                            order={order}
                            stage="admin"
                            canAccept={canAcceptOrders}
                            canConfirmPayment={canConfirmPayments}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={ListOrdered}
                        title={status === "SERVED" ? "No payment handoffs" : "No orders"}
                        description={
                          status === "SERVED"
                            ? "Served orders return here for payment acceptance."
                            : "New QR orders appear here before being sent to kitchen."
                        }
                      />
                    )}
                  </section>
                );
              })}

              {canUseOrderHistory ? (
                <section className="min-h-72 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm shadow-zinc-200/70">
                  <div className="mb-3 flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2">
                    <h2 className="text-sm font-semibold text-zinc-700">Today order history</h2>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-zinc-500">{paidOrders.length}</span>
                  </div>

                  {paidOrders.length > 0 ? (
                    <OrderHistoryList orders={paidOrders} />
                  ) : (
                    <EmptyState icon={ListOrdered} title="No paid orders today" description="Payment accepted orders from today will appear here." />
                  )}
                </section>
              ) : null}
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  );
}

async function getOrdersAccess() {
  if (!isSupabaseConfigured()) {
    return { access: null, memberRole: null };
  }

  const supabase = await createClient();
  const { access, membership } = await getSubscriptionAccessForCurrentUser(supabase);

  return { access, memberRole: membership?.role ?? null };
}
