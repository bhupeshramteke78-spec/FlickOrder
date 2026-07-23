"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PaymentAcceptButton({ orderId, disabled = false }: { orderId: string; disabled?: boolean }) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);

  async function acceptPayment() {
    if (disabled) {
      toast.error("Choose a plan to continue accepting payments.");
      return;
    }

    setIsAccepting(true);

    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: "PAID" }),
    });

    setIsAccepting(false);

    const body = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      toast.error(body?.error ?? "Unable to accept payment.");
      return;
    }

    toast.success("Payment accepted.");
    router.refresh();
  }

  return (
    <Button type="button" size="sm" className="mt-3 w-full bg-black text-white hover:bg-zinc-800" disabled={disabled || isAccepting} onClick={acceptPayment}>
      {isAccepting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Payment Accept
    </Button>
  );
}
