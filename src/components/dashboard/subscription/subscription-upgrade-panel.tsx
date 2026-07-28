"use client";

import { Check, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PaidSubscriptionPlan, SubscriptionPlanDetails } from "@/lib/billing-plans";
import { cn, formatCurrency } from "@/lib/utils";

export type SubscriptionUpgradeRequestView = {
  id: string;
  plan: PaidSubscriptionPlan;
  amount: number;
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
  pendingRequest: SubscriptionUpgradeRequestView | null;
};

export function SubscriptionUpgradePanel({ plans, currentPlan, pendingRequest }: SubscriptionUpgradePanelProps) {
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState(pendingRequest);
  const [payment, setPayment] = useState<ManualPaymentView | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [loadingPlan, setLoadingPlan] = useState<PaidSubscriptionPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeRequest = selectedRequest;
  const requestedPlan = useMemo(
    () => plans.find((plan) => plan.id === activeRequest?.plan) ?? null,
    [activeRequest, plans],
  );

  async function requestUpgrade(plan: PaidSubscriptionPlan) {
    setLoadingPlan(plan);
    const response = await fetch("/api/subscription-upgrades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const body = (await response.json().catch(() => null)) as UpgradeCreateResponse | null;
    setLoadingPlan(null);

    if (!response.ok || !body?.request || !body.payment) {
      toast.error(body?.error ?? "Unable to create the UPI payment request.");
      return;
    }

    setSelectedRequest(body.request);
    setPayment(body.payment);
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
    <Card className="overflow-hidden p-0">
      <div className="border-b border-zinc-200 bg-zinc-50 p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Subscription plans</p>
        <h3 className="mt-2 text-2xl font-semibold text-zinc-950">Choose a plan and pay through UPI</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          The payment link fills the exact plan amount automatically. Your subscription activates only after FlickOrder
          verifies the UPI transaction.
        </p>
      </div>

      {requestIsUnderReview ? (
        <div className="border-b border-emerald-200 bg-emerald-50 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge tone="danger" className="border-emerald-200 bg-emerald-100 text-emerald-900">
                Verification pending
              </Badge>
              <p className="mt-3 font-semibold text-zinc-950">
                {requestedPlan?.name ?? activeRequest.plan} · {formatCurrency(activeRequest.amount)}
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
                  {requestedPlan?.name ?? activeRequest.plan} · {formatCurrency(activeRequest.amount)}
                </p>
              </div>
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
            </div>

            {payment ? (
              <div className="grid gap-5 rounded-xl border border-amber-200 bg-white p-4 lg:grid-cols-[auto_1fr]">
                <div className="mx-auto rounded-lg border border-zinc-200 bg-white p-2 lg:mx-0">
                  <QRCodeCanvas value={payment.upiUrl} size={164} includeMargin aria-label="Subscription payment QR code" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-zinc-500">Paying to</p>
                  <p className="mt-1 font-semibold text-zinc-950">{payment.payeeName}</p>
                  <p className="mt-3 text-sm text-zinc-500">Amount</p>
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
          const isCurrent = currentPlan === plan.id;
          const isBlocked = requestIsOpen || requestIsUnderReview;

          return (
            <div key={plan.id} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">{plan.name}</p>
                  <p className="mt-3 text-3xl font-black text-zinc-950">
                    {formatCurrency(plan.price)}
                    <span className="text-sm font-semibold text-zinc-500">/mo</span>
                  </p>
                </div>
                {isCurrent ? <Badge tone="danger" className="bg-emerald-50 text-emerald-800">Current</Badge> : null}
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
              <Button
                type="button"
                className="mt-6 w-full"
                disabled={isCurrent || isBlocked || loadingPlan !== null}
                onClick={() => requestUpgrade(plan.id)}
              >
                {loadingPlan === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {isCurrent ? "Current plan" : `Choose ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
