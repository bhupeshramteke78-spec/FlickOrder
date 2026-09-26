"use client";

import { Loader2 } from "lucide-react";

export function RouteLoading() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-md transition-opacity duration-200"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <Loader2 className="h-10 w-10 animate-spin text-rose-600 drop-shadow-sm" />
    </div>
  );
}

