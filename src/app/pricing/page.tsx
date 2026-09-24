"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock3,
  CreditCard,
  History,
  QrCode,
  ShieldCheck,
  Sparkles,
  Store,
  Table2,
  Utensils,
} from "lucide-react";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const pricingPlans = [
  {
    name: "Basic",
    monthlyPrice: "₹299",
    yearlyPrice: "₹2,990",
    yearlyMonthlyEquivalent: "₹249",
    yearlySavings: "₹598",
    description: "For small restaurants starting with table QR ordering.",
    highlight: false,
    accent: "from-white/[0.07] to-white/[0.035]",
    features: ["QR table menu access", "Menu and table management", "Live orders and payment verification", "Owner dashboard"],
  },
  {
    name: "Growth",
    monthlyPrice: "₹799",
    yearlyPrice: "₹7,990",
    yearlyMonthlyEquivalent: "₹665",
    yearlySavings: "₹1,598",
    description: "For busy restaurants that want separate kitchen and waiter workflows.",
    highlight: true,
    accent: "from-emerald-500/20 via-white/[0.08] to-orange-500/14",
    features: ["Everything in Basic", "Optional Kitchen and Waiter staff tabs", "Order history records", "Paid-order revenue and item analytics"],
  },
  {
    name: "Pro",
    monthlyPrice: "₹1,499",
    yearlyPrice: "₹14,990",
    yearlyMonthlyEquivalent: "₹1,249",
    yearlySavings: "₹2,998",
    description: "For restaurants that want staff workflows plus deeper reporting and history controls.",
    highlight: false,
    accent: "from-orange-500/14 via-white/[0.065] to-emerald-500/12",
    features: ["Everything in Growth", "Optional Kitchen and Waiter staff tabs", "Searchable order history", "Detailed busy-hour reporting"],
  },
];

const includedFeatures = [
  { icon: QrCode, title: "QR ordering", text: "Guests open the correct table menu from the QR code." },
  { icon: Utensils, title: "Menu control", text: "Add items, edit pricing, and update availability from the dashboard." },
  { icon: CreditCard, title: "Payment verification", text: "Track UPI, cash, and card-machine payments after staff confirmation." },
  { icon: Table2, title: "Table operations", text: "Generate QR links, monitor status, and reset tables after paid orders." },
  { icon: Store, title: "Staff workflow", text: "Growth and Pro can enable separate Kitchen and Waiter tabs from settings." },
];

const comparisonRows = [
  ["3-day free trial", "Included", "Included", "Included"],
  ["QR table ordering", "Included", "Included", "Included"],
  ["Menu and table management", "Included", "Included", "Included"],
  ["Order kanban", "Included", "Included", "Included"],
  ["Separate Kitchen and Waiter tabs", "Not included", "Optional from Settings", "Optional from Settings"],
  ["Paid-order analytics", "Dashboard totals", "Revenue and item analytics", "Range-filtered analytics"],
  ["Order history", "Recent active orders", "History records", "Searchable history records"],
  ["Busy-hour reporting", "Not included", "Basic hourly view", "Working-hour performance"],
];

const faqs = [
  {
    question: "Can I test KhaoScan before paying?",
    answer: "Yes. Every restaurant starts with a 3-day trial so you can set up menus, tables, QR codes, and live orders first.",
  },
  {
    question: "Do restaurant customers need to log in?",
    answer: "No. QR table ordering is designed for dine-in guests, so customers can order without creating an account.",
  },
  {
    question: "How are restaurant payments handled?",
    answer: "Customer payments go directly to the restaurant through UPI, cash, or card-machine workflows. Staff confirm payment status in KhaoScan.",
  },
  {
    question: "How do subscription upgrades work?",
    answer: "Restaurant subscriptions use a prefilled UPI payment link. KhaoScan activates the selected plan only after the super admin verifies the submitted transaction ID.",
  },
  {
    question: "Can I choose yearly billing to get a discount?",
    answer: "Yes. All plans offer an annual subscription option with approximately 20% discount (2 months free) paid directly via UPI.",
  },
];

