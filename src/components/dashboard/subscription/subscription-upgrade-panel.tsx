"use client";

import { Check, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PaidSubscriptionPlan, SubscriptionPlanDetails } from "@/lib/billing-plans";
import { formatCurrency } from "@/lib/utils";

type RazorpayCheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: "INR";
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayCheckoutResponse) => void;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

export type SubscriptionUpgradeRequestView = {
  id: string;
  plan: PaidSubscriptionPlan;
  amount: number;
  status: "PENDING_PAYMENT" | "VERIFICATION_PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  transactionNote: string;
  razorpayOrderId: string | null;
  createdAt: string;
};

type RazorpayOrderView = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: "INR";
  name: string;
  description: string;
};

type UpgradeCreateResponse = {
  request?: SubscriptionUpgradeRequestView;
  razorpay?: RazorpayOrderView | null;
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
  const [loadingPlan, setLoadingPlan] = useState<PaidSubscriptionPlan | null>(null);
  const [verifyingRequestId, setVerifyingRequestId] = useState<string | null>(null);
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

    if (!response.ok || !body?.request || !body.razorpay) {
      toast.error(body?.error ?? "Unable to start Razorpay payment.");
      return;
    }

    setSelectedRequest(body.request);
    await openRazorpayCheckout(body.request, body.razorpay);
  }

  async function openRazorpayCheckout(request: SubscriptionUpgradeRequestView, razorpay: RazorpayOrderView) {
    const scriptReady = await loadRazorpayScript();

    if (!scriptReady || !window.Razorpay) {
      toast.error("Razorpay checkout could not load. Please check your connection and try again.");
      return;
    }

    const checkout = new window.Razorpay({
      key: razorpay.keyId,
      amount: razorpay.amount,
      currency: razorpay.currency,
      name: razorpay.name,
      description: razorpay.description,
      order_id: razorpay.orderId,
      theme: { color: "#059669" },
      modal: {
        ondismiss: () => {
          toast.message("Payment paused. You can continue this payment anytime from Subscription.");
        },
      },
      handler: (payment) => {
        void verifyPayment(request.id, payment);
      },
    });

    checkout.open();
  }

  async function verifyPayment(requestId: string, payment: RazorpayCheckoutResponse) {
    setVerifyingRequestId(requestId);
    const response = await fetch(`/api/subscription-upgrades/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "VERIFY_RAZORPAY",
        razorpayOrderId: payment.razorpay_order_id,
        razorpayPaymentId: payment.razorpay_payment_id,
        razorpaySignature: payment.razorpay_signature,
      }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setVerifyingRequestId(null);

    if (!response.ok) {
      toast.error(body?.error ?? "Payment verification failed.");
      return;
    }

    setSelectedRequest(null);
    toast.success("Payment verified. Subscription activated.");
    router.refresh();
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-zinc-200 bg-zinc-50 p-5">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Upgrade subscription</p>
            <h3 className="mt-2 text-2xl font-semibold text-zinc-950">Choose a plan and pay securely</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              FlickOrder creates the payment order on the server and activates the plan only after Razorpay signature verification.
            </p>
          </div>
        </div>
      </div>

      {activeRequest && activeRequest.status === "PENDING_PAYMENT" ? (
        <div className="border-b border-amber-200 bg-amber-50 p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone="danger" className="border-amber-200 bg-amber-100 text-amber-900">
                  Payment pending
                </Badge>
                {requestedPlan ? (
                  <span className="text-sm font-semibold text-zinc-900">
                    {requestedPlan.name} · {formatCurrency(activeRequest.amount)}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-zinc-600">Complete the Razorpay checkout to activate this subscription.</p>
            </div>
            <Button
              type="button"
              disabled={loadingPlan !== null || verifyingRequestId !== null}
              onClick={() => requestUpgrade(activeRequest.plan)}
            >
              {loadingPlan === activeRequest.plan || verifyingRequestId === activeRequest.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Continue payment
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 p-5 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isBlocked = Boolean(activeRequest && activeRequest.status === "PENDING_PAYMENT");

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
                disabled={isCurrent || isBlocked || loadingPlan !== null || verifyingRequestId !== null}
                onClick={() => requestUpgrade(plan.id)}
              >
                {loadingPlan === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {isCurrent ? "Current plan" : `Upgrade to ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>("script[src='https://checkout.razorpay.com/v1/checkout.js']");

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
