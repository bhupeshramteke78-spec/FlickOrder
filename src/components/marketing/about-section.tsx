"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, BellRing, ChefHat, IndianRupee, QrCode, Smartphone, Table2 } from "lucide-react";

const featureCards = [
  {
    number: "01",
    title: "QR-Powered Ordering",
    text: "Customers scan a table QR code to instantly access the correct menu and place orders without waiting for staff.",
    accent: "Table QR",
  },
  {
    number: "02",
    title: "Real-Time Operations",
    text: "Orders, menu availability, kitchen progress, and payment updates synchronize instantly across the restaurant.",
    accent: "Live Sync",
  },
  {
    number: "03",
    title: "Complete Restaurant Control",
    text: "Manage menus, tables, QR codes, payments, staff, analytics, and customer experience from one dashboard.",
    accent: "Owner Hub",
  },
  {
    number: "04",
    title: "Built for Indian Restaurants",
    text: "Designed specifically for Indian cafes, restaurants, hotels, food courts, and growing businesses with affordable subscription plans and direct UPI payments.",
    accent: "UPI Ready",
  },
];

const dashboardStats = [
  { label: "Orders", value: "Live", icon: ChefHat },
  { label: "Tables", value: "14/32", icon: Table2 },
  { label: "Revenue", value: "Paid only", icon: IndianRupee },
];

