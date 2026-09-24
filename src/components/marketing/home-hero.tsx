"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play, Sparkles, Star, Utensils, QrCode, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden pt-6 pb-16 lg:pt-10 lg:pb-24">
      {/* Horizon Sunset Glow Gradient */}
      <div 
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] opacity-90"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(249, 115, 22, 0.45), rgba(239, 68, 68, 0.25) 45%, rgba(15, 23, 42, 0) 85%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1.5 text-xs font-semibold text-orange-300 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>All-In-One Restaurant SaaS Platform</span>
          <span className="text-orange-400">⚡</span>
        </div>

        {/* 2-Column Asymmetric Grid */}
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          {/* Left Column: Bold Rhythmic Typography */}
          <div>
            <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.05]">
              Scan. Savor. <br />
              <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
                Scale Your Restaurant.
              </span> <br />
              All in One Platform.
            </h1>
          </div>

          {/* Right Column: Description & Action Buttons */}
          <div className="lg:pl-6">
            <p className="text-base sm:text-lg leading-relaxed text-zinc-300 max-w-xl">
              KhaoScan helps restaurants digitize menus, automate table orders, and accept direct payments seamlessly — faster, smarter, and easier.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link href="/auth/owner?mode=register">
                <Button 
                  size="lg" 
                  className="h-12 px-6 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:opacity-95 hover:scale-[1.02] transition-transform active:scale-[0.98]"
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>

              <Link href="/restaurants/search">
                <Button 
                  variant="glass" 
                  size="lg" 
                  className="h-12 px-6 rounded-full border-white/20 bg-white/[0.06] text-white font-semibold text-sm hover:bg-white/10 hover:border-white/30 backdrop-blur-md transition"
                >
                  <Play className="h-4 w-4 fill-white text-white mr-1.5" />
                  Explore Demo Menu
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Horizon Glow Separation Line */}
        <div className="mt-14 h-px w-full bg-gradient-to-r from-transparent via-orange-400/40 to-transparent" />

        {/* Social Proof & 3D Feature Pills Bar */}
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Avatar & Rating Strip */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2.5 overflow-hidden">
              <Image
                width={40}
                height={40}
                className="inline-block h-10 w-10 rounded-full ring-2 ring-[#071117] object-cover"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                alt="Restaurant Owner"
              />
              <Image
                width={40}
                height={40}
                className="inline-block h-10 w-10 rounded-full ring-2 ring-[#071117] object-cover"
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                alt="Chef"
              />
              <Image
                width={40}
                height={40}
                className="inline-block h-10 w-10 rounded-full ring-2 ring-[#071117] object-cover"
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80"
                alt="Cafe Owner"
              />
            </div>

            <div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-0.5 text-xs font-semibold text-zinc-300">
                1,500+ happy restaurants & cafes
              </p>
            </div>

            <Link 
              href="/pricing" 
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-orange-300 hover:text-white underline underline-offset-4 ml-2 transition"
            >
              Explore Platform →
            </Link>
          </div>

          {/* 3 Soft 3D Capsule Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-200 backdrop-blur-md">
              <QrCode className="h-4 w-4 text-amber-400" />
              <span>QR Ordering</span>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-200 backdrop-blur-md">
              <Utensils className="h-4 w-4 text-rose-400" />
              <span>Direct UPI</span>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-orange-500/25 bg-orange-500/10 px-3.5 py-2 text-xs font-semibold text-orange-200 backdrop-blur-md">
              <ChefHat className="h-4 w-4 text-orange-400" />
              <span>Live KDS</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
