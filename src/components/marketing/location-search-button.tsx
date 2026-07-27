"use client";

import { LocateFixed } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getBrowserLocation, getBrowserLocationMessage } from "@/lib/browser-location";

export function LocationSearchButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "loading" | "failed">("idle");
  const [message, setMessage] = useState("");

  async function useLocation() {
    setMessage("");
    setStatus("loading");

    const result = await getBrowserLocation();

    if (!result.ok) {
      setMessage(getBrowserLocationMessage(result.reason));
      setStatus("failed");
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("lat", String(result.coordinates.latitude));
    params.set("lng", String(result.coordinates.longitude));
    setStatus("idle");
    router.push(`/restaurants/search?${params.toString()}`);
  }

  return (
    <div className="grid gap-1">
      <Button type="button" variant="secondary" onClick={useLocation} disabled={status === "loading"}>
        <LocateFixed className="h-4 w-4" />
        {status === "loading" ? "Locating" : "Use my location"}
      </Button>
      {status === "failed" && message ? (
        <p className="max-w-xs text-xs leading-5 text-orange-200">{message}</p>
      ) : null}
    </div>
  );
}
