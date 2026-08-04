"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { BarChart3, BellRing, CalendarDays, ChefHat, CreditCard, History, LayoutDashboard, ListOrdered, LogOut, Menu, QrCode, Settings, Utensils, X } from "lucide-react";
import { FlickOrderLogo } from "@/components/brand/flickorder-logo";
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
      <div className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#071117]/95 px-4 py-3 text-white shadow-2xl shadow-zinc-950/20 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              prefetch={false}
              className="inline-flex shrink-0"
              aria-label="Go to FlickOrder homepage"
            >
              <FlickOrderLogo className="h-9 w-9 rounded-xl" priority />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{restaurantName}</p>
              <p className="truncate text-xs text-zinc-400">{formatRole(memberRole)}</p>
            </div>
          </div>
          <button
            ref={openButtonRef}
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white transition active:scale-95"
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
              "absolute inset-0 bg-zinc-950/60 backdrop-blur-sm transition-opacity duration-300 ease-out",
              isOpen ? "opacity-100" : "opacity-0",
            )}
            onClick={closeMenu}
            aria-label="Close dashboard menu"
            tabIndex={isOpen ? 0 : -1}
          />
          <aside
            className={cn(
              "relative flex h-full w-[min(22rem,86vw)] flex-col overflow-y-auto bg-[#071117] p-4 text-white shadow-2xl transition-transform duration-300 ease-out will-change-transform",
              isOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <Link
                href="/"
                prefetch={false}
                onClick={closeMenu}
                className="inline-flex shrink-0"
                aria-label="Go to FlickOrder homepage"
              >
                <FlickOrderLogo className="h-9 w-9 rounded-xl" />
              </Link>
              <button
                type="button"
                onClick={closeMenu}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white transition active:scale-95"
                aria-label="Close dashboard menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-xs font-bold text-emerald-900">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{restaurantName}</p>
                  <p className="text-xs text-zinc-400">{formatRole(memberRole)}</p>
                </div>
              </div>
              <RestaurantSwitcher
                restaurants={restaurants}
                selectedRestaurantId={selectedRestaurantId}
                className="mt-3"
              />
              {navItems.some((item) => item.iconKey === "orders") ? (
                <div className="mt-3">
                  <DeviceNotificationToggle restaurantId={selectedRestaurantId} />
                </div>
              ) : null}
            </div>

            <nav className="grid gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = mobileNavIcons[item.iconKey];

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    onClick={closeMenu}
                    className={cn(
                      "dashboard-nav-link flex items-center gap-3 rounded-md px-3 py-3 text-sm transition",
                      isActive ? "bg-white/10 text-white" : "text-zinc-300 hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto grid gap-1 border-t border-white/10 pt-4">
              <Link
                href="/"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-zinc-300 transition hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                Logout
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
