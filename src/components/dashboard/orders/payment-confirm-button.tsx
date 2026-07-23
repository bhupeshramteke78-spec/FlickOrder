"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PaymentConfirmButton({ orderId, paymentId, disabled = false }: { orderId: string; paymentId: string; disabled?: boolean }) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);

  async function confirmPayment() {
    if (disabled) {
      toast.error("Choose a plan to continue confirming payments.");
      return;
    }

    setIsConfirming(true);

    const response = await fetch("/api/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, paymentId }),
    });

    setIsConfirming(false);

    const body = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      toast.error(body?.error ?? "Unable to confirm payment.");
      return;
    }

    toast.success("Payment confirmed.");
    router.refresh();
  }

  return (
    <Button type="button" size="sm" className="mt-3 w-full" disabled={disabled || isConfirming} onClick={confirmPayment}>
      {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Confirm Payment
    </Button>
  );
}
