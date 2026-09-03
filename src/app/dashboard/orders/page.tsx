import { CheckCircle2, Clock, CreditCard, History } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { OrderHistoryList, type OrderHistoryRow } from "@/components/dashboard/orders/order-history-list";
import { WorkflowOrderCard } from "@/components/dashboard/orders/workflow-order-card";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { SubscriptionLock } from "@/components/dashboard/subscription-lock";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboardOrders, getOrderCustomerName } from "@/lib/dashboard-orders";
import { hasPermission } from "@/lib/permissions";
import { getSubscriptionAccessForCurrentUser, hasPlanFeature } from "@/lib/subscription-access";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function OrdersPage() {
  const { access, memberRole } = await getOrdersAccess();
  const canViewOrders = hasPermission(memberRole, "viewOrders");
  const orders = canViewOrders ? await getDashboardOrders() : [];
  const canUseOrderHistory = hasPlanFeature(access, "orderHistory");
  const canUseLiveOrders = hasPlanFeature(access, "liveOrders");
  const canAcceptOrders = canUseLiveOrders && hasPermission(memberRole, "acceptOrders");
  const canConfirmPayments = canUseLiveOrders && hasPermission(memberRole, "confirmPayments");

  // 1. Live Incoming Orders (Action Required: Accept or Decline)
  const pendingOrders = orders.filter((order) => order.status === "PENDING");

  // 2. Payment Desk & Active Dining Tables (Accepted & Dining, Awaiting Payment Settlement)
  const activeDiningOrders = orders.filter(
    (order) => order.paymentStatus !== "PAID" && order.status !== "PENDING" && order.status !== "CANCELLED",
  );

  // 3. Today's Order History (Completed, Paid, or Cancelled today)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayOrderHistory: OrderHistoryRow[] = orders
    .filter((order) => canUseOrderHistory && new Date(order.createdAt) >= startOfToday && (order.paymentStatus === "PAID" || order.status === "CANCELLED"))
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
    <DashboardShell title="Orders Control Desk" eyebrow="Live Restaurant Flow" showClock>
      {!canViewOrders ? (
        <PermissionLock description="This staff role cannot view the orders control desk." />
      ) : (
        <div className="space-y-6">
          <SubscriptionLock access={access} feature="liveOrders" />

          {/* Section 1: Live Incoming Orders (Accept / Decline) */}
          <section className="rounded-2xl border border-amber-300 bg-amber-50/20 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b] animate-ping" />
                <div>
                  <h2 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                    Live Incoming Orders
                    <Badge tone="warning" className="bg-amber-100 text-amber-900 border-amber-300 font-black">
                      {pendingOrders.length} New Action Required
                    </Badge>
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Newly placed customer QR orders. Review and choose Accept or Decline.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              {pendingOrders.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {pendingOrders.map((order) => (
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
                  icon={CheckCircle2}
                  title="No pending incoming orders"
                  description="All customer table QR orders have been reviewed. New orders will appear here automatically."
                />
              )}
            </div>
          </section>

          {/* 2-Column Grid: Section 2 (Payment Desk) + Section 3 (Today History) */}
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            {/* Section 2: Payment Desk & Active Dining Tables */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-700" />
                  <div>
                    <h2 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                      Payment Desk & Active Tables
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        {activeDiningOrders.length} Dining
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Tables currently dining. Settle bill and clear table upon cash/UPI receipt.
                    </p>
                  </div>
                </div>
              </div>

              {activeDiningOrders.length > 0 ? (
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {activeDiningOrders.map((order) => (
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
                  icon={Clock}
                  title="No active tables awaiting bill settlement"
                  description="Accepted orders will appear here while customers are dining until payment is cleared."
                />
              )}
            </section>

            {/* Section 3: Today's Order History */}
            {canUseOrderHistory ? (
              <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3.5">
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-zinc-700" />
                    <div>
                      <h2 className="text-base font-bold text-zinc-950">Today&apos;s Orders History</h2>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Chronological record of all completed & settled orders today ({todayOrderHistory.length}).
                      </p>
                    </div>
                  </div>
                </div>

                <OrderHistoryList orders={todayOrderHistory} />
              </section>
            ) : null}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

async function getOrdersAccess() {
  if (!isSupabaseConfigured()) {
    return { access: null, memberRole: "guest" };
  }

  const supabase = await createClient();
  const { access, membership } = await getSubscriptionAccessForCurrentUser(supabase);

  return {
    access,
    memberRole: membership?.role ?? "guest",
  };
}
