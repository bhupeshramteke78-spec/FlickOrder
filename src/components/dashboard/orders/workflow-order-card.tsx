import { Clock, StickyNote, UserRound } from "lucide-react";
import { OrderAcceptDeclineActions } from "@/components/dashboard/orders/order-action-buttons";
import { PaymentAcceptButton } from "@/components/dashboard/orders/payment-accept-button";
import { PaymentConfirmButton } from "@/components/dashboard/orders/payment-confirm-button";
import { OrderStatusButton } from "@/components/dashboard/orders/order-status-button";
import type { DashboardOrder } from "@/lib/orders-types";
import { getOrderCustomerName } from "@/lib/orders-types";

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
  const isPreparing = order.status === "PREPARING" || order.status === "ACCEPTED";
  const isReady = order.status === "READY";

  return (
    <article
      className={`group flex flex-col justify-between rounded-2xl border p-4.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        isPending
          ? "border-rose-300/80 bg-rose-50/20"
          : isCancelled
            ? "border-zinc-200 bg-zinc-50 opacity-70"
            : isReady
              ? "border-emerald-300/80 bg-emerald-50/20"
              : "border-zinc-200/80 bg-white"
      }`}
    >
      <div>
        {/* Card Header: Order Number, Table & Status */}
        <div className="flex items-start justify-between gap-2.5 pb-3 border-b border-zinc-100">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black text-zinc-950">#{order.orderNumber}</span>
              <span className="rounded-lg bg-zinc-900 px-2 py-0.5 text-xs font-bold text-white shadow-xs">
                T-{order.tableNumber.padStart(2, "0")}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-semibold text-zinc-600">
              <UserRound className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              {customerName} · {order.guestCount} {order.guestCount === 1 ? "guest" : "guests"}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                isPending
                  ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                  : isCancelled
                    ? "bg-zinc-100 text-zinc-600"
                    : isPreparing
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : isReady
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-blue-100 text-blue-800 border border-blue-300"
              }`}
            >
              {formatStatus(order.status)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                order.paymentStatus === "PAID"
                  ? "bg-emerald-50 text-emerald-700 font-semibold"
                  : "bg-zinc-100 text-zinc-600 font-semibold"
              }`}
            >
              {order.paymentStatus === "PAID" ? "● Paid" : "○ Unpaid"}
            </span>
          </div>
        </div>

        {/* Dish Items Breakdown */}
        <div className="mt-3 space-y-1.5 rounded-xl border border-zinc-100 bg-zinc-50/70 p-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-start gap-2 text-xs">
              <span className="font-semibold text-zinc-800">
                <span className="text-rose-600 font-bold mr-1">{item.quantity}x</span>
                {item.name}
              </span>
              {item.options.length > 0 ? (
                <span className="text-[11px] text-zinc-500 font-medium text-right">{item.options.join(", ")}</span>
              ) : null}
            </div>
          ))}
        </div>

        {/* Kitchen Notes / Special Instructions */}
        {order.kitchenNotes ? (
          <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2 text-xs text-amber-950 font-medium">
            <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <span className="font-bold text-[11px] text-amber-800 uppercase tracking-wider block">Instruction:</span>
              <span className="text-amber-900 leading-relaxed">&ldquo;{order.kitchenNotes}&rdquo;</span>
            </div>
          </div>
        ) : null}
      </div>

      <div>
        {/* Order Meta Footer */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-400 font-medium">Total:</span>
            <span className="font-mono text-sm font-black text-rose-600">
              {currency.format(order.total)}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 font-medium text-[11px] text-zinc-500">
            <Clock className="h-3 w-3 text-zinc-400" />
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