export function AboutSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-feature-index"));
            setActiveIndex(index);
          }
        });
      },
      {
        root: null,
        rootMargin: "-42% 0px -42% 0px",
        threshold: 0,
      },
    );

    cardRefs.current.forEach((card) => {
      if (card) {
        observer.observe(card);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" className="mt-12 rounded-[28px] bg-[#0b0b0c] px-5 py-12 text-white md:px-8 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-start">
        <div className="lg:sticky lg:top-8">
          <div className="relative min-h-[560px] overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#111114] p-5 shadow-2xl shadow-black/40">
            <div className="absolute -right-24 -top-20 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
            <MockupStage activeIndex={activeIndex} />
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ff6600]">About FlickOrder</p>
            <div className="relative mt-4">
              <div className="absolute -left-6 top-2 h-20 w-56 rounded-full bg-[#ff6600]/20 blur-3xl" />
              <h2 className="relative text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
                Built for Modern Restaurants. Designed for Better Dining.
              </h2>
            </div>
            <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400">
              FlickOrder helps restaurants transform the entire dine-in experience through QR-powered ordering,
              real-time operations, and smarter restaurant management-all from one powerful platform.
            </p>
          </div>

          <div className="space-y-6 pb-12 lg:pb-[30vh]">
            {featureCards.map((feature, index) => {
              const isActive = activeIndex === index;

              return (
                <div
                  key={feature.number}
                  ref={(node) => {
                    cardRefs.current[index] = node;
                  }}
                  data-feature-index={index}
                  className={`min-h-[270px] rounded-2xl border p-6 transition duration-500 lg:min-h-[360px] ${
                    isActive
                      ? "scale-[1.015] border-orange-400/40 bg-[#18181c] shadow-2xl shadow-orange-500/10"
                      : "border-white/[0.06] bg-[#141417]/70 opacity-55"
                  }`}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <span className={`text-4xl font-semibold ${isActive ? "text-[#ff6600]" : "text-orange-500/45"}`}>
                      {feature.number}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        isActive
                          ? "border-orange-400/30 bg-orange-500/10 text-orange-200"
                          : "border-white/[0.07] bg-white/[0.03] text-zinc-500"
                      }`}
                    >
                      {feature.accent}
                    </span>
                  </div>
                  <h3 className={`text-2xl font-semibold ${isActive ? "text-white" : "text-zinc-300"}`}>
                    {feature.title}
                  </h3>
                  <p className={`mt-4 max-w-xl text-base leading-8 ${isActive ? "text-zinc-300" : "text-zinc-500"}`}>
                    {feature.text}
                  </p>
                  <div
                    className={`mt-8 h-1 rounded-full transition-all duration-500 ${
                      isActive ? "w-32 bg-[#ff6600]" : "w-12 bg-white/10"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function MockupStage({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="relative z-10 flex min-h-[520px] items-center justify-center">
      {featureCards.map((feature, index) => (
        <div
          key={feature.number}
          className={`absolute inset-0 flex items-center justify-center transition duration-700 ${
            activeIndex === index ? "translate-y-0 scale-100 opacity-100" : "translate-y-8 scale-95 opacity-0"
          }`}
        >
          {index === 0 ? <QrOrderingMockup /> : null}
          {index === 1 ? <RealtimeMockup /> : null}
          {index === 2 ? <ControlMockup /> : null}
          {index === 3 ? <IndianRestaurantMockup /> : null}
        </div>
      ))}
    </div>
  );
}

function QrOrderingMockup() {
  return (
    <div className="grid w-full max-w-md gap-4">
      <div className="mx-auto w-64 rounded-[32px] border border-white/10 bg-zinc-950 p-3 shadow-2xl shadow-orange-500/10">
        <div className="rounded-[24px] bg-white p-4 text-zinc-950">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500">Olive Garden</p>
              <p className="font-semibold">Table 12</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">Open</span>
          </div>
          <div className="grid gap-3">
            {["Margherita Pizza", "Pasta Alfredo", "Garlic Bread"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-xl bg-zinc-50 p-3">
                <div>
                  <p className="text-sm font-semibold">{item}</p>
                  <p className="text-xs text-zinc-500">20-25 min</p>
                </div>
                <button className="rounded-lg border border-zinc-200 px-2 py-1 text-xs">Add</button>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full rounded-xl bg-emerald-800 py-3 text-sm font-semibold text-white">View Cart</button>
        </div>
      </div>
      <div className="mx-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
        <QrCode className="h-6 w-6 text-orange-300" />
        <div>
          <p className="font-semibold">Customer scans table QR</p>
          <p className="text-sm text-zinc-400">Correct menu opens instantly.</p>
        </div>
      </div>
    </div>
  );
}

function RealtimeMockup() {
  return (
    <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#08090b] p-4 shadow-2xl shadow-orange-500/10">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold">Kitchen Display</p>
        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">Live</span>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {[
          ["Accepted", "1", "text-orange-300"],
          ["Preparing", "12", "text-amber-300"],
          ["Ready", "6", "text-emerald-300"],
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <p className={`text-sm font-semibold ${color}`}>{label}</p>
            <p className="mt-5 text-3xl font-semibold">{value}</p>
            <p className="mt-1 text-xs text-zinc-500">Realtime orders</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4">
        <p className="text-sm font-semibold text-orange-200">#ORD-000123</p>
        <p className="mt-2 text-xs text-zinc-400">Table 2 • 4 items • kitchen note synced</p>
      </div>
    </div>
  );
}

function ControlMockup() {
  return (
    <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white p-4 text-zinc-950 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold">Live Dashboard</p>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">Owner Hub</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {dashboardStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-zinc-50 p-4">
            <stat.icon className="mb-3 h-5 w-5 text-emerald-700" />
            <p className="text-xs text-zinc-500">{stat.label}</p>
            <p className="mt-1 font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 p-4">
          <BarChart3 className="mb-4 h-5 w-5 text-blue-500" />
          <p className="text-sm font-semibold">Revenue trend</p>
          <div className="mt-4 flex h-16 items-end gap-2">
            {[30, 52, 44, 72, 61, 88].map((height) => (
              <span key={height} className="w-full rounded-t bg-blue-400" style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 p-4">
          <BellRing className="mb-4 h-5 w-5 text-orange-500" />
          <p className="text-sm font-semibold">Service requests</p>
          <p className="mt-4 text-3xl font-semibold">8</p>
          <p className="text-xs text-zinc-500">Water, bill, waiter</p>
        </div>
      </div>
    </div>
  );
}

function IndianRestaurantMockup() {
  return (
    <div className="grid w-full max-w-lg gap-4">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-orange-500/20 to-emerald-500/10 p-5">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-zinc-950">
            <Smartphone className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xl font-semibold">Direct UPI Payments</p>
            <p className="mt-1 text-sm text-zinc-300">restaurant@oksbi • no complex gateway setup</p>
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {["Cafe", "Family Restaurant", "Hotel", "Food Court"].map((type) => (
          <div key={type} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="font-semibold">{type}</p>
            <p className="mt-2 text-sm text-zinc-400">Affordable plans for Indian dine-in teams.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
