"use client";

import { Loader2 } from "lucide-react";

export function RouteLoading() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-xs transition-opacity"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-lg border border-zinc-200/80">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <p className="text-xs font-bold text-zinc-600 tracking-wide uppercase">Loading...</p>
      </div>
    </div>
  );
}