export default function PricingPage() {
  const [interval, setInterval] = useState<"MONTHLY" | "YEARLY">("MONTHLY");

  return (
    <main className="min-h-screen bg-[#071117] text-white selection:bg-orange-500/30">
      {/* Top Header & Hero Container with Seamless Horizon Sunset Glow */}
      <div className="relative overflow-hidden">
        {/* Radiant Sunset Horizon Glow behind Navbar and Hero */}
        <div 
          className="pointer-events-none absolute inset-x-0 -top-32 h-[750px] opacity-90"
          style={{
            background: "radial-gradient(ellipse 90% 65% at 50% -5%, rgba(249, 115, 22, 0.45), rgba(239, 68, 68, 0.25) 50%, rgba(7, 17, 23, 0) 90%)",
          }}
          aria-hidden="true"
        />
        <div 
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[900px] h-[380px] rounded-full blur-[110px] opacity-40 bg-gradient-to-b from-amber-400 via-orange-500 to-rose-600"
          aria-hidden="true"
        />

        <MarketingNav />

        <section className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-300 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Transparent Restaurant Pricing</span>
              </div>
              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-white">
                Choose the plan that matches{" "}
                <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
                  your dine-in flow.
                </span>
              </h1>
              <p className="mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-zinc-300">
                Start with a 3-day trial, run real table orders, and upgrade when your restaurant needs more analytics,
                history, and operational visibility.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/auth/owner?mode=register">
                  <Button 
                    size="lg" 
                    className="h-12 px-7 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:opacity-95 hover:scale-105 active:scale-95 transition"
                  >
                    Start Free Trial
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
                <Link href="#compare">
                  <Button 
                    variant="glass" 
                    size="lg" 
                    className="h-12 px-6 rounded-full border-white/20 bg-white/[0.06] text-white font-semibold text-sm hover:bg-white/10 hover:border-white/30 backdrop-blur-md transition"
                  >
                    Compare Plans
                  </Button>
                </Link>
              </div>
            </div>

            <Card className="rounded-[28px] border border-white/10 bg-[#0a1822]/90 p-6 text-white shadow-2xl shadow-black/50 backdrop-blur-xl">
              <div className="grid gap-5">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300 shadow-md">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">No Hidden Fees • 0% Commission</h2>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                      All direct UPI payments go straight to your restaurant&apos;s bank account.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  {["3-Day Trial", "Live QR Menu", "Revenue Stats"].map((item) => (
                    <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-orange-300">{item}</p>
                      <p className="mt-1.5 text-xs font-bold text-white">Included</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>

      <section className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 pb-20">
        {/* Subtle Ambient Sunset Orb */}
        <div 
          className="pointer-events-none absolute left-1/2 -top-20 -translate-x-1/2 h-80 w-[600px] rounded-full bg-gradient-to-b from-orange-500/15 to-transparent blur-3xl"
          aria-hidden="true"
        />

        {/* Interactive Billing Cycle Toggle */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-400">Select Billing Cycle</p>
          <div className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.06] p-1.5 backdrop-blur-xl shadow-lg">
            <button
              type="button"
              onClick={() => setInterval("MONTHLY")}
              className={`rounded-full px-6 py-2.5 text-xs sm:text-sm font-bold transition ${
                interval === "MONTHLY"
                  ? "bg-white text-zinc-950 shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setInterval("YEARLY")}
              className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-xs sm:text-sm font-bold transition ${
                interval === "YEARLY"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/25"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>Annual Billing</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-orange-600">
                2 Months Free 🎉
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {pricingPlans.map((plan) => {
            const isYearly = interval === "YEARLY";
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

            return (
              <Card
                key={plan.name}
                className={`relative flex min-h-[540px] flex-col overflow-hidden rounded-[28px] border p-8 text-white shadow-2xl backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 ${
                  plan.highlight
                    ? "border-orange-500/50 bg-gradient-to-b from-[#12222d] via-[#0c1822] to-[#140e12] shadow-orange-950/40 hover:border-orange-400 hover:shadow-orange-500/20"
                    : "border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] shadow-black/40 hover:border-white/25 hover:shadow-2xl"
                }`}
              >
                {plan.highlight ? (
                  <span className="absolute right-6 top-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-black uppercase tracking-wider text-zinc-950 shadow-md">
                    Most Popular
                  </span>
                ) : null}
                <p className={`text-xs font-bold uppercase tracking-wider ${plan.highlight ? "text-amber-400" : "text-zinc-400"}`}>
                  {plan.name}
                </p>
                <div className="mt-5 flex items-end gap-2">
                  <span className="text-5xl font-black tracking-tight text-white">{price}</span>
                  <span className="pb-2 text-sm text-zinc-400">/{isYearly ? "year" : "month"}</span>
                </div>
                {isYearly ? (
                  <p className="mt-1 text-xs font-bold text-emerald-400">
                    ~{plan.yearlyMonthlyEquivalent}/month · Save {plan.yearlySavings}/year
                  </p>
                ) : null}
                <p className="mt-4 min-h-12 text-sm leading-relaxed text-zinc-300">{plan.description}</p>

                <div className="mt-6 grid gap-3 border-t border-white/10 pt-6">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 text-sm text-zinc-200">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/dashboard/billing?plan=${plan.name.toLowerCase()}&interval=${interval.toLowerCase()}`}
                  className="mt-auto pt-8"
                >
                  <Button
                    size="lg"
                    className={`w-full rounded-full font-bold text-sm h-12 transition ${
                      plan.highlight
                        ? "bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:opacity-95"
                        : "border border-white/15 bg-white/[0.06] text-white hover:bg-white/10"
                    }`}
                  >
                    Choose {plan.name} {isYearly ? "(Annual)" : ""}
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>

        {/* Included Features 4-Column Grid */}
        <section className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {includedFeatures.map((feature) => (
            <Card key={feature.title} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 text-white backdrop-blur-md shadow-xl hover:border-orange-500/30 transition">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-orange-500/15 border border-orange-500/30 text-amber-400 shadow-md">
                <feature.icon className="h-6 w-6" />
              </div>
              <h2 className="font-bold text-white text-base">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{feature.text}</p>
            </Card>
          ))}
        </section>

        {/* Plan Comparison Table */}
        <section id="compare" className="mt-16 overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl">
          <div className="grid gap-4 border-b border-white/10 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-400">Feature Comparison</p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">A clear view before you pay.</h2>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3.5 py-1.5 text-xs font-bold text-emerald-300">
              <Clock3 className="h-4 w-4" />
              3-day free trial on every plan
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-400 bg-white/[0.02]">
                <tr>
                  <th className="px-6 py-4 font-bold">Feature</th>
                  <th className="px-6 py-4 font-bold text-white">Basic</th>
                  <th className="px-6 py-4 font-bold text-amber-400">Growth</th>
                  <th className="px-6 py-4 font-bold text-white">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-zinc-300">
                {comparisonRows.map(([feature, basic, growth, pro]) => (
                  <tr key={feature} className="transition hover:bg-white/[0.04]">
                    <td className="px-6 py-4 font-semibold text-white">{feature}</td>
                    <td className="px-6 py-4">{basic}</td>
                    <td className="px-6 py-4 font-medium text-amber-200">{growth}</td>
                    <td className="px-6 py-4">{pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Not Sure & FAQs Grid */}
        <section className="mt-16 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="relative overflow-hidden rounded-[28px] border border-orange-500/30 bg-gradient-to-br from-[#12222d] via-[#0c1822] to-[#140e12] p-8 text-white shadow-2xl backdrop-blur-xl">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 border border-orange-500/30 text-amber-400 shadow-md">
              <History className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white">Not sure which plan fits?</h2>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-zinc-300">
              Start with the 3-day trial, process real orders, and choose a plan from the Subscription page when your data
              shows what your restaurant actually needs.
            </p>
            <Link href="/auth/owner?mode=register">
              <Button 
                size="lg" 
                className="mt-8 w-full sm:w-auto rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm px-7 py-3 shadow-lg shadow-orange-500/25 hover:opacity-95"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </Card>

          <div className="grid gap-4">
            {faqs.map((faq) => (
              <Card key={faq.question} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 text-white backdrop-blur-md hover:border-white/20 transition">
                <h3 className="font-bold text-white text-base">{faq.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="mt-16 rounded-[32px] border border-orange-500/30 bg-gradient-to-r from-[#0c1822] via-[#101e28] to-[#140c10] p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 border border-orange-500/30 text-amber-400 shadow-md">
                <Store className="h-6 w-6" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Ready to modernize your dine-in service?</h2>
              <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-zinc-300">
                Register your restaurant, set up tables and menu items, and let guests order directly from the table QR.
              </p>
            </div>
            <Link href="/auth/owner?mode=register">
              <Button 
                size="lg" 
                className="w-full lg:w-auto rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-orange-500/30 hover:opacity-95 hover:scale-105 transition"
              >
                Start Free 3-Day Trial
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </section>
      </section>

      <MarketingFooter />
    </main>
  );
}
