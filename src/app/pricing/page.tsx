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

const plans = [
  {
    name: "Basic",
    price: "₹299",
    description: "For small restaurants starting with table QR ordering.",
    highlight: false,
    accent: "from-white/[0.07] to-white/[0.035]",
    features: ["QR table menu access", "Menu and table management", "Live orders and payment verification", "Owner dashboard"],
  },
  {
    name: "Growth",
    price: "₹799",
    description: "For busy restaurants that need faster live operations.",
    highlight: true,
    accent: "from-emerald-500/20 via-white/[0.08] to-orange-500/14",
    features: ["Everything in Basic", "Realtime order kanban", "Order history records", "Paid-order revenue and item analytics"],
  },
  {
    name: "Pro",
    price: "₹1,499",
    description: "For restaurants that want deeper reporting and history controls.",
    highlight: false,
    accent: "from-orange-500/14 via-white/[0.065] to-emerald-500/12",
    features: ["Everything in Growth", "7, 30, and 90 day analytics views", "Searchable order history", "Detailed busy-hour reporting"],
  },
];

const includedFeatures = [
  { icon: QrCode, title: "QR ordering", text: "Guests open the correct table menu from the QR code." },
  { icon: Utensils, title: "Menu control", text: "Add items, edit pricing, and update availability from the dashboard." },
  { icon: CreditCard, title: "Payment verification", text: "Track UPI, cash, and card-machine payments after staff confirmation." },
  { icon: Table2, title: "Table operations", text: "Generate QR links, monitor status, and reset tables after paid orders." },
];

const comparisonRows = [
  ["3-day free trial", "Included", "Included", "Included"],
  ["QR table ordering", "Included", "Included", "Included"],
  ["Menu and table management", "Included", "Included", "Included"],
  ["Order kanban", "Included", "Included", "Included"],
  ["Paid-order analytics", "Dashboard totals", "Revenue and item analytics", "Range-filtered analytics"],
  ["Order history", "Recent active orders", "History records", "Searchable history records"],
  ["Busy-hour reporting", "Not included", "Basic hourly view", "Working-hour performance"],
];

const faqs = [
  {
    question: "Can I test FlickOrder before paying?",
    answer: "Yes. Every restaurant starts with a 3-day trial so you can set up menus, tables, QR codes, and live orders first.",
  },
  {
    question: "Do restaurant customers need to log in?",
    answer: "No. QR table ordering is designed for dine-in guests, so customers can order without creating an account.",
  },
  {
    question: "How are restaurant payments handled?",
    answer: "Customer payments go directly to the restaurant through UPI, cash, or card-machine workflows. Staff confirm payment status in FlickOrder.",
  },
  {
    question: "How do subscription upgrades work?",
    answer: "Restaurant subscriptions use Razorpay checkout. FlickOrder activates the plan only after server-side payment verification.",
  },
];

