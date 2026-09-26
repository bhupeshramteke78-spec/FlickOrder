import Link from "next/link";
import { Home, Search, Sparkles } from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#071117] text-white selection:bg-orange-500/30 flex flex-col justify-between">
      {/* Top Header & Glow Container */}
      <div className="relative overflow-hidden">
        {/* Radiant Sunset Horizon Glow */}
        <div 
          className="pointer-events-none absolute inset-x-0 -top-32 h-[650px] opacity-90"
          style={{
            background: "radial-gradient(ellipse 90% 65% at 50% -5%, rgba(249, 115, 22, 0.45), rgba(239, 68, 68, 0.25) 50%, rgba(7, 17, 23, 0) 90%)",
          }}
          aria-hidden="true"
        />
        <div 
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[350px] rounded-full blur-[100px] opacity-35 bg-gradient-to-b from-amber-400 via-orange-500 to-rose-600"
          aria-hidden="true"
        />

        <MarketingNav />

        <section className="relative z-10 mx-auto max-w-4xl px-5 py-20 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>404 • Page Not Found</span>
          </div>

          <h1 className="mt-6 text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight text-white">
            404
          </h1>

          <p className="mt-2 text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
            Looks like this table is reserved or does not exist.
          </p>

          <p className="mt-4 mx-auto max-w-lg text-sm sm:text-base leading-relaxed text-zinc-300">
            The page or resource you are looking for might have been moved, renamed, or is temporarily unavailable.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/">
              <Button 
                size="lg" 
                className="h-12 px-7 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:opacity-95 hover:scale-105 active:scale-95 transition"
              >
                <Home className="h-4 w-4 mr-2" />
                Return to Home
              </Button>
            </Link>

            <Link href="/restaurants/search">
              <Button 
                variant="glass" 
                size="lg" 
                className="h-12 px-6 rounded-full border-white/20 bg-white/[0.06] text-white font-semibold text-sm hover:bg-white/10 hover:border-white/30 backdrop-blur-md transition"
              >
                <Search className="h-4 w-4 mr-2 text-orange-400" />
                Explore Restaurants
              </Button>
            </Link>
          </div>
        </section>
      </div>

      <MarketingFooter />
    </main>
  );
}
