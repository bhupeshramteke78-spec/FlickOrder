"use client";

import { Loader2 } from "lucide-react";

export function RouteLoading() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-xs transition-opacity"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <Loader2 className="h-9 w-9 animate-spin text-rose-600" />
    </div>
  );
}

