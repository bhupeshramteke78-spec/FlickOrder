import { MarketingNav } from "@/components/marketing/marketing-nav";
import { HomeHero } from "@/components/marketing/home-hero";
import { AboutSection } from "@/components/marketing/about-section";
import { CoreToolsSection } from "@/components/marketing/core-tools-section";
import { HomeRestaurantExplorer } from "@/components/marketing/home-restaurant-explorer";
import { TrialSection } from "@/components/marketing/trial-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import type { RestaurantAvailability } from "@/lib/table-availability";

export type HomeRestaurant = {
  name: string;
  slug: string;
  type: string;
  cuisine: string[];
  city: string;
  state: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  is_open: boolean;
  availability: RestaurantAvailability;
};

export function HomePage({ restaurants }: { restaurants: HomeRestaurant[] }) {
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

        {/* Top Navbar */}
        <MarketingNav />

        {/* Hero Section (Horizon Glow + Asymmetric Headline + Social Proof) */}
        <HomeHero />
      </div>

      {/* Main Content Body */}
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 pb-16">
        {/* Subtle Ambient Sunset Orb for mid-page */}
        <div 
          className="pointer-events-none absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent blur-3xl"
          aria-hidden="true"
        />
        <div 
          className="pointer-events-none absolute left-0 bottom-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-rose-500/10 via-orange-500/5 to-transparent blur-3xl"
          aria-hidden="true"
        />

        {/* About Us (Split Storytelling Section) */}
        <AboutSection />

        {/* Core Capabilities (3 Soft 3D Bento Cards) */}
        <CoreToolsSection />

        {/* Explore Restaurants Near You */}
        <div className="relative mt-20 overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.02] p-6 sm:p-10 backdrop-blur-xl shadow-2xl shadow-black/50">
          {/* Ambient Glow */}
          <div 
            className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-orange-500/15 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-orange-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Restaurant Network</span>
            </div>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-white tracking-tight">
              Explore <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">Verified Restaurants</span>
            </h2>
            <p className="mt-2 text-sm text-zinc-300">Discover cafes and dining spots powered by KhaoScan QR technology across India.</p>
          </div>
          <HomeRestaurantExplorer restaurants={restaurants} />
        </div>

        {/* Trial Section */}
        <div className="mt-20">
          <TrialSection />
        </div>
      </div>

      {/* Footer */}
      <MarketingFooter />
    </main>
  );
}
