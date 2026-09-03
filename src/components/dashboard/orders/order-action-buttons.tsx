"use client";

import { Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function OrderAcceptDeclineActions({
  orderId,
  orderNumber,
  disabled = false,
}: {
  orderId: string;
  orderNumber: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);

  async function handleAccept() {
    setIsAccepting(true);
    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACCEPTED" }),
    });
    setIsAccepting(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(body?.error ?? "Unable to accept order.");
      return;
    }

    toast.success(`Order #${orderNumber} accepted & sent to kitchen!`);
    router.refresh();
  }

  async function handleDecline() {
    setIsDeclining(true);
    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    setIsDeclining(false);
    setShowDeclineConfirm(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(body?.error ?? "Unable to decline order.");
      return;
    }

    toast.info(`Order #${orderNumber} declined & table cleared.`);
    router.refresh();
  }

  if (showDeclineConfirm) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs space-y-2">
        <p className="font-bold text-rose-950">Decline this order?</p>
        <p className="text-rose-700">Customer will be notified and table freed.</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            type="button"
            onClick={handleDecline}
            disabled={disabled || isDeclining}
            className="h-8 flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold"
          >
            {isDeclining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Yes, Decline"}
          </Button>
          <Button
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => setShowDeclineConfirm(false)}
            className="h-8"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        type="button"
        onClick={handleAccept}
        disabled={disabled || isAccepting || isDeclining}
        className="h-9 flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm shadow-emerald-500/20"
      >
        {isAccepting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-4 w-4" />}
        Accept Order
      </Button>

      <Button
        size="sm"
        type="button"
        variant="secondary"
        onClick={() => setShowDeclineConfirm(true)}
        disabled={disabled || isAccepting || isDeclining}
        className="h-9 gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 font-bold"
      >
        <X className="h-4 w-4" /> Decline
      </Button>
    </div>
  );
}
