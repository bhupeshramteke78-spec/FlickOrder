import Link from "next/link";
import { Scale } from "lucide-react";
import { KhaoScanLogo } from "@/components/brand/khaoscan-logo";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Restaurants", href: "/restaurants/search" },
      { label: "Pricing", href: "/pricing" },
      { label: "About", href: "/#about" },
      { label: "Owner login", href: "/auth/owner?mode=login" },
    ],
  },
  {
    title: "Restaurant Tools",
    links: [
      { label: "QR ordering", href: "/#about" },
      { label: "Menu management", href: "/auth/owner?mode=register" },
      { label: "Table management", href: "/auth/owner?mode=register" },
      { label: "Realtime orders", href: "/auth/owner?mode=register" },
    ],
  },
  {
    title: "Information",
    links: [
      { label: "Support", href: "mailto:support@khaoscan.com" },
      { label: "Contact", href: "mailto:hello@khaoscan.com" },
      { label: "Book a demo", href: "/auth/owner?mode=register" },
      { label: "Restaurant trial", href: "/auth/owner?mode=register" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms and Conditions", href: "/legal/terms" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Refund Policy", href: "/legal/refund" },
      { label: "Disclaimer", href: "/legal/disclaimer" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-[#050b10] px-5 py-16 text-white overflow-hidden">
      {/* Top glowing horizon separator line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent" />

      {/* Subtle ambient glow in bottom-left */}
      <div 
        className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" 
        aria-hidden="true" 
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.35fr_3fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3 group">
            <KhaoScanLogo className="h-10 w-10 rounded-xl shadow-lg shadow-orange-500/25 transition-transform group-hover:scale-105" />
            <span className="text-xl font-black tracking-tight text-white">KhaoScan</span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-6 text-zinc-300">
            In-restaurant QR ordering, live operations, UPI payments, and restaurant management in one premium platform.
          </p>
          <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-orange-300">
            <Scale className="h-4 w-4 text-orange-400" />
            Built for Indian restaurants
          </div>
          <p className="mt-2 max-w-sm text-xs leading-6 text-zinc-400">
            Direct payments to restaurants. No delivery marketplace flow. No manual password storage.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-bold uppercase tracking-wider text-orange-300">{column.title}</h2>
              <nav className="mt-4 grid gap-3">
                {column.links.map((link) => (
                  <Link 
                    key={`${column.title}-${link.label}`} 
                    href={link.href} 
                    className="text-sm text-zinc-400 transition hover:text-white hover:translate-x-0.5 transform inline-block"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto mt-14 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-8 text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 KhaoScan. All rights reserved.</p>
        <p>Premium dine-in ordering and restaurant operations platform.</p>
      </div>
    </footer>
  );
}
