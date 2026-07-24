import Link from "next/link";
import { ArrowRight, CheckCircle2, ChefHat, CreditCard, QrCode, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeRestaurantExplorer } from "@/components/marketing/home-restaurant-explorer";
import { LazyHomeSections } from "@/components/marketing/lazy-home-sections";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import type { RestaurantAvailability } from "@/lib/table-availability";

export type HomeRestaurant = {
  name: string;
  slug: string;
  type: string;
  cuisine: string[];
  city: string;
  state: string;
  address: string;
  is_open: boolean;
  availability: RestaurantAvailability;
};

const proofCards = [
  { status: "Pending", table: "Table 2", note: "2 items", className: "live-order-card live-order-card-one", Icon: ChefHat },
  { status: "Accepted", table: "Table 2", note: "Kitchen notified", className: "live-order-card live-order-card-two", Icon: QrCode },
  { status: "Paid", table: "Table 2", note: "₹498 verified", className: "live-order-card live-order-card-three", Icon: CreditCard },
];

export function HomePage({ restaurants }: { restaurants: HomeRestaurant[] }) {
  return (
    <main className="customer-surface min-h-screen text-white">
      <MarketingNav />

      <section className="mx-auto max-w-7xl px-5 pb-10 pt-8">
        <div className="hero-blend relative overflow-hidden rounded-[28px] px-0 py-0 md:min-h-[430px]">
          <div className="hero-restaurant-art" aria-hidden="true" />
          <div className="relative z-10 max-w-2xl py-8 md:py-12">
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Great Food.
              <br />
              Better Experience.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-200">
              Discover restaurants near you. Scan, order, request service, and pay directly at your table.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/auth/owner">
                <Button variant="glass" size="lg" className="border-orange-200/45 bg-orange-500/45 text-white">
                  Start 3-Day Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/restaurants/search">
                <Button variant="glass" size="lg" className="border-white/15 bg-white/10 text-white">
                  Find Restaurants
                  <Search className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <DemoMenuPreview />
          <HomeRestaurantExplorer restaurants={restaurants} />
        </div>

        <LiveOperationsProof />
        <LazyHomeSections />
      </section>
      <MarketingFooter />
    </main>
  );
}

function DemoMenuPreview() {
  return (
    <div className="absolute right-6 top-8 z-10 hidden w-[22rem] rounded-2xl border border-white/10 bg-white/[0.08] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl lg:block">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">Try demo menu</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Table QR preview</h2>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-emerald-800">
          <QrCode className="h-6 w-6" />
        </div>
      </div>
      <div className="rounded-2xl bg-white p-3 text-zinc-950">
        {[
          ["Margherita Pizza", "20 min", "₹249"],
          ["Pasta Alfredo", "25 min", "₹349"],
          ["Garlic Bread", "15 min", "₹149"],
        ].map(([name, time, price]) => (
          <div key={name} className="flex items-center justify-between border-b border-zinc-100 py-3 last:border-0">
            <div>
              <p className="text-sm font-semibold">{name}</p>
              <p className="text-xs text-zinc-500">{time}</p>
            </div>
            <p className="text-sm font-bold text-emerald-700">{price}</p>
          </div>
        ))}
      </div>
      <Link href="/restaurants/search" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600">
        Open live restaurant menus
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function LiveOperationsProof() {
  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur">
      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">Realtime proof</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Orders move without refresh.</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            Supabase Realtime channels keep owner dashboards, kitchen screens, payment states, and QR menus in sync.
          </p>
          <div className="mt-4 grid gap-2 text-sm text-zinc-300">
            {["New order reaches dashboard instantly", "Kitchen status updates appear live", "Payment verification changes analytics"].map((item) => (
              <p key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                {item}
              </p>
            ))}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {proofCards.map(({ status, table, note, className, Icon }) => (
            <div key={status} className={className}>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{status}</p>
                <Icon className="h-4 w-4 text-orange-200" />
              </div>
              <p className="text-lg font-bold text-white">{table}</p>
              <p className="mt-1 text-xs text-zinc-400">{note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
