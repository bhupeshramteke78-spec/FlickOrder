"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Loader2, RefreshCw, ShieldCheck, Sparkles, X } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PaidSubscriptionPlan, SubscriptionBillingInterval, SubscriptionPlanDetails } from "@/lib/billing-plans";
import { cn, formatCurrency } from "@/lib/utils";

export type SubscriptionUpgradeRequestView = {
  id: string;
  plan: PaidSubscriptionPlan;
  amount: number;
  interval?: SubscriptionBillingInterval;
  status: "PENDING_PAYMENT" | "VERIFICATION_PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  transactionNote: string;
  transactionId: string | null;
  paymentSubmittedAt: string | null;
  createdAt: string;
};

type ManualPaymentView = {
  upiUrl: string;
  payeeName: string;
  amount: number;
  transactionNote: string;
};

type UpgradeCreateResponse = {
  request?: SubscriptionUpgradeRequestView;
  payment?: ManualPaymentView;
  error?: string;
};

type SubscriptionUpgradePanelProps = {
  plans: SubscriptionPlanDetails[];
  currentPlan: string;
  currentStatus?: string;
  pendingRequest: SubscriptionUpgradeRequestView | null;
};

export function SubscriptionUpgradePanel({
  plans,
  currentPlan,
  currentStatus,
  pendingRequest,
}: SubscriptionUpgradePanelProps) {
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState(pendingRequest);
  const [payment, setPayment] = useState<ManualPaymentView | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [billingInterval, setBillingInterval] = useState<SubscriptionBillingInterval>(
    pendingRequest?.interval ?? "MONTHLY",
  );
  const [loadingPlan, setLoadingPlan] = useState<PaidSubscriptionPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeRequest = selectedRequest;
  const requestedPlan = useMemo(
    () => plans.find((plan) => plan.id === activeRequest?.plan) ?? null,
    [activeRequest, plans],
  );

  const isSubscriptionActive = currentStatus === "ACTIVE" || currentStatus === "TRIAL";
  const isSubscriptionExpired = Boolean(currentStatus && !isSubscriptionActive);

  async function requestUpgrade(plan: PaidSubscriptionPlan) {
    setLoadingPlan(plan);
    const response = await fetch("/api/subscription-upgrades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, interval: billingInterval }),
    });
    const body = (await response.json().catch(() => null)) as UpgradeCreateResponse | null;
    setLoadingPlan(null);

    if (!response.ok || !body?.request || !body.payment) {
      toast.error(body?.error ?? "Unable to create the UPI payment request.");
      return;
    }

    setSelectedRequest(body.request);
    setPayment(body.payment);
    toast.info(`UPI payment generated for ${plan.toUpperCase()} (${billingInterval === "YEARLY" ? "Annual" : "Monthly"}).`);
  }

  async function cancelPendingRequest() {
    if (!activeRequest) return;

    setIsSubmitting(true);
    const response = await fetch(`/api/subscription-upgrades/${activeRequest.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "CANCEL" }),
    });
    setIsSubmitting(false);

    if (!response.ok) {
      toast.error("Unable to cancel the pending payment request.");
      return;
    }

    setSelectedRequest(null);
    setPayment(null);
    toast.success("Pending payment request cancelled. You can select any plan.");
    router.refresh();
  }

  async function submitPayment() {
    if (!activeRequest) {
      return;
    }

    setIsSubmitting(true);
    const response = await fetch(`/api/subscription-upgrades/${activeRequest.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "SUBMIT_MANUAL_PAYMENT",
        transactionId,
      }),
    });
    const body = (await response.json().catch(() => null)) as {
      request?: SubscriptionUpgradeRequestView;
      error?: string;
    } | null;
    setIsSubmitting(false);

    if (!response.ok || !body?.request) {
      toast.error(body?.error ?? "Unable to submit payment for verification.");
      return;
    }

    setSelectedRequest(body.request);
    setPayment(null);
    setTransactionId("");
    toast.success("Payment submitted. Your plan will activate after FlickOrder verifies the transaction.");
    router.refresh();
  }

  const requestIsOpen = activeRequest?.status === "PENDING_PAYMENT";
  const requestIsUnderReview = activeRequest?.status === "VERIFICATION_PENDING";

  return (
    <Card className="overflow-hidden p-0 border-zinc-200">
      <div className="border-b border-zinc-200 bg-zinc-50 p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Subscription plans</p>
        <h3 className="mt-2 text-2xl font-bold text-zinc-950">Choose a plan and pay through UPI</h3>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
          The payment QR fills the exact plan amount automatically. Your subscription activates as soon as FlickOrder
          verifies the UPI transaction.
        </p>
      </div>

      {/* Monthly vs Yearly Toggle Bar */}
      <div className="flex flex-col items-center justify-between gap-3 border-b border-zinc-200 bg-emerald-50/40 px-5 py-4 sm:flex-row">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            Billing Cycle
          </span>
          <p className="text-xs text-zinc-600">Save ~20% (2 Months Free) on all annual subscriptions</p>
        </div>

        <div className="inline-flex items-center rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setBillingInterval("MONTHLY")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
              billingInterval === "MONTHLY"
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval("YEARLY")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition ${
              billingInterval === "YEARLY"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            <span>Yearly</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                billingInterval === "YEARLY"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              Save 20% 🎉
            </span>
          </button>
        </div>
      </div>

      {requestIsUnderReview ? (
        <div className="border-b border-emerald-200 bg-emerald-50 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge tone="danger" className="border-emerald-200 bg-emerald-100 text-emerald-900">
                Verification pending
              </Badge>
              <p className="mt-3 font-semibold text-zinc-950">
                {requestedPlan?.name ?? activeRequest.plan} ({activeRequest.interval === "YEARLY" ? "Annual" : "Monthly"}) · {formatCurrency(activeRequest.amount)}
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Transaction ID: <span className="font-semibold text-zinc-900">{activeRequest.transactionId}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <ShieldCheck className="h-5 w-5" />
              Waiting for FlickOrder approval
            </div>
          </div>
        </div>
      ) : null}

      {requestIsOpen ? (
        <div className="border-b border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Badge tone="danger" className="border-amber-200 bg-amber-100 text-amber-900">
                  Payment pending
                </Badge>
                <p className="mt-3 font-semibold text-zinc-950">
                  {requestedPlan?.name ?? activeRequest.plan} ({activeRequest.interval === "YEARLY" ? "Annual" : "Monthly"}) · {formatCurrency(activeRequest.amount)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!payment ? (
                  <Button
                    type="button"
                    disabled={loadingPlan !== null}
                    onClick={() => requestUpgrade(activeRequest.plan)}
                  >
                    {loadingPlan === activeRequest.plan ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Show payment details
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSubmitting}
                  onClick={cancelPendingRequest}
                  className="gap-1 text-zinc-600 hover:text-zinc-950"
                >
                  <X className="h-4 w-4" />
                  Cancel / Change plan
                </Button>
              </div>
            </div>

            {payment ? (
              <div className="grid gap-5 rounded-xl border border-amber-200 bg-white p-4 lg:grid-cols-[auto_1fr]">
                <div className="mx-auto rounded-lg border border-zinc-200 bg-white p-2 lg:mx-0">
                  <QRCodeCanvas value={payment.upiUrl} size={164} includeMargin aria-label="Subscription payment QR code" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-zinc-500">Paying to</p>
                  <p className="mt-1 font-semibold text-zinc-950">{payment.payeeName}</p>
                  <p className="mt-3 text-sm text-zinc-500">Amount ({billingInterval === "YEARLY" ? "1 Year Validity" : "30 Days Validity"})</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-950">{formatCurrency(payment.amount)}</p>
                  <p className="mt-2 break-all text-xs text-zinc-500">Reference: {payment.transactionNote}</p>
                  <a
                    href={payment.upiUrl}
                    className={cn(buttonVariants({ variant: "primary" }), "mt-4 w-full sm:w-auto")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open UPI app
                  </a>
                </div>
                <div className="lg:col-span-2">
                  <label htmlFor="subscription-transaction-id" className="text-sm font-semibold text-zinc-900">
                    UPI transaction ID
                  </label>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Complete the payment first, then enter the transaction ID shown by your UPI app.
                  </p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <Input
                      id="subscription-transaction-id"
                      value={transactionId}
                      onChange={(event) => setTransactionId(event.target.value)}
                      placeholder="Enter UPI transaction ID"
                      autoComplete="off"
                      maxLength={64}
                    />
                    <Button type="button" disabled={isSubmitting || transactionId.trim().length < 6} onClick={submitPayment}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Submit for verification
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 p-5 lg:grid-cols-3">
        {plans.map((plan) => {
          const isPlanMatch = currentPlan.toLowerCase() === plan.id.toLowerCase();
          const isCurrentActive = isPlanMatch && isSubscriptionActive;
          const isCurrentExpired = isPlanMatch && isSubscriptionExpired;
          const isBlocked = requestIsOpen || requestIsUnderReview;

          const isYearly = billingInterval === "YEARLY";
          const currentPrice = isYearly ? plan.yearlyPrice : plan.price;
          const effectiveMonthly = isYearly ? plan.yearlyEffectiveMonthlyPrice : null;

          return (
            <div
              key={plan.id}
              className={`flex flex-col justify-between rounded-xl border p-5 shadow-sm transition ${
                isCurrentExpired
                  ? "border-rose-300 bg-rose-50/30"
                  : isCurrentActive
                    ? "border-emerald-300 bg-emerald-50/20"
                    : "border-zinc-200 bg-white"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">{plan.name}</p>
                    <p className="mt-3 text-3xl font-black text-zinc-950">
                      {formatCurrency(currentPrice)}
                      <span className="text-sm font-semibold text-zinc-500">/{isYearly ? "yr" : "mo"}</span>
                    </p>
                    {isYearly ? (
                      <p className="mt-1 text-xs font-bold text-emerald-700">
                        ~{formatCurrency(effectiveMonthly!)}/mo · Save {formatCurrency(plan.yearlyDiscountAmount)}/yr
                      </p>
                    ) : null}
                  </div>
                  {isCurrentActive ? (
                    <Badge tone="danger" className="bg-emerald-50 text-emerald-800 border-emerald-200">
                      Current
                    </Badge>
                  ) : isCurrentExpired ? (
                    <Badge tone="danger" className="bg-rose-100 text-rose-800 border-rose-200">
                      Expired
                    </Badge>
                  ) : isYearly ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      2 Mo Free
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 min-h-12 text-sm leading-6 text-zinc-500">{plan.description}</p>
                <div className="mt-5 grid gap-2">
                  {plan.features.map((feature) => (
                    <p key={feature} className="flex items-start gap-2 text-sm text-zinc-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                      {feature}
                    </p>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                className={`mt-6 w-full ${
                  isCurrentExpired ? "bg-emerald-700 text-white hover:bg-emerald-800" : ""
                }`}
                disabled={isCurrentActive || isBlocked || loadingPlan !== null}
                onClick={() => requestUpgrade(plan.id)}
              >
                {loadingPlan === plan.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCurrentExpired ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                {isCurrentActive
                  ? "Current plan"
                  : isCurrentExpired
                    ? `Renew ${plan.name} (${isYearly ? "Annual" : "Monthly"})`
                    : `Choose ${plan.name} (${isYearly ? "Annual" : "Monthly"})`}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
