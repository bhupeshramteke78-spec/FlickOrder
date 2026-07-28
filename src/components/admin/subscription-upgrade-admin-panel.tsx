"use client";

import { Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export type AdminSubscriptionUpgradeRequest = {
  id: string;
  restaurantName: string;
  ownerName: string;
  plan: string;
  amount: number;
  status: string;
  transactionNote: string;
  transactionId: string | null;
  paymentSubmittedAt: string | null;
  createdAt: string;
};

export function SubscriptionUpgradeAdminPanel({ requests }: { requests: AdminSubscriptionUpgradeRequest[] }) {
  const router = useRouter();
  const [loadingRequestId, setLoadingRequestId] = useState<string | null>(null);

  async function updateRequest(requestId: string, action: "APPROVE" | "REJECT") {
    setLoadingRequestId(requestId);
    const response = await fetch(`/api/subscription-upgrades/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setLoadingRequestId(null);

    if (!response.ok) {
      toast.error(body?.error ?? "Unable to update subscription request.");
      return;
    }

    toast.success(action === "APPROVE" ? "Subscription approved." : "Subscription rejected.");
    router.refresh();
  }

  return (
    <Card>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Subscription requests</p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-950">Manual verification queue</h2>
          <p className="mt-2 text-sm text-zinc-500">Verify the UPI transaction in your payment account before approving a plan.</p>
        </div>
        <Badge tone="danger" className="w-fit border-emerald-100 bg-emerald-50 text-emerald-800">
          {requests.length} pending
        </Badge>
      </div>

      <div className="mt-5 grid gap-3">
        {requests.length > 0 ? (
          requests.map((request) => (
            <article key={request.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-zinc-950">{request.restaurantName}</h3>
                    <Badge tone="danger" className="border-amber-200 bg-amber-50 text-amber-900">
                      {request.status.replaceAll("_", " ").toLowerCase()}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">
                    Owner: <span className="font-semibold text-zinc-900">{request.ownerName}</span> | Plan:{" "}
                    <span className="font-semibold capitalize text-zinc-900">{request.plan}</span> | Amount:{" "}
                    <span className="font-semibold text-emerald-700">{formatCurrency(request.amount)}</span>
                  </p>
                  <p className="mt-1 break-words text-sm text-zinc-500">Transaction note: {request.transactionNote}</p>
                  <p className="mt-1 break-words text-sm text-zinc-500">
                    UPI transaction ID: <span className="font-semibold text-zinc-900">{request.transactionId ?? "Not submitted"}</span>
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" disabled={loadingRequestId !== null} onClick={() => updateRequest(request.id, "APPROVE")}>
                    {loadingRequestId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Approve
                  </Button>
                  <Button type="button" variant="danger" disabled={loadingRequestId !== null} onClick={() => updateRequest(request.id, "REJECT")}>
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-10 text-center">
            <p className="text-sm font-semibold text-zinc-900">No manual subscription payments waiting.</p>
            <p className="mt-2 text-sm text-zinc-500">Submitted UPI payments will appear here for verification.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
