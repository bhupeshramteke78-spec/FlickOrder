import Link from "next/link";
import { Scale } from "lucide-react";
import { FlickOrderLogo } from "@/components/brand/flickorder-logo";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Restaurants", href: "/restaurants/search" },
      { label: "Pricing", href: "/pricing" },
      { label: "About", href: "/#about" },
      { label: "Owner login", href: "/auth/owner" },
    ],
  },
  {
    title: "Restaurant Tools",
    links: [
      { label: "QR ordering", href: "/#about" },
      { label: "Menu management", href: "/auth/owner" },
      { label: "Table management", href: "/auth/owner" },
      { label: "Realtime orders", href: "/auth/owner" },
    ],
  },
  {
    title: "Information",
    links: [
      { label: "Support", href: "mailto:support@flickorder.in" },
      { label: "Contact", href: "mailto:hello@flickorder.in" },
      { label: "Book a demo", href: "/auth/owner" },
      { label: "Restaurant trial", href: "/auth/owner" },
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
    <footer className="border-t border-white/10 bg-[#050607] px-5 py-16 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.35fr_3fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <FlickOrderLogo className="h-10 w-10 rounded-xl shadow-lg shadow-orange-500/20" />
            <span className="text-xl font-black tracking-tight">FlickOrder</span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-6 text-zinc-400">
            In-restaurant QR ordering, live operations, UPI payments, and restaurant management in one premium platform.
          </p>
          <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <Scale className="h-4 w-4 text-orange-400" />
            Built for Indian restaurants
          </div>
          <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
            Direct payments to restaurants. No delivery marketplace flow. No manual password storage.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h2 className="font-semibold text-white">{column.title}</h2>
              <nav className="mt-5 grid gap-4">
                {column.links.map((link) => (
                  <Link key={`${column.title}-${link.label}`} href={link.href} className="text-sm text-zinc-400 transition hover:text-white">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-14 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <p>(c) 2026 FlickOrder. All rights reserved.</p>
        <p>Premium dine-in ordering and restaurant operations platform.</p>
      </div>
    </footer>
  );
}
