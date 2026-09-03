"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Automatically report crash telemetry to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#090D10] px-5 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#161B22]/90 p-8 text-center shadow-2xl backdrop-blur">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
          <RotateCcw className="h-6 w-6" />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">FlickOrder Safe Mode</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-white">Temporary Glitch Detected</h1>
        <p className="mt-3 text-xs leading-relaxed text-zinc-400">
          Our automated diagnostic system has recorded this event. Tap below to refresh and resume your session immediately.
        </p>
        {error.digest ? (
          <p className="mt-2 text-[10px] font-mono text-zinc-500">Incident ID: {error.digest}</p>
        ) : null}
        <Button
          type="button"
          onClick={reset}
          className="mt-6 w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-lg gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reload & Resume
        </Button>
      </section>
    </main>
  );
}
