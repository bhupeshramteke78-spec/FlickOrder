"use client";

import Link from "next/link";
import { ArrowRight, QrCode, ChefHat, Sparkles, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CoreToolsSection() {
  return (
    <section className="relative mt-20 rounded-[32px] border border-white/10 bg-white/[0.02] px-6 py-16 text-white sm:px-10 lg:py-24 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
      {/* Ambient Sunset Glow Behind Section */}
      <div 
        className="pointer-events-none absolute left-1/2 -top-32 -translate-x-1/2 h-80 w-[600px] rounded-full bg-gradient-to-b from-orange-500/20 via-amber-500/10 to-transparent blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Header with Eyebrow and Button */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Core Capabilities</span>
            </div>

            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Powerful Tools <br />
              Built for <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">Your Restaurant</span>
            </h2>
          </div>

          <div className="max-w-md lg:text-right">
            <p className="text-sm sm:text-base leading-relaxed text-zinc-300">
              Explore our unified suite designed to simplify daily dining workflows, accelerate table turnover, and increase margins.
            </p>
            <div className="mt-5 lg:flex lg:justify-end">
              <Link href="/pricing">
                <Button 
                  size="sm" 
                  className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs sm:text-sm px-5 py-2 shadow-lg shadow-orange-500/25 hover:opacity-95 hover:scale-105 transition"
                >
                  View Plans & Pricing
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Soft 3D Glass Bento Cards */}
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {/* Card 01 - Warm Amber / QR Ordering */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-7 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:border-amber-500/40 hover:shadow-2xl hover:shadow-orange-500/10">
            <div>
              {/* Visual Mockup Stage */}
              <div className="relative mb-6 flex h-48 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent p-4 border border-amber-500/20">
                <div className="relative flex flex-col items-center justify-center rounded-2xl bg-[#0b1822] p-5 shadow-xl shadow-black/40 border border-amber-500/30 transition-transform duration-300 group-hover:scale-105">
                  <QrCode className="h-16 w-16 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]" />
                  <span className="mt-2 rounded-full bg-amber-500/20 border border-amber-500/30 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    Table 3 QR
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <span>01</span>
                <span className="h-px w-6 bg-amber-500/40" />
                <span>QR Table Ordering</span>
              </div>

              <h3 className="mt-3 text-xl font-bold text-white">
                Instant Contactless Menu
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                Guests scan the table QR code, browse photo menus with dish filters, and place orders directly to the kitchen.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-amber-300">
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              <span>Zero customer app download required</span>
            </div>
          </div>

          {/* Card 02 - Coral Peach / Direct UPI */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-7 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:border-rose-500/40 hover:shadow-2xl hover:shadow-rose-500/10">
            <div>
              {/* Visual Mockup Stage */}
              <div className="relative mb-6 flex h-48 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/15 via-orange-500/10 to-transparent p-4 border border-rose-500/20">
                <div className="relative flex items-center gap-3.5 rounded-2xl bg-[#0b1822] px-5 py-4 shadow-xl shadow-black/40 border border-rose-500/30 transition-transform duration-300 group-hover:scale-105">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-xl shadow-lg shadow-emerald-500/30">
                    ₹
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Direct UPI</p>
                    <p className="text-sm font-black text-white">0% Commission</p>
                    <p className="text-[11px] text-emerald-400 font-semibold">Direct Bank Settlement</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                <span>02</span>
                <span className="h-px w-6 bg-rose-500/40" />
                <span>Direct UPI Payments</span>
              </div>

              <h3 className="mt-3 text-xl font-bold text-white">
                Direct Money in Your Bank
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                Customer payments flow directly to your UPI ID via GPay, PhonePe, or Paytm without aggregator fees or waiting periods.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-rose-300">
              <Zap className="h-4 w-4 text-rose-400" />
              <span>Instant order payment verification</span>
            </div>
          </div>

          {/* Card 03 - Soft Lilac / Kitchen KDS */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-7 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:border-purple-500/40 hover:shadow-2xl hover:shadow-purple-500/10">
            <div>
              {/* Visual Mockup Stage */}
              <div className="relative mb-6 flex h-48 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/15 via-orange-500/10 to-transparent p-4 border border-purple-500/20">
                <div className="relative w-full max-w-[210px] rounded-xl bg-[#0b1822] p-4 shadow-xl shadow-black/40 border border-purple-500/30 transition-transform duration-300 group-hover:scale-105">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                      <ChefHat className="h-3.5 w-3.5 text-purple-400" /> Kitchen
                    </span>
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      Live Sync
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] font-semibold text-zinc-200">
                    <p className="text-white">#ORD-104 • Table 2</p>
                    <p className="text-zinc-400 text-[10px] mt-0.5">2x Paneer Tikka • 1x Biryani</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400">
                <span>03</span>
                <span className="h-px w-6 bg-purple-500/40" />
                <span>Kitchen Live KDS</span>
              </div>

              <h3 className="mt-3 text-xl font-bold text-white">
                Real-Time Kitchen Sync
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                Kitchen and waiter screens update instantly on incoming orders. No manual shouting or lost paper KOT tickets.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-purple-300">
              <CheckCircle2 className="h-4 w-4 text-purple-400" />
              <span>Realtime status tracking across tabs</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
