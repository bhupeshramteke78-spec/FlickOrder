"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#090D10] text-white flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#161B22]/90 p-8 text-center shadow-2xl backdrop-blur">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xl">
            ⚡
          </div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">FlickOrder Safe Mode</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white">Application Recovery</h1>
          <p className="mt-3 text-xs leading-relaxed text-zinc-400">
            A critical error occurred. Sentry has captured this crash for the development team. Tap below to reload.
          </p>
          {error.digest ? (
            <p className="mt-2 text-[10px] font-mono text-zinc-500">Trace: {error.digest}</p>
          ) : null}
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 w-full h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-lg transition"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
