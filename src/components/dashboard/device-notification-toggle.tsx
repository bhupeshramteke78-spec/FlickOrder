"use client";

import { Bell, BellOff, Loader2, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { playNotificationChime } from "@/lib/notification-sound";

type PushConfigResponse = {
  publicKey: string | null;
  configured: boolean;
};

type DeviceNotificationToggleProps = {
  restaurantId: string | null;
  className?: string;
};

export function DeviceNotificationToggle({ restaurantId, className }: DeviceNotificationToggleProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isEnabled, setIsEnabled] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [hasPushConfig, setHasPushConfig] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function syncDeviceNotificationState() {
      if (!isMounted) return;

      if (typeof window !== "undefined") {
        const savedAlertPref = localStorage.getItem(`khaoscan_alerts_${restaurantId}`);
        if (savedAlertPref === "enabled") {
          setIsEnabled(true);
        }
      }

      if ("Notification" in window) {
        setPermission(Notification.permission);
        if (Notification.permission === "granted") {
          setIsEnabled(true);
        }
      }

      if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
          const [subscription, config] = await Promise.all([
            getExistingSubscription(),
            fetch("/api/push-subscriptions")
              .then((res) => res.json() as Promise<PushConfigResponse>)
              .catch(() => ({ publicKey: null, configured: false })),
          ]);

          if (isMounted) {
            setHasPushConfig(Boolean(config.configured && config.publicKey));
            if (subscription) {
              setIsEnabled(true);
            }
          }
        } catch {
          // Keep local fallback
        }
      }
    }

    void syncDeviceNotificationState();

    return () => {
      isMounted = false;
    };
  }, [restaurantId]);

  const label = useMemo(() => {
    if (permission === "denied") {
      return "Alerts Blocked";
    }
    if (isEnabled) {
      return "Alerts Active";
    }
    return "Enable Live Alerts";
  }, [isEnabled, permission]);

  if (!restaurantId) {
    return null;
  }

  async function toggleDeviceAlerts() {
    if (isBusy) return;

    // If already enabled, play test sound & offer disable/test feedback
    if (isEnabled) {
      setIsBusy(true);
      try {
        await playNotificationChime("order");
        toast.success("🔔 Order alert sound is active and working perfectly!");
      } finally {
        setIsBusy(false);
      }
      return;
    }

    setIsBusy(true);

    try {
      // 1. Request Browser Notification Permission if supported
      let granted = false;
      if ("Notification" in window) {
        try {
          const req = await Notification.requestPermission();
          setPermission(req);
          granted = req === "granted";
          if (req === "denied") {
            toast.error("Notifications are blocked in your browser settings. Please allow notifications for this site.");
          }
        } catch {
          // Ignore
        }
      }

      // 2. If WebPush VAPID key is configured, register service worker push
      if (hasPushConfig && "serviceWorker" in navigator) {
        try {
          const configRes = await fetch("/api/push-subscriptions");
          const config = (await configRes.json()) as PushConfigResponse;

          if (config.configured && config.publicKey) {
            const registration = await navigator.serviceWorker.register("/flickorder-push-sw.js");
            const existing = await registration.pushManager.getSubscription();
            const sub = existing ?? await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(config.publicKey),
            });

            await fetch("/api/push-subscriptions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(sub.toJSON()),
            });
          }
        } catch {
          // Fall back to local sound and in-app alerts
        }
      }

      // 3. Play test chime immediately to unlock AudioContext
      await playNotificationChime("order");

      // 4. Save preference
      localStorage.setItem(`khaoscan_alerts_${restaurantId}`, "enabled");
      setIsEnabled(true);

      toast.success(
        granted
          ? "🔔 Live alerts & sound enabled! You'll hear a chime for new customer QR orders."
          : "🔔 Live order sound alert enabled! Sound will chime when new orders arrive."
      );
    } catch {
      toast.error("Could not activate audio alerts. Please click anywhere on the page to allow sound.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant={isEnabled ? "glass" : "secondary"}
      size="sm"
      disabled={isBusy}
      onClick={toggleDeviceAlerts}
      className={`${className ?? ""} ${
        isEnabled
          ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100/80 shadow-xs"
          : "border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
      }`}
      title={isEnabled ? "Alerts are active. Click to test sound chime." : "Click to enable sound chime and browser notifications."}
    >
      {isBusy ? (
        <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
      ) : isEnabled ? (
        <Volume2 className="h-4 w-4 text-rose-600 animate-pulse" />
      ) : permission === "denied" ? (
        <BellOff className="h-4 w-4 text-zinc-400" />
      ) : (
        <Bell className="h-4 w-4 text-zinc-500" />
      )}
      <span className="text-xs font-bold">{label}</span>
    </Button>
  );
}

async function getExistingSubscription() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.getRegistration("/flickorder-push-sw.js");
  return registration?.pushManager.getSubscription() ?? null;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
