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
      <Button 
        type="button" 
        variant="glass" 
        onClick={useLocation} 
        disabled={status === "loading"}
        className="rounded-xl border-white/10 bg-white/[0.06] text-zinc-200 hover:bg-white/10 hover:text-white text-xs sm:text-sm"
      >
        <LocateFixed className="h-4 w-4 text-amber-400 mr-1.5" />
        {status === "loading" ? "Locating..." : "Use my location"}
      </Button>
      {status === "failed" && message ? (
        <p className="max-w-xs text-xs leading-5 text-orange-200">{message}</p>
      ) : null}
    </div>
  );
}
