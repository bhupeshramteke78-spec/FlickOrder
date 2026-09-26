"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BellRing,
  ChefHat,
  CreditCard,
  History,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Menu,
  QrCode,
  Settings,
  Utensils,
  X,
} from "lucide-react";
import { DeviceNotificationToggle } from "@/components/dashboard/device-notification-toggle";
import type { DashboardNavIconKey } from "@/components/dashboard/dashboard-nav-link";
import { RestaurantSwitcher } from "@/components/dashboard/restaurant-switcher";
import type { DashboardRestaurantOption } from "@/lib/dashboard-restaurant";
import { cn } from "@/lib/utils";

type MobileNavItem = {
  href: string;
  label: string;
  iconKey: DashboardNavIconKey;
};

const mobileNavIcons: Record<DashboardNavIconKey, LucideIcon> = {
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

export function MobileDashboardNav({
  restaurantName,
  memberRole,
  initials,
  restaurants,
  selectedRestaurantId,
  navItems,
}: {
  restaurantName: string;
  memberRole: string;
  initials: string;
  restaurants: DashboardRestaurantOption[];
  selectedRestaurantId: string | null;
  navItems: MobileNavItem[];
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  function closeMenu() {
    setIsOpen(false);
    window.requestAnimationFrame(() => openButtonRef.current?.focus());
  }

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 border-b border-zinc-200 bg-white/95 px-4 py-3 text-zinc-900 shadow-sm backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm shadow-rose-600/20">
              <Utensils className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-zinc-950">{restaurantName}</p>
              <p className="truncate text-[10px] text-zinc-500 font-medium">{formatRole(memberRole)}</p>
            </div>
          </div>
          <button
            ref={openButtonRef}
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-800 transition active:scale-95"
            aria-label="Open dashboard menu"
            aria-expanded={isOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          isOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        role="dialog"
        aria-modal={isOpen ? "true" : undefined}
        aria-label="Dashboard navigation"
        inert={!isOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity duration-300 ease-out",
            isOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={closeMenu}
          aria-label="Close dashboard menu"
          tabIndex={isOpen ? 0 : -1}
        />
        <aside
          className={cn(
            "relative flex h-full w-[min(20rem,84vw)] flex-col overflow-y-auto bg-white p-4 text-zinc-900 shadow-2xl transition-transform duration-300 ease-out will-change-transform",
            isOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm">
                <Utensils className="h-4 w-4" />
              </div>
              <span className="text-base font-black tracking-tight text-zinc-950">DineFlow</span>
            </div>
            <button
              type="button"
              onClick={closeMenu}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600 transition active:scale-95"
              aria-label="Close dashboard menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-4 rounded-xl border border-zinc-200/80 bg-zinc-50 p-3">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-100 text-xs font-bold text-rose-700">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-zinc-950">{restaurantName}</p>
                <p className="text-[10px] text-zinc-500 font-medium">{formatRole(memberRole)}</p>
              </div>
            </div>
            <RestaurantSwitcher
              restaurants={restaurants}
              selectedRestaurantId={selectedRestaurantId}
              className="mt-2.5 text-xs"
            />
            {navItems.some((item) => item.iconKey === "orders") ? (
              <div className="mt-2.5">
                <DeviceNotificationToggle restaurantId={selectedRestaurantId} />
              </div>
            ) : null}
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = mobileNavIcons[item.iconKey];

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all duration-150",
                    isActive
                      ? "bg-rose-50 text-rose-600 font-bold border-r-2 border-rose-500"
                      : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100",
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-rose-600" : "text-zinc-500")} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto shrink-0 border-t border-zinc-100 pt-3">
            <Link
              href="/"
              prefetch={false}
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-zinc-600 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="h-4 w-4 text-zinc-400" />
              <span>Logout</span>
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}

function formatRole(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
