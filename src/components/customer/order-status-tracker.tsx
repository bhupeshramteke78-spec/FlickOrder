"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  ChefHat,
  Clock,
  CreditCard,
  ExternalLink,
  Flame,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export type OrderDetailItem = {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  notes: string | null;
  options: string[];
  total: number;
};

export type OrderDetail = {
  id: string;
  orderNumber: string;
  status: "PENDING" | "ACCEPTED" | "PREPARING" | "READY" | "SERVED" | "COMPLETED" | "CANCELLED";
  paymentStatus: "UNPAID" | "VERIFICATION_PENDING" | "PAID" | "FAILED" | "REFUNDED";
  customerName: string | null;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  createdAt: string;
  restaurantName: string;
  restaurantSlug: string;
  tableNumber: string;
  upiId: string | null;
  upiDisplayName: string | null;
  items: OrderDetailItem[];
};

type PaymentMethod = "UPI" | "CASH";

const timelineStages = [
  {
    key: "PENDING",
    label: "Order Placed",
    description: "Received by restaurant desk",
    icon: Clock,
  },
  {
    key: "ACCEPTED",
    label: "Accepted",
    description: "Sent to the kitchen team",
    icon: CheckCircle2,
  },
  {
    key: "PREPARING",
    label: "Preparing",
    description: "Chef is cooking your meal",
    icon: Flame,
  },
  {
    key: "READY",
    label: "Ready to Serve",
    description: "Food is ready for table delivery",
    icon: ChefHat,
  },
  {
    key: "SERVED",
    label: "Served",
    description: "Enjoy your fresh meal",
    icon: UtensilsCrossed,
  },
  {
    key: "COMPLETED",
    label: "Completed",
    description: "Thank you for dining with us",
    icon: Sparkles,
  },
] as const;

const stageOrder: Record<string, number> = {
  PENDING: 0,
  ACCEPTED: 1,
  PREPARING: 2,
  READY: 3,
  SERVED: 4,
  COMPLETED: 5,
};

