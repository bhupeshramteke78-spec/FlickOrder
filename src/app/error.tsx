"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#04111f] px-5 text-white">
      <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl shadow-black/30 backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">FlickOrder</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Something did not load correctly.</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          Please retry the page. If the issue continues, the restaurant data or network connection may need attention.
        </p>
        <Button type="button" variant="glass" className="mt-6 border-emerald-200/40 bg-emerald-700/35" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
          Try again
        </Button>
      </section>
    </main>
  );
}
