import { ChefHat, Clock, CreditCard, IndianRupee, StickyNote, Table2, UserRound } from "lucide-react";
import { PaymentAcceptButton } from "@/components/dashboard/orders/payment-accept-button";
import { PaymentConfirmButton } from "@/components/dashboard/orders/payment-confirm-button";
import { OrderStatusButton } from "@/components/dashboard/orders/order-status-button";
import { Badge } from "@/components/ui/badge";
import type { DashboardOrder } from "@/lib/dashboard-orders";
import { getOrderCustomerName } from "@/lib/dashboard-orders";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function WorkflowOrderCard({
  order,
  stage,
  canAccept = false,
  canPrepare = false,
  canServe = false,
  canConfirmPayment = false,
}: {
  order: DashboardOrder;
  stage: "admin" | "kitchen" | "waiter";
  canAccept?: boolean;
  canPrepare?: boolean;
  canServe?: boolean;
  canConfirmPayment?: boolean;
}) {
  const customerName = getOrderCustomerName(order);

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-950">#{order.orderNumber}</p>
          <p className="mt-1 inline-flex items-center gap-1 truncate text-xs font-semibold text-zinc-700">
            <UserRound className="h-3.5 w-3.5" />
            {customerName}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-500">
            <Table2 className="h-3.5 w-3.5" />
            Table {order.tableNumber} - {order.guestCount} guest{order.guestCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge tone={order.paymentStatus === "PAID" ? "success" : "warning"} className="bg-zinc-50 text-zinc-700">
            {formatStatus(order.paymentStatus)}
          </Badge>
          <Badge tone="neutral">{formatStatus(order.status)}</Badge>
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        {order.items.map((item) => (
          <div key={item.id} className="rounded-lg bg-zinc-50 px-2 py-2 text-xs">
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
        <span className="inline-flex items-center gap-1 font-semibold text-zinc-900">
          <IndianRupee className="h-3.5 w-3.5" />
          {currency.format(order.total)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatTime(order.createdAt)}
        </span>
        {stage === "kitchen" ? (
          <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
            <ChefHat className="h-3.5 w-3.5" />
            Kitchen ticket
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <CreditCard className="h-3.5 w-3.5" />
            {formatStatus(order.paymentStatus)}
          </span>
        )}
      </div>

      {stage === "admin" && order.payment?.status === "VERIFICATION_PENDING" ? (
        <PaymentConfirmButton orderId={order.id} paymentId={order.payment.id} disabled={!canConfirmPayment} />
      ) : null}

      {stage === "admin" && order.status === "PENDING" ? (
        <OrderStatusButton orderId={order.id} status="ACCEPTED" disabled={!canAccept}>
          Accept and send to kitchen
        </OrderStatusButton>
      ) : null}

      {stage === "admin" && order.status === "ACCEPTED" ? (
        <OrderStatusButton orderId={order.id} status="PREPARING" disabled={!canPrepare}>
          Start preparing
        </OrderStatusButton>
      ) : null}

      {stage === "admin" && order.status === "PREPARING" ? (
        <OrderStatusButton orderId={order.id} status="READY" disabled={!canPrepare}>
          Mark prepared
        </OrderStatusButton>
      ) : null}

      {stage === "admin" && order.status === "READY" ? (
        <OrderStatusButton orderId={order.id} status="SERVED" disabled={!canServe}>
          Mark served
        </OrderStatusButton>
      ) : null}

      {stage === "kitchen" && order.status === "ACCEPTED" ? (
        <OrderStatusButton orderId={order.id} status="PREPARING" disabled={!canPrepare}>
          Start preparing
        </OrderStatusButton>
      ) : null}

      {stage === "kitchen" && order.status === "PREPARING" ? (
        <OrderStatusButton orderId={order.id} status="READY" disabled={!canPrepare}>
          Mark prepared
        </OrderStatusButton>
      ) : null}

      {stage === "waiter" && order.status === "READY" ? (
        <OrderStatusButton orderId={order.id} status="SERVED" disabled={!canServe}>
          Mark served
        </OrderStatusButton>
      ) : null}

      {stage === "admin" && order.status === "SERVED" && order.paymentStatus !== "PAID" ? (
        <PaymentAcceptButton orderId={order.id} disabled={!canConfirmPayment} />
      ) : null}
    </article>
  );
}

export function formatStatus(status: string) {
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
