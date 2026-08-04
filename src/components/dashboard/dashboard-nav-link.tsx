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
      prefetch={false}
      onClick={onNavigate}
      className={cn(
        "dashboard-nav-link group relative flex items-center gap-3 overflow-hidden rounded-md px-3 py-2.5 text-sm transition active:scale-[0.99]",
        isActive ? "bg-white/10 text-white" : "text-zinc-300 hover:text-white",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition"
      />
      <Icon className="relative h-4 w-4 shrink-0" />
      <span className="relative min-w-0 flex-1 truncate">{label}</span>
      <DashboardNavPendingHint />
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
