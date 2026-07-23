import { Clock, CreditCard, IndianRupee, ListOrdered, StickyNote, Table2 } from "lucide-react";
import { OrderHistoryList, type OrderHistoryRow } from "@/components/dashboard/orders/order-history-list";
import { OrderStatusButton } from "@/components/dashboard/orders/order-status-button";
import { PaymentAcceptButton } from "@/components/dashboard/orders/payment-accept-button";
import { PaymentConfirmButton } from "@/components/dashboard/orders/payment-confirm-button";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { SubscriptionLock } from "@/components/dashboard/subscription-lock";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { DashboardOrder } from "@/lib/dashboard-orders";
import { getDashboardOrders, getOrderCustomerName } from "@/lib/dashboard-orders";
import type { OrderStatus } from "@/lib/database.types";
import { getAllowedOrderStatuses, hasPermission } from "@/lib/permissions";
import { getSubscriptionAccessForCurrentUser, hasPlanFeature } from "@/lib/subscription-access";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
export default async function OrdersPage() {
  const { access, memberRole } = await getOrdersAccess();
  const canViewOrders = hasPermission(memberRole, "viewOrders");
  const orders = canViewOrders ? await getDashboardOrders() : [];
  const dashboardOrderStatuses = [...getAllowedOrderStatuses(memberRole)] as OrderStatus[];
  const activeOrders = orders.filter((order) => order.paymentStatus !== "PAID");
  const canUseOrderHistory = hasPlanFeature(access, "orderHistory");
  const canUseLiveOrders = hasPlanFeature(access, "liveOrders");
  const canAcceptOrders = canUseLiveOrders && hasPermission(memberRole, "acceptOrders");
  const canServeOrders = canUseLiveOrders && hasPermission(memberRole, "serveOrders");
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
    <DashboardShell title="Orders" eyebrow="Realtime kanban" showClock>
      {!canViewOrders ? (
        <PermissionLock description="This staff role cannot view the live orders board." />
      ) : (
      <>
      <SubscriptionLock access={access} feature="liveOrders" />
      <div className="grid gap-4">
        <div className={`grid gap-4 ${canUseOrderHistory ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
          {dashboardOrderStatuses.map((status) => {
            const columnOrders = activeOrders.filter((order) => order.status === status);

            return (
              <section key={status} className="min-h-72 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm shadow-zinc-200/70">
                <div className="mb-3 flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2">
                  <h2 className="text-sm font-semibold text-zinc-700">{formatStatus(status)}</h2>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-zinc-500">{columnOrders.length}</span>
                </div>

                {columnOrders.length > 0 ? (
                  <div className="grid gap-3">
                    {columnOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        canAccept={canAcceptOrders}
                        canServe={canServeOrders}
                        canConfirmPayment={canConfirmPayments}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={ListOrdered} title="No orders" description="New QR orders for this status will appear here." />
                )}
              </section>
            );
          })}

          {canUseOrderHistory ? <section className="min-h-72 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm shadow-zinc-200/70">
            <div className="mb-3 flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2">
              <h2 className="text-sm font-semibold text-zinc-700">Today order history</h2>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-zinc-500">{paidOrders.length}</span>
            </div>

            {paidOrders.length > 0 ? (
              <OrderHistoryList orders={paidOrders} />
            ) : (
              <EmptyState icon={ListOrdered} title="No paid orders today" description="Payment accepted orders from today will appear here." />
            )}
          </section> : null}
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

function OrderCard({
  order,
  canAccept,
  canServe,
  canConfirmPayment,
}: {
  order: DashboardOrder;
  canAccept: boolean;
  canServe: boolean;
  canConfirmPayment: boolean;
}) {
  const customerName = getOrderCustomerName(order);

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-950">#{order.orderNumber}</p>
          <p className="mt-1 truncate text-xs font-semibold text-zinc-700">{customerName}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-500">
            <Table2 className="h-3.5 w-3.5" />
            Table {order.tableNumber} · {order.guestCount} guest{order.guestCount === 1 ? "" : "s"}
          </p>
        </div>
        <Badge tone={order.paymentStatus === "PAID" ? "success" : "warning"}>{order.paymentStatus.toLowerCase()}</Badge>
      </div>

      <div className="mt-3 grid gap-2">
        {order.items.map((item) => (
          <div key={item.id} className="rounded-md bg-zinc-50 px-2 py-2 text-xs">
            <div className="flex justify-between gap-2">
              <span className="font-medium text-zinc-800">{item.quantity} x {item.name}</span>
            </div>
            {item.options.length > 0 ? <p className="mt-1 text-zinc-500">{item.options.join(", ")}</p> : null}
          </div>
        ))}
      </div>

      {order.kitchenNotes ? (
        <p className="mt-3 inline-flex gap-1 text-xs text-zinc-500">
          <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {order.kitchenNotes}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <IndianRupee className="h-3.5 w-3.5" />
          {currency.format(order.total)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatTime(order.createdAt)}
        </span>
        <span className="inline-flex items-center gap-1">
          <CreditCard className="h-3.5 w-3.5" />
          {order.paymentStatus.toLowerCase()}
        </span>
      </div>

      {order.payment?.status === "VERIFICATION_PENDING" ? (
        <PaymentConfirmButton orderId={order.id} paymentId={order.payment.id} disabled={!canConfirmPayment} />
      ) : null}

      {order.status === "PENDING" ? (
        <OrderStatusButton orderId={order.id} status="ACCEPTED" disabled={!canAccept}>
          Accept
        </OrderStatusButton>
      ) : null}

      {order.status === "ACCEPTED" ? (
        <OrderStatusButton orderId={order.id} status="SERVED" disabled={!canServe}>
          Served
        </OrderStatusButton>
      ) : null}

      {order.status === "SERVED" && order.paymentStatus !== "PAID" ? (
        <PaymentAcceptButton orderId={order.id} disabled={!canConfirmPayment} />
      ) : null}
    </article>
  );
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
