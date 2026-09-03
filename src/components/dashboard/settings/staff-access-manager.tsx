"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, Clock, Copy, Download, KeyRound, RefreshCw, Utensils } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PIN_RESET_COOLDOWN_MS, type RestaurantStaffPins } from "@/lib/staff-auth-types";

export function StaffAccessManager({
  restaurantSlug,
  initialPins,
  lastResetTimestamp: initialLastReset = null,
}: {
  restaurantId?: string;
  restaurantSlug: string;
  initialPins: RestaurantStaffPins;
  lastResetTimestamp?: number | null;
}) {
  const router = useRouter();
  const [kitchenPin, setKitchenPin] = useState(initialPins.kitchenPin);
  const [waiterPin, setWaiterPin] = useState(initialPins.waiterPin);
  const [lastReset, setLastReset] = useState<number | null>(initialLastReset);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(() => {
    if (!initialLastReset) return 0;
    const elapsed = Date.now() - initialLastReset;
    return Math.max(0, Math.ceil((PIN_RESET_COOLDOWN_MS - elapsed) / 1000));
  });
  const [isSaving, setIsSaving] = useState(false);

  const kitchenQrRef = useRef<HTMLDivElement>(null);
  const waiterQrRef = useRef<HTMLDivElement>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const kitchenUrl = `${origin}/kitchen?slug=${restaurantSlug}`;
  const waiterUrl = `${origin}/waiter?slug=${restaurantSlug}`;

  // Cooldown countdown timer (5-minute limit between manual resets)
  useEffect(() => {
    if (!lastReset) {
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastReset;
      const remaining = Math.max(0, Math.ceil((PIN_RESET_COOLDOWN_MS - elapsed) / 1000));
      setCooldownRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastReset]);

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  async function handleSavePins(nextKitchenPin: string, nextWaiterPin: string) {
    if (cooldownRemaining > 0) {
      toast.error(`Please wait ${formatTime(cooldownRemaining)} before changing the PIN again.`);
      return;
    }

    if (!/^\d{4,6}$/.test(nextKitchenPin) || !/^\d{4,6}$/.test(nextWaiterPin)) {
      toast.error("PINs must be 4 to 6 numeric digits.");
      return;
    }

    setIsSaving(true);
    const response = await fetch("/api/staff/auth", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kitchenPin: nextKitchenPin,
        waiterPin: nextWaiterPin,
      }),
    });
    setIsSaving(false);

    const body = (await response.json().catch(() => null)) as {
      error?: string;
      cooldownRemainingSeconds?: number;
      lastResetTimestamp?: number;
    } | null;

    if (!response.ok) {
      if (body?.cooldownRemainingSeconds) {
        setCooldownRemaining(body.cooldownRemainingSeconds);
      }
      toast.error(body?.error ?? "Failed to update staff PINs.");
      return;
    }

    setLastReset(body?.lastResetTimestamp ?? Date.now());
    toast.success("Staff access PINs updated successfully! (Next change available in 5 mins)");
    router.refresh();
  }

  function regeneratePin(role: "kitchen" | "waiter") {
    if (cooldownRemaining > 0) {
      toast.error(`PIN reset on cooldown. Please wait ${formatTime(cooldownRemaining)}.`);
      return;
    }

    const randomPin = String(Math.floor(1000 + Math.random() * 9000));
    if (role === "kitchen") {
      setKitchenPin(randomPin);
      handleSavePins(randomPin, waiterPin);
    } else {
      setWaiterPin(randomPin);
      handleSavePins(kitchenPin, randomPin);
    }
  }

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  }

  function downloadQr(ref: React.RefObject<HTMLDivElement | null>, filename: string) {
    const canvas = ref.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Staff QR code downloaded!");
  }

  const isCooldownActive = cooldownRemaining > 0;

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-950 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-emerald-700" />
            Kitchen & Waiter Staff Passcodes & QR Access
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Chefs and waiters can scan these QR codes and enter their 4-digit PIN to operate.
          </p>
        </div>
        {isCooldownActive ? (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
              <Clock className="h-3.5 w-3.5 animate-pulse" />
              Reset Cooldown: {formatTime(cooldownRemaining)}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Kitchen Station Card */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-100 text-blue-800">
                <ChefHat className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-950">Kitchen Terminal (Chef)</h3>
                <p className="text-[11px] text-zinc-500">Displays active cooking tickets</p>
              </div>
            </div>
            <span className="font-mono text-sm font-black text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
              PIN: {kitchenPin}
            </span>
          </div>

          <div ref={kitchenQrRef} className="grid place-items-center rounded-xl border border-zinc-200/80 bg-white p-3">
            <QRCodeCanvas value={kitchenUrl} size={140} includeMargin aria-label="Kitchen QR" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => regeneratePin("kitchen")}
              disabled={isSaving || isCooldownActive}
              className="h-8 flex-1 text-xs font-bold gap-1 disabled:opacity-60"
              title={isCooldownActive ? `Wait ${formatTime(cooldownRemaining)} before changing PIN` : "Generate new PIN"}
            >
              {isCooldownActive ? (
                <>
                  <Clock className="h-3 w-3" /> Wait ({formatTime(cooldownRemaining)})
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3" /> New PIN
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => copyText(kitchenUrl, "Kitchen Station Link")}
              className="h-8 flex-1 text-xs font-bold gap-1"
            >
              <Copy className="h-3 w-3" /> Copy Link
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => downloadQr(kitchenQrRef, `kitchen-${restaurantSlug}-qr.png`)}
              className="h-8 text-xs font-bold gap-1"
            >
              <Download className="h-3 w-3" /> PNG
            </Button>
          </div>
        </div>

        {/* Waiter Station Card */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-800">
                <Utensils className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-950">Waiter Station (Floor Staff)</h3>
                <p className="text-[11px] text-zinc-500">Shows dishes ready for table delivery</p>
              </div>
            </div>
            <span className="font-mono text-sm font-black text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              PIN: {waiterPin}
            </span>
          </div>

          <div ref={waiterQrRef} className="grid place-items-center rounded-xl border border-zinc-200/80 bg-white p-3">
            <QRCodeCanvas value={waiterUrl} size={140} includeMargin aria-label="Waiter QR" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => regeneratePin("waiter")}
              disabled={isSaving || isCooldownActive}
              className="h-8 flex-1 text-xs font-bold gap-1 disabled:opacity-60"
              title={isCooldownActive ? `Wait ${formatTime(cooldownRemaining)} before changing PIN` : "Generate new PIN"}
            >
              {isCooldownActive ? (
                <>
                  <Clock className="h-3 w-3" /> Wait ({formatTime(cooldownRemaining)})
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3" /> New PIN
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => copyText(waiterUrl, "Waiter Station Link")}
              className="h-8 flex-1 text-xs font-bold gap-1"
            >
              <Copy className="h-3 w-3" /> Copy Link
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => downloadQr(waiterQrRef, `waiter-${restaurantSlug}-qr.png`)}
              className="h-8 text-xs font-bold gap-1"
            >
              <Download className="h-3 w-3" /> PNG
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
