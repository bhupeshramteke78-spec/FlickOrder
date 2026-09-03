import { Clock, StickyNote, UserRound } from "lucide-react";
import { OrderAcceptDeclineActions } from "@/components/dashboard/orders/order-action-buttons";
import { PaymentAcceptButton } from "@/components/dashboard/orders/payment-accept-button";
import { PaymentConfirmButton } from "@/components/dashboard/orders/payment-confirm-button";
import { OrderStatusButton } from "@/components/dashboard/orders/order-status-button";
import type { DashboardOrder } from "@/lib/dashboard-orders";
import { getOrderCustomerName } from "@/lib/dashboard-orders";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function WorkflowOrderCard({
  order,
  stage = "admin",
  canAccept = false,
  canPrepare = false,
  canServe = false,
  canConfirmPayment = false,
}: {
  order: DashboardOrder;
  stage?: "admin" | "kitchen" | "waiter";
  canAccept?: boolean;
  canPrepare?: boolean;
  canServe?: boolean;
  canConfirmPayment?: boolean;
}) {
  const customerName = getOrderCustomerName(order);
  const isPending = order.status === "PENDING";
  const isCancelled = order.status === "CANCELLED";

  return (
    <article
      className={`group rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        isPending
          ? "border-amber-300 bg-amber-50/30"
          : isCancelled
            ? "border-zinc-200 bg-zinc-50 opacity-70"
            : "border-zinc-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-black text-zinc-950">#{order.orderNumber}</span>
            <span className="rounded-lg bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-800">
              Table {order.tableNumber}
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-semibold text-zinc-600">
            <UserRound className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            {customerName} · {order.guestCount} {order.guestCount === 1 ? "guest" : "guests"}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              order.paymentStatus === "PAID"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-rose-100 text-rose-800 border border-rose-300"
            }`}
          >
            {order.paymentStatus === "PAID" ? "Paid" : "Unpaid"}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              order.status === "PENDING"
                ? "bg-amber-100 text-amber-800 animate-pulse"
                : order.status === "CANCELLED"
                  ? "bg-zinc-100 text-zinc-600"
                  : order.status === "PREPARING"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {formatStatus(order.status)}
          </span>
        </div>
      </div>

      {/* Dish Items Breakdown */}
      <div className="mt-3.5 space-y-1.5 rounded-xl border border-zinc-100 bg-zinc-50/80 p-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-2 text-xs">
            <span className="font-semibold text-zinc-800">
              {item.quantity}x {item.name}
            </span>
            {item.options.length > 0 ? (
              <span className="text-[11px] text-zinc-500 font-medium">{item.options.join(", ")}</span>
            ) : null}
          </div>
        ))}
      </div>

      {order.kitchenNotes ? (
        <div className="mt-2.5 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50/60 px-2.5 py-1.5 text-xs text-amber-900 font-medium">
          <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
          <span>Note: {order.kitchenNotes}</span>
        </div>
      ) : null}

      {/* Order Meta Footer */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
        <span className="font-mono text-sm font-black text-zinc-950">
          {currency.format(order.total)}
        </span>
        <span className="inline-flex items-center gap-1 font-medium">
          <Clock className="h-3.5 w-3.5 text-zinc-400" />
          {formatTime(order.createdAt)}
        </span>
      </div>

      {/* Action Buttons Section */}
      <div className="mt-3 grid gap-2">
        {stage === "admin" && isPending ? (
          <OrderAcceptDeclineActions
            orderId={order.id}
            orderNumber={order.orderNumber}
            disabled={!canAccept}
          />
        ) : null}

        {stage === "admin" && !isPending && !isCancelled && order.payment?.status === "VERIFICATION_PENDING" ? (
          <PaymentConfirmButton orderId={order.id} paymentId={order.payment.id} disabled={!canConfirmPayment} />
        ) : null}

        {stage === "admin" && !isPending && !isCancelled && order.paymentStatus !== "PAID" ? (
          <PaymentAcceptButton orderId={order.id} disabled={!canConfirmPayment} />
        ) : null}

        {/* Kitchen Stage Buttons */}
        {stage === "kitchen" && order.status === "ACCEPTED" ? (
          <OrderStatusButton orderId={order.id} status="PREPARING" disabled={!canPrepare}>
            Start Cooking
          </OrderStatusButton>
        ) : null}

        {stage === "kitchen" && order.status === "PREPARING" ? (
          <OrderStatusButton orderId={order.id} status="READY" disabled={!canPrepare}>
            Mark Dishes Ready
          </OrderStatusButton>
        ) : null}

        {/* Waiter Stage Buttons */}
        {stage === "waiter" && order.status === "READY" ? (
          <OrderStatusButton orderId={order.id} status="SERVED" disabled={!canServe}>
            Mark Delivered to Table
          </OrderStatusButton>
        ) : null}
      </div>
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
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}
