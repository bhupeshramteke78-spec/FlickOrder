"use client";

import { BellRing, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type PushConfigResponse = {
  publicKey: string | null;
  configured: boolean;
};

type DeviceNotificationToggleProps = {
  restaurantId: string | null;
};

export function DeviceNotificationToggle({ restaurantId }: DeviceNotificationToggleProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isEnabled, setIsEnabled] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function syncDeviceNotificationState() {
      const supported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;

      if (!isMounted) {
        return;
      }

      setIsSupported(supported);

      if (!supported) {
        return;
      }

      const [subscription, config] = await Promise.all([
        getExistingSubscription(),
        fetch("/api/push-subscriptions")
          .then((response) => response.json() as Promise<PushConfigResponse>)
          .catch(() => ({ publicKey: null, configured: false })),
      ]);

      if (!isMounted) {
        return;
      }

      setPermission(Notification.permission);
      setIsEnabled(Boolean(subscription));
      setIsConfigured(Boolean(config.configured && config.publicKey));
    }

    void syncDeviceNotificationState();

    return () => {
      isMounted = false;
    };
  }, [restaurantId]);

  const label = useMemo(() => {
    if (!isSupported) {
      return "Device alerts unavailable";
    }

    if (!isConfigured) {
      return "Device alerts not set";
    }

    if (permission === "denied") {
      return "Device alerts blocked";
    }

    return isEnabled ? "Device alerts on" : "Enable device alerts";
  }, [isConfigured, isEnabled, isSupported, permission]);

  if (!restaurantId) {
    return null;
  }

  async function enableDeviceAlerts() {
    if (!isSupported) {
      toast.error("This browser does not support device notifications.");
      return;
    }

    setIsBusy(true);

    try {
      const configResponse = await fetch("/api/push-subscriptions");
      const config = (await configResponse.json()) as PushConfigResponse;

      if (!config.configured || !config.publicKey) {
        toast.error("Device notifications are not configured on this deployment.");
        return;
      }

      const nextPermission = Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();

      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        toast.error("Allow notifications in your browser to receive device alerts.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/flickorder-push-sw.js");
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription = existingSubscription ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey),
      });

      const response = await fetch("/api/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error(body?.error ?? "Unable to enable device alerts.");
        return;
      }

      setIsEnabled(true);
      toast.success("Device alerts enabled for new orders.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant={isEnabled ? "glass" : "secondary"}
      size="sm"
      disabled={!isSupported || !isConfigured || permission === "denied" || isBusy}
      onClick={enableDeviceAlerts}
      className={isEnabled ? "w-full justify-start border-emerald-300/20 bg-emerald-500/15 text-emerald-100" : "w-full justify-start"}
      title={permission === "denied" ? "Enable notifications from browser site settings first." : undefined}
    >
      {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
      {label}
    </Button>
  );
}

async function getExistingSubscription() {
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
