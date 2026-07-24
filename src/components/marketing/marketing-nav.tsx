"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { FlickOrderLogo } from "@/components/brand/flickorder-logo";
import { Button } from "@/components/ui/button";

type NavItem = {
  label: string;
  href: string;
  mode: "scroll-top" | "route" | "anchor";
};

const navItems: NavItem[] = [
  { label: "Home", href: "/", mode: "scroll-top" },
  { label: "Restaurants", href: "/restaurants/search", mode: "route" },
  { label: "Pricing", href: "/pricing", mode: "route" },
  { label: "About", href: "#about", mode: "anchor" },
];

export function MarketingNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [transition, setTransition] = useState<{ label: string; x: number; y: number } | null>(null);

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>, item: NavItem) {
    event.preventDefault();

    if (item.mode === "scroll-top") {
      if (pathname !== "/") {
        router.push("/");
        return;
      }

      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      history.replaceState(null, "", "/");
      return;
    }

    if (item.mode === "anchor") {
      if (pathname !== "/") {
        router.push(`/${item.href}`);
        return;
      }

      document.querySelector(item.href)?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
      history.replaceState(null, "", item.href);
      return;
    }

    if (prefersReducedMotion()) {
      router.push(item.href);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setTransition({
      label: item.label,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });

    window.setTimeout(() => {
      router.push(item.href);
    }, 420);
  }

  return (
    <>
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <FlickOrderLogo className="h-8 w-8 rounded-lg" priority />
          FlickOrder
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-zinc-300 md:flex">
          {navItems.map((item) => (
            <motion.a
              key={item.href}
              href={item.href}
              onClick={(event) => handleClick(event, item)}
              className="relative rounded-md px-1 py-1 transition-colors hover:text-white"
              whileHover={{ y: -1, scale: 1.04 }}
              whileTap={item.mode === "route" ? { scale: 0.86 } : { scale: 0.94 }}
              transition={{ type: "spring", stiffness: 460, damping: 30 }}
            >
              {item.label}
              <motion.span
                className="absolute inset-x-0 -bottom-1 mx-auto h-px w-0 bg-orange-300"
                whileHover={{ width: "100%" }}
                transition={{ duration: 0.2 }}
              />
            </motion.a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/auth/owner">
            <Button variant="glass" size="sm">Login</Button>
          </Link>
        </div>
      </header>

      <AnimatePresence>
        {transition ? (
          <motion.div
            className="pointer-events-none fixed inset-0 z-50 overflow-hidden bg-[#02060c]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <motion.div
              className="absolute rounded-full bg-orange-400/80 blur-sm"
              style={{ left: transition.x, top: transition.y }}
              initial={{ width: 10, height: 10, x: -5, y: -5, scale: 0.2, opacity: 0.85 }}
              animate={{ width: 2800, height: 2800, x: -1400, y: -1400, scale: 1, opacity: 0.22 }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.div
              className="absolute rounded-full border border-white/40"
              style={{ left: transition.x, top: transition.y }}
              initial={{ width: 18, height: 18, x: -9, y: -9, scale: 1, opacity: 0.9 }}
              animate={{ width: 92, height: 92, x: -46, y: -46, scale: 0.1, opacity: 0 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 grid place-items-center text-sm font-semibold uppercase tracking-[0.2em] text-white"
              initial={{ scale: 1.08, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.2 }}
            >
              {transition.label}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
