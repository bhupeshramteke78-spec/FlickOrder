"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BellRing,
  ChefHat,
  CreditCard,
  History,
  LayoutDashboard,
  ListOrdered,
  QrCode,
  Settings,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardNavIconKey =
  | "overview"
  | "orders"
  | "history"
  | "menu"
  | "tables"
  | "kitchen"
  | "waiter"
  | "analytics"
  | "subscription"
  | "settings";

const dashboardNavIcons: Record<DashboardNavIconKey, LucideIcon> = {
  overview: LayoutDashboard,
  orders: ListOrdered,
  history: History,
  menu: Utensils,
  tables: QrCode,
  kitchen: ChefHat,
  waiter: BellRing,
  analytics: BarChart3,
  subscription: CreditCard,
  settings: Settings,
};

export function DashboardNavLink({
  href,
  label,
  iconKey,
  badge,
  onNavigate,
  className,
}: {
  href: string;
  label: string;
  iconKey: DashboardNavIconKey;
  badge?: string;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const Icon = dashboardNavIcons[iconKey];

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "dashboard-nav-link group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium tracking-wide transition-all duration-150",
        isActive
          ? "bg-rose-50/90 text-rose-600 font-bold shadow-none after:absolute after:right-0 after:top-1 after:bottom-1 after:w-1 after:bg-rose-500 after:rounded-l-full"
          : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70",
        className,
      )}
    >
      <Icon
        className={cn(
          "relative h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
          isActive ? "text-rose-600" : "text-zinc-500 group-hover:text-zinc-800",
        )}
      />
      <span className="relative min-w-0 flex-1 truncate">{label}</span>
      {badge ? (
        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">
          {badge}
        </span>
      ) : isActive ? (
        <span className="relative h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
      ) : (
        <DashboardNavPendingHint />
      )}
    </Link>
  );
}

function DashboardNavPendingHint() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden
      className={cn(
        "relative h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400 transition",
        pending ? "opacity-100 shadow-[0_0_12px_rgba(244,63,94,0.9)]" : "opacity-0",
      )}
    />
  );
}
