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
      {/* Top Navbar */}
      <MarketingNav />

      {/* Hero Section (Horizon Glow + Asymmetric Headline + Social Proof) */}
      <HomeHero />

      {/* Main Content Body */}
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 pb-16">
        {/* About Us (Split Storytelling Section) */}
        <AboutSection />

        {/* Core Capabilities (3 Soft 3D Bento Cards) */}
        <CoreToolsSection />

        {/* Explore Restaurants Near You */}
        <div className="mt-16 rounded-[32px] border border-white/10 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-md">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-orange-400">Live Network</p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-white">Explore Verified Restaurants</h2>
            <p className="mt-2 text-sm text-zinc-400">Discover cafes and restaurants powered by KhaoScan QR technology.</p>
          </div>
          <HomeRestaurantExplorer restaurants={restaurants} />
        </div>

        {/* Trial Section */}
        <div className="mt-16">
          <TrialSection />
        </div>
      </div>

      {/* Footer */}
      <MarketingFooter />
    </main>
  );
}