export function OrderStatusTracker({ initialOrder }: { initialOrder: OrderDetail | null }) {
  const [order, setOrder] = useState<OrderDetail | null>(initialOrder);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRequestingPayment, setIsRequestingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

  const orderId = order?.id;
  const isCancelled = order?.status === "CANCELLED";
  const currentStageIndex = order ? (stageOrder[order.status] ?? 0) : 0;

  const refreshOrder = useCallback(async () => {
    if (!orderId) return;
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        if (data?.order) {
          setOrder(data.order);
        }
      }
    } catch {
      // silent refresh fallback
    } finally {
      setIsRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId || order?.status === "COMPLETED" || order?.status === "CANCELLED") {
      return;
    }

    const interval = window.setInterval(refreshOrder, 5000);
    return () => window.clearInterval(interval);
  }, [orderId, order?.status, refreshOrder]);

  async function handlePayment(method: PaymentMethod) {
    if (!order || isRequestingPayment) return;

    setIsRequestingPayment(true);
    setPaymentMessage(null);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          method,
          customerName: order.customerName || "Dine-in Customer",
        }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(body?.error ?? "Unable to request payment.");
        setIsRequestingPayment(false);
        return;
      }

      setOrder((prev) => (prev ? { ...prev, paymentStatus: "VERIFICATION_PENDING" } : null));

      if (method === "UPI" && order.upiId) {
        const params = new URLSearchParams({
          pa: order.upiId,
          pn: order.upiDisplayName || order.restaurantName,
          am: order.total.toFixed(2),
          cu: "INR",
          tn: body?.transactionNote || order.orderNumber,
        });
        window.location.href = `upi://pay?${params.toString()}`;
        setPaymentMessage("UPI app opened. Please complete the transfer and wait for staff confirmation.");
      } else {
        setPaymentMessage(
          method === "CASH"
            ? "Cash settlement requested. Staff will visit your table to collect."
            : "Payment verification requested from restaurant staff.",
        );
      }

      toast.success("Payment request sent.");
    } catch {
      toast.error("Network error submitting payment.");
    } finally {
      setIsRequestingPayment(false);
    }
  }

  if (!order) {
    return (
      <Card className="p-8 text-center">
        <XCircle className="mx-auto h-12 w-12 text-rose-500" />
        <h2 className="mt-4 text-xl font-bold text-zinc-900">Order Not Found</h2>
        <p className="mt-2 text-sm text-zinc-500">
          The requested order does not exist or may have been deleted.
        </p>
        <Link href="/" className="mt-6 inline-block">
          <Button>Return Home</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Top Banner Card */}
      <Card className="overflow-hidden border-emerald-200/40 p-6 shadow-xl shadow-emerald-950/5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-zinc-950">{order.restaurantName}</h1>
              <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-black text-emerald-800">
                Table {order.tableNumber}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              Order <span className="font-bold text-zinc-700">#{order.orderNumber}</span>
              {order.customerName ? ` • Guest: ${order.customerName}` : ""}
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={refreshOrder}
            disabled={isRefreshing}
            className="gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Updating..." : "Refresh status"}
          </Button>
        </div>

        {/* Live Timeline */}
        {isCancelled ? (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50/70 p-5 text-center">
            <XCircle className="mx-auto h-10 w-10 text-rose-600" />
            <h3 className="mt-2 text-lg font-bold text-rose-900">This order was cancelled</h3>
            <p className="mt-1 text-sm text-rose-700">
              Please contact restaurant staff or place a new order from your table QR code.
            </p>
          </div>
        ) : (
          <div className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Order Progress</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {timelineStages.map((stage, idx) => {
                const isPassed = currentStageIndex >= idx;
                const isCurrent = currentStageIndex === idx;
                const IconComponent = stage.icon;

                return (
                  <div
                    key={stage.key}
                    className={`relative flex flex-col rounded-xl border p-4 transition ${
                      isCurrent
                        ? "border-emerald-600 bg-emerald-50/60 shadow-md ring-2 ring-emerald-500/20"
                        : isPassed
                          ? "border-zinc-200 bg-white"
                          : "border-zinc-100 bg-zinc-50/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`grid h-8 w-8 place-items-center rounded-lg ${
                          isCurrent
                            ? "bg-emerald-600 text-white animate-pulse"
                            : isPassed
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-zinc-200 text-zinc-400"
                        }`}
                      >
                        {isPassed && !isCurrent ? <Check className="h-4 w-4 stroke-[3]" /> : <IconComponent className="h-4 w-4" />}
                      </div>
                      {isCurrent ? (
                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                          Active
                        </span>
                      ) : null}
                    </div>

                    <p className={`mt-3 text-sm font-bold ${isCurrent ? "text-emerald-950" : isPassed ? "text-zinc-900" : "text-zinc-400"}`}>
                      {stage.label}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 leading-snug">{stage.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Bill & Payment Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        {/* Ordered Items Summary */}
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-zinc-950">
              <ShoppingBag className="h-4 w-4 text-emerald-700" />
              Ordered Items
            </h2>
            <span className="text-xs font-semibold text-zinc-500">
              {order.items.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>

          <div className="mt-4 divide-y divide-zinc-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-900">
                    <span className="text-emerald-700 font-extrabold">{item.quantity}x </span>
                    {item.name}
                  </p>
                  {item.options?.length > 0 ? (
                    <p className="mt-0.5 text-xs text-zinc-500">{item.options.join(", ")}</p>
                  ) : null}
                  {item.notes ? (
                    <p className="mt-0.5 text-xs italic text-zinc-400">Note: {item.notes}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-sm font-bold text-zinc-900">
                  {formatCurrency(item.total)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-zinc-100 pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-zinc-500">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discountTotal > 0 ? (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Special Offer Discount</span>
                <span>-{formatCurrency(order.discountTotal)}</span>
              </div>
            ) : null}
            {order.taxTotal > 0 ? (
              <div className="flex justify-between text-zinc-500">
                <span>Taxes & Fees</span>
                <span>{formatCurrency(order.taxTotal)}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-zinc-200 pt-3 text-lg font-black text-zinc-950">
              <span>Total Payable</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </Card>

        {/* Payment Settlement Card */}
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-zinc-950">
            <CreditCard className="h-4 w-4 text-emerald-700" />
            Payment Status
          </h2>

          <div className="mt-4">
            {order.paymentStatus === "PAID" ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <Check className="mx-auto h-8 w-8 text-emerald-600" />
                <p className="mt-2 font-bold text-emerald-900">Bill Settled & Paid</p>
                <p className="mt-1 text-xs text-emerald-700">
                  Your payment has been received and verified by the restaurant.
                </p>
              </div>
            ) : order.paymentStatus === "VERIFICATION_PENDING" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-600" />
                <p className="mt-2 font-bold text-amber-900">Verification Pending</p>
                <p className="mt-1 text-xs text-amber-700">
                  Staff has been notified and is verifying your bill settlement.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Unpaid Amount</p>
                  <p className="mt-1 text-2xl font-black text-zinc-950">{formatCurrency(order.total)}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Pay directly from your phone via UPI or request cash collection.
                  </p>
                </div>

                {order.upiId ? (
                  <Button
                    type="button"
                    className="w-full bg-emerald-700 text-white hover:bg-emerald-800 gap-2 h-11"
                    onClick={() => handlePayment("UPI")}
                    disabled={isRequestingPayment || isCancelled}
                  >
                    {isRequestingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                    Pay via UPI App ({formatCurrency(order.total)})
                  </Button>
                ) : null}

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full border-zinc-300 text-zinc-700 hover:bg-zinc-50 gap-2 h-11"
                  onClick={() => handlePayment("CASH")}
                  disabled={isRequestingPayment || isCancelled}
                >
                  Pay with Cash / at Counter
                </Button>

                {paymentMessage ? (
                  <p className="text-xs text-center text-zinc-600 bg-zinc-100 p-2.5 rounded-lg">
                    {paymentMessage}
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-zinc-100 pt-4">
            <Link
              href={`/menu/${order.restaurantSlug}/table/${order.tableNumber}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
            >
              Order More Items for Table {order.tableNumber}
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
