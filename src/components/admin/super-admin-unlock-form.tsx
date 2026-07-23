"use client";

import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { FlickOrderLogo } from "@/components/brand/flickorder-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function SuperAdminUnlockForm({ adminName }: { adminName: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function unlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const response = await fetch("/api/admin/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setIsSubmitting(false);

    if (!response.ok) {
      toast.error(body?.error ?? "Unable to unlock super admin.");
      return;
    }

    toast.success("Super admin unlocked.");
    router.refresh();
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#071117] px-5 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,102,0,0.22),transparent_30%),radial-gradient(circle_at_78%_20%,rgba(16,185,129,0.2),transparent_34%)]" />
      <Card className="relative w-full max-w-5xl overflow-hidden border-white/10 bg-white/[0.05] p-0 text-white shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="grid lg:grid-cols-[1fr_420px]">
          <div className="p-7 sm:p-9">
            <div className="flex items-center gap-3">
              <FlickOrderLogo className="h-11 w-11 rounded-xl" priority />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">FlickOrder Command</p>
                <h1 className="text-2xl font-semibold">Protected operations desk</h1>
              </div>
            </div>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">Second gate</p>
            <h2 className="mt-2 max-w-xl text-4xl font-semibold tracking-tight">Unlock super admin controls</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300">
              Signed in as {adminName}. Enter the separate super admin access password before payment verification,
              subscription changes, audit inspection, and platform search become available.
            </p>

            <form onSubmit={unlock} className="mt-8 grid max-w-md gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-200">Access password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 rounded-xl border border-white/10 bg-white/10 px-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-300"
                  autoComplete="current-password"
                  required
                />
              </label>
              <Button type="submit" variant="glass" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Unlock command center
              </Button>
            </form>
          </div>
          <div className="border-t border-white/10 bg-white/[0.04] p-7 lg:border-l lg:border-t-0">
            <div className="rounded-3xl border border-white/10 bg-[#071117]/60 p-5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-100">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">Session policy</p>
              <div className="mt-4 grid gap-3 text-sm text-zinc-300">
                <p className="rounded-2xl bg-white/[0.06] px-4 py-3">Role must be SUPER_ADMIN.</p>
                <p className="rounded-2xl bg-white/[0.06] px-4 py-3">Password unlock is stored in an HTTP-only signed cookie.</p>
                <p className="rounded-2xl bg-white/[0.06] px-4 py-3">Sensitive actions are written to audit logs.</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}
