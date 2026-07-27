"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, Loader2, UserX, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function BookingActions({ bookingId, status }: { bookingId: string; status: string }) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  async function updateStatus(nextStatus: "CONFIRMED" | "DECLINED" | "CANCELLED" | "COMPLETED" | "NO_SHOW") {
    setPendingAction(nextStatus);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        toast.error(body?.error ?? "Unable to update the booking.");
        return;
      }

      toast.success(nextStatus === "CONFIRMED" ? "Booking confirmed" : "Booking updated");
      router.refresh();
    } catch {
      toast.error("Unable to reach FlickOrder. Check your connection and try again.");
    } finally {
      setPendingAction(null);
    }
  }

  if (status === "PENDING") {
    return (
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button onClick={() => updateStatus("CONFIRMED")} disabled={pendingAction !== null}>
          {pendingAction === "CONFIRMED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Confirm
        </Button>
        <Button variant="secondary" onClick={() => updateStatus("DECLINED")} disabled={pendingAction !== null}>
          {pendingAction === "DECLINED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          Decline
        </Button>
      </div>
    );
  }

  if (status === "CONFIRMED") {
    return (
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button onClick={() => updateStatus("COMPLETED")} disabled={pendingAction !== null}>
          {pendingAction === "COMPLETED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Completed
        </Button>
        <Button variant="secondary" onClick={() => updateStatus("NO_SHOW")} disabled={pendingAction !== null}>
          {pendingAction === "NO_SHOW" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
          No show
        </Button>
        <Button
          variant="secondary"
          className="col-span-2 border-rose-200 text-rose-700 hover:bg-rose-50"
          onClick={() => updateStatus("CANCELLED")}
          disabled={pendingAction !== null}
        >
          {pendingAction === "CANCELLED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
          Cancel reservation
        </Button>
      </div>
    );
  }

  return null;
}
