"use client";

import Link from "next/link";
import { ArrowRight, QrCode, ChefHat, Sparkles, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CoreToolsSection() {
  return (
    <section className="relative mt-20 rounded-[32px] bg-[#f8fafc] px-6 py-16 text-zinc-950 sm:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Header with Eyebrow and Button */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-700">
              <Sparkles className="h-3.5 w-3.5 text-orange-600" />
              <span>Core Capabilities</span>
            </div>

            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-900 leading-tight">
              Powerful Tools <br />
              Built for <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Your Restaurant</span>
            </h2>
          </div>

          <div className="max-w-md lg:text-right">
            <p className="text-sm sm:text-base leading-relaxed text-zinc-600">
              Explore our unified suite designed to simplify daily dining workflows, accelerate table turnover, and increase margins.
            </p>
            <div className="mt-4 lg:flex lg:justify-end">
              <Link href="/pricing">
                <Button 
                  size="sm" 
                  className="rounded-full bg-zinc-950 text-white font-semibold hover:bg-zinc-800 transition"
                >
                  View Plans & Pricing
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Soft 3D Pastel Bento Cards */}
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {/* Card 01 - Warm Amber / QR Ordering */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-amber-200/80 bg-gradient-to-b from-amber-50 to-orange-50/60 p-7 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-amber-500/10">
            <div>
              {/* Visual Mockup Stage */}
              <div className="relative mb-6 flex h-48 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-amber-200/50 to-orange-200/40 p-4 border border-amber-300/40">
                <div className="relative flex flex-col items-center justify-center rounded-2xl bg-white p-5 shadow-lg shadow-amber-900/10 transition-transform duration-300 group-hover:scale-105">
                  <QrCode className="h-16 w-16 text-orange-600" />
                  <span className="mt-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-amber-800">
                    Table 3 QR
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600">
                <span>01</span>
                <span className="h-px w-6 bg-orange-400" />
                <span>QR Table Ordering</span>
              </div>

              <h3 className="mt-3 text-xl font-bold text-zinc-900">
                Instant Contactless Menu
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Guests scan the table QR code, browse photo menus with dish filters, and place orders directly to the kitchen.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-orange-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>Zero customer app download required</span>
            </div>
          </div>

          {/* Card 02 - Coral Peach / Direct UPI */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-rose-200/80 bg-gradient-to-b from-rose-50 to-orange-50/60 p-7 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-rose-500/10">
            <div>
              {/* Visual Mockup Stage */}
              <div className="relative mb-6 flex h-48 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-rose-200/50 to-orange-200/40 p-4 border border-rose-300/40">
                <div className="relative flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-lg shadow-rose-900/10 transition-transform duration-300 group-hover:scale-105">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-xl shadow-md">
                    ₹
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Direct UPI</p>
                    <p className="text-sm font-black text-zinc-900">0% Commission</p>
                    <p className="text-[11px] text-emerald-700 font-semibold">Direct Bank Settlement</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600">
                <span>02</span>
                <span className="h-px w-6 bg-rose-400" />
                <span>Direct UPI Payments</span>
              </div>

              <h3 className="mt-3 text-xl font-bold text-zinc-900">
                Direct Money in Your Bank
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Customer payments flow directly to your UPI ID via GPay, PhonePe, or Paytm without aggregator fees or waiting periods.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-rose-700">
              <Zap className="h-4 w-4" />
              <span>Instant order payment verification</span>
            </div>
          </div>

          {/* Card 03 - Soft Slate-Lilac / Kitchen KDS */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-purple-200/80 bg-gradient-to-b from-purple-50 to-slate-50 p-7 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-purple-500/10">
            <div>
              {/* Visual Mockup Stage */}
              <div className="relative mb-6 flex h-48 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-purple-200/50 to-slate-200/40 p-4 border border-purple-300/40">
                <div className="relative w-full max-w-[200px] rounded-xl bg-white p-3.5 shadow-lg shadow-purple-900/10 transition-transform duration-300 group-hover:scale-105">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                      <ChefHat className="h-3.5 w-3.5 text-purple-600" /> Kitchen
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Live Sync
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] font-semibold text-zinc-700">
                    <p>#ORD-104 • Table 2</p>
                    <p className="text-zinc-500 text-[10px]">2x Paneer Tikka • 1x Biryani</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600">
                <span>03</span>
                <span className="h-px w-6 bg-purple-400" />
                <span>Kitchen Live KDS</span>
              </div>

              <h3 className="mt-3 text-xl font-bold text-zinc-900">
                Real-Time Kitchen Sync
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Kitchen and waiter screens update instantly on incoming orders. No manual shouting or lost paper KOT tickets.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-purple-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>Realtime status tracking across tabs</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
