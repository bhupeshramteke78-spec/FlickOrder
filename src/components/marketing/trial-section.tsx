"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { OwnerRegistrationForm } from "@/components/auth/owner-registration-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function TrialSection() {
  const [showRegistration, setShowRegistration] = useState(false);

  return (
    <section 
      id="trial" 
      className="relative mt-20 overflow-hidden rounded-[32px] border border-orange-500/30 bg-gradient-to-br from-[#0c1822] via-[#081219] to-[#140c10] p-8 sm:p-12 backdrop-blur-xl shadow-2xl shadow-black/60"
    >
      {/* Ambient Sunset Glow Behind CTA */}
      <div 
        className="pointer-events-none absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-gradient-to-tl from-orange-500/30 via-rose-500/20 to-transparent blur-3xl"
        aria-hidden="true"
      />
      <div 
        className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>For Restaurants & Cafes</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Ready to upgrade your dine-in flow?{" "}
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              Try KhaoScan free for 3 days.
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base leading-relaxed text-zinc-300 max-w-xl">
            Register your restaurant in 2 minutes, generate table QR menus instantly, accept live orders, and explore full owner features before choosing a plan.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {!showRegistration ? (
              <Button
                type="button"
                size="lg"
                className="h-12 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 px-7 text-sm font-bold text-white shadow-lg shadow-orange-500/30 hover:opacity-95 hover:scale-105 active:scale-95 transition"
                onClick={() => setShowRegistration(true)}
              >
                Start Free Trial
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : null}

            <Link href="/auth/owner?mode=login">
              <Button 
                variant="glass" 
                size="lg"
                className="h-12 rounded-full border-white/15 bg-white/[0.06] px-6 text-sm font-semibold text-zinc-200 hover:bg-white/10 hover:text-white"
              >
                Owner Login →
              </Button>
            </Link>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs font-medium text-zinc-400">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Instant setup • No credit card required • Zero hardware lock-in</span>
          </div>
        </div>

        {showRegistration ? (
          <Card className="relative z-10 border border-white/15 bg-[#0b1822]/95 p-6 shadow-2xl backdrop-blur-xl">
            <OwnerRegistrationForm />
          </Card>
        ) : (
          <div className="hidden lg:flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-md">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl shadow-orange-500/30">
              <Sparkles className="h-8 w-8" />
            </div>
            <p className="mt-4 text-center font-bold text-white text-lg">Instant QR Setup</p>
            <p className="mt-1 text-center text-xs text-zinc-400 max-w-xs">
              Generate dynamic table QR codes, upload dishes, and start receiving UPI payments right away.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
