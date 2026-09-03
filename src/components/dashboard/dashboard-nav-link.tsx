"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BellRing,
  CalendarDays,
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
  | "bookings"
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
  bookings: CalendarDays,
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
  onNavigate,
  className,
}: {
  href: string;
  label: string;
  iconKey: DashboardNavIconKey;
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
        "dashboard-nav-link group relative flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all duration-200 active:scale-[0.98]",
        isActive
          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur"
          : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] border border-transparent",
        className,
      )}
    >
      <Icon className={cn("relative h-4 w-4 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-emerald-400" : "text-zinc-400 group-hover:text-zinc-200")} />
      <span className="relative min-w-0 flex-1 truncate">{label}</span>
      {isActive ? (
        <span className="relative h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
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
        "relative h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300 transition",
        pending ? "opacity-100 shadow-[0_0_18px_rgba(110,231,183,0.9)]" : "opacity-0",
      )}
    />
  );
}
