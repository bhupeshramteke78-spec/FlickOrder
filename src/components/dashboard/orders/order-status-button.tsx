"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/lib/database.types";

export function OrderStatusButton({
  orderId,
  status,
  disabled = false,
  children,
}: {
  orderId: string;
  status: OrderStatus;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  async function updateStatus() {
    if (disabled) {
      toast.error("Choose a plan to continue updating orders.");
      return;
    }

    setIsUpdating(true);

    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setIsUpdating(false);

    const body = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      toast.error(body?.error ?? "Unable to update order.");
      return;
    }

    toast.success("Order updated.");
    router.refresh();
  }

  return (
    <Button type="button" size="sm" className="mt-3 w-full" disabled={disabled || isUpdating} onClick={updateStatus}>
      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}
