"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChefHat, Delete, Lock, Utensils } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

export function StaffPinKiosk({
  role,
  restaurantSlug,
  restaurantName,
}: {
  role: "chef" | "waiter";
  restaurantSlug: string;
  restaurantName: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUrlPin = searchParams.get("pin") ?? "";
  const [pin, setPin] = useState(initialUrlPin);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoSubmittedRef = useRef(false);

  const submitPin = useCallback(async (pinToSubmit: string) => {
    if (pinToSubmit.length < 4) return;

    setIsSubmitting(true);

    const response = await fetch("/api/staff/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "LOGIN",
        slug: restaurantSlug,
        role,
        pin: pinToSubmit,
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(body?.error ?? "Incorrect PIN. Please try again.");
      setPin("");
      return;
    }

    toast.success(`${role === "chef" ? "Kitchen" : "Waiter"} terminal unlocked!`);
    router.refresh();
  }, [restaurantSlug, role, router]);

  useEffect(() => {
    if (initialUrlPin && /^\d{4,6}$/.test(initialUrlPin) && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      submitPin(initialUrlPin);
    }
  }, [initialUrlPin, submitPin]);

  function handleKeyPress(digit: string) {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        submitPin(nextPin);
      }
    }
  }

  function handleBackspace() {
    setPin((prev) => prev.slice(0, -1));
  }

  const isChef = role === "chef";
  const Icon = isChef ? ChefHat : Utensils;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090D10] p-4 text-white">
      <Card className="w-full max-w-sm border-white/10 bg-[#161B22]/90 p-6 shadow-2xl backdrop-blur">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Icon className="h-7 w-7" />
          </div>

          <h1 className="mt-4 text-xl font-black tracking-tight text-zinc-100">
            {isChef ? "Kitchen Station Kiosk" : "Waiter Floor Station"}
          </h1>
          <p className="mt-1 text-xs text-zinc-400 font-medium">
            {restaurantName} · Enter 4-digit Staff PIN
          </p>

          {/* PIN Input Dots */}
          <div className="mt-6 flex justify-center gap-3">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`h-4 w-4 rounded-full border transition-all duration-200 ${
                  pin.length > index
                    ? "border-emerald-400 bg-emerald-400 shadow-[0_0_10px_#10b981]"
                    : "border-white/20 bg-white/5"
                }`}
              />
            ))}
          </div>

          {/* Touch-Friendly Number Pad */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                disabled={isSubmitting}
                className="h-14 rounded-2xl border border-white/10 bg-white/[0.04] text-xl font-bold text-zinc-100 transition active:scale-95 hover:bg-white/10 hover:border-white/20"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin("")}
              disabled={isSubmitting || pin.length === 0}
              className="h-14 rounded-2xl border border-white/10 bg-white/[0.02] text-xs font-bold text-zinc-400 transition hover:bg-white/10"
            >
              Clear
            </button>
            <button
              key="0"
              type="button"
              onClick={() => handleKeyPress("0")}
              disabled={isSubmitting}
              className="h-14 rounded-2xl border border-white/10 bg-white/[0.04] text-xl font-bold text-zinc-100 transition active:scale-95 hover:bg-white/10"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              disabled={isSubmitting || pin.length === 0}
              className="grid h-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.02] text-zinc-400 transition hover:bg-white/10"
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 font-medium">
            <Lock className="h-3 w-3" /> Secure multi-tenant terminal
          </p>
        </div>
      </Card>
    </div>
  );
}