export default function PricingPage() {
  return (
    <main className="customer-surface min-h-screen text-white">
      <MarketingNav />

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1 text-sm font-semibold text-orange-200">
              <Sparkles className="h-4 w-4" />
              Transparent restaurant pricing
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[1.03] tracking-tight sm:text-6xl">
              Choose the plan that matches your dine-in flow.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300">
              Start with a 3-day trial, run real table orders, and upgrade when your restaurant needs more analytics,
              history, and operational visibility.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/auth/owner">
                <Button variant="glass" className="border-orange-200/40 bg-orange-500/40">
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#compare">
                <Button variant="glass" className="border-white/15 bg-white/10">
                  Compare plans
                </Button>
              </Link>
            </div>
          </div>

          <Card className="border-white/10 bg-white/[0.055] p-5 text-white shadow-2xl shadow-black/20 backdrop-blur">
            <div className="grid gap-4">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-400/10 text-emerald-200">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">No fake promises</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Plan details below describe features currently implemented in FlickOrder.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {["Trial", "Live QR", "Paid analytics"].map((item) => (
                  <div key={item} className="rounded-xl border border-white/10 bg-white/[0.055] px-3 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">{item}</p>
                    <p className="mt-2 text-sm font-semibold text-white">Included</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <section className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {includedFeatures.map((feature) => (
            <Card key={feature.title} className="border-white/10 bg-white/[0.045] p-5 text-white">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-orange-200">
                <feature.icon className="h-5 w-5" />
              </div>
              <h2 className="font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{feature.text}</p>
            </Card>
          ))}
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex min-h-[520px] flex-col overflow-hidden border-white/10 bg-gradient-to-br ${plan.accent} p-6 text-white shadow-2xl shadow-black/15 transition duration-300 hover:-translate-y-1 hover:border-emerald-300/30`}
            >
              {plan.highlight ? (
                <span className="absolute right-5 top-5 rounded-full bg-orange-400 px-3 py-1 text-xs font-black uppercase tracking-wide text-zinc-950">
                  Most chosen
                </span>
              ) : null}
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">{plan.name}</p>
              <div className="mt-5 flex items-end gap-2">
                <span className="text-5xl font-black tracking-tight">{plan.price}</span>
                <span className="pb-2 text-sm text-zinc-400">/month</span>
              </div>
              <p className="mt-4 min-h-14 text-sm leading-6 text-zinc-300">{plan.description}</p>

              <div className="mt-6 grid gap-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm text-zinc-200">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Link href={`/dashboard/billing?plan=${plan.name.toLowerCase()}`} className="mt-auto pt-8">
                <Button
                  variant="glass"
                  className={`w-full ${plan.highlight ? "border-orange-200/50 bg-orange-500/45" : "border-emerald-300/30 bg-emerald-700/35"}`}
                >
                  Choose {plan.name}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </Card>
          ))}
        </section>

        <section id="compare" className="mt-12 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05]">
          <div className="grid gap-4 border-b border-white/10 p-5 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">Compare plans</p>
              <h2 className="mt-2 text-2xl font-semibold">A clear view before the restaurant pays.</h2>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
              <Clock3 className="h-4 w-4" />
              3-day trial on every plan
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-white/10 text-zinc-400">
                <tr>
                  <th className="px-5 py-4 font-semibold">Feature</th>
                  <th className="px-5 py-4 font-semibold">Basic</th>
                  <th className="px-5 py-4 font-semibold">Growth</th>
                  <th className="px-5 py-4 font-semibold">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-zinc-200">
                {comparisonRows.map(([feature, basic, growth, pro]) => (
                  <tr key={feature} className="transition hover:bg-white/[0.035]">
                    <td className="px-5 py-4 font-medium text-white">{feature}</td>
                    <td className="px-5 py-4">{basic}</td>
                    <td className="px-5 py-4">{growth}</td>
                    <td className="px-5 py-4">{pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-white/10 bg-gradient-to-br from-emerald-500/12 to-orange-500/10 p-6 text-white">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-emerald-200">
              <History className="h-5 w-5" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Not sure which plan fits?</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Start with the trial, process real orders, then choose a plan from the Subscription page when your data
              shows what the restaurant actually needs.
            </p>
            <Link href="/auth/owner">
              <Button variant="glass" className="mt-6 w-full border-orange-200/40 bg-orange-500/40 sm:w-auto">
                Create restaurant account
              </Button>
            </Link>
          </Card>

          <div className="grid gap-3">
            {faqs.map((faq) => (
              <Card key={faq.question} className="border-white/10 bg-white/[0.045] p-5 text-white">
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-white/10 bg-[#070a0c] p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-orange-200">
                <Store className="h-5 w-5" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Ready to modernize dine-in service?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
                Register the restaurant, set up tables and menu items, and let guests order directly from the table QR.
              </p>
            </div>
            <Link href="/auth/owner">
              <Button variant="glass" className="w-full border-emerald-200/40 bg-emerald-700/40 lg:w-auto">
                Start the trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </section>

      <MarketingFooter />
    </main>
  );
}
