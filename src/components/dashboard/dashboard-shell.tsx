import Link from "next/link";
import { BarChart3, BellRing, ChefHat, CreditCard, History, LayoutDashboard, ListOrdered, LogOut, QrCode, Settings, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FlickOrderLogo } from "@/components/brand/flickorder-logo";
import { DashboardClock } from "@/components/dashboard/dashboard-clock";
import { DeviceNotificationToggle } from "@/components/dashboard/device-notification-toggle";
import { MobileDashboardNav } from "@/components/dashboard/mobile-dashboard-nav";
import { RestaurantSwitcher } from "@/components/dashboard/restaurant-switcher";
import { DashboardRealtimeRefresh } from "@/components/realtime/dashboard-realtime-refresh";
import { getInitials, getSelectedDashboardRestaurant, type DashboardRestaurantOption } from "@/lib/dashboard-restaurant";
import { hasPermission, type Permission } from "@/lib/permissions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type DashboardNavIconKey =
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

const navItems: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  iconKey: DashboardNavIconKey;
  permission: Permission;
}> = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, iconKey: "overview", permission: "viewOverview" },
  { href: "/dashboard/orders", label: "Orders", icon: ListOrdered, iconKey: "orders", permission: "viewOrders" },
  { href: "/dashboard/order-history", label: "Order History", icon: History, iconKey: "history", permission: "viewOrderHistory" },
  { href: "/dashboard/menu", label: "Menu", icon: Utensils, iconKey: "menu", permission: "viewMenu" },
  { href: "/dashboard/tables", label: "Tables", icon: QrCode, iconKey: "tables", permission: "viewTables" },
  { href: "/dashboard/kitchen", label: "Kitchen", icon: ChefHat, iconKey: "kitchen", permission: "viewKitchen" },
  { href: "/dashboard/waiter", label: "Waiter", icon: BellRing, iconKey: "waiter", permission: "viewWaiter" },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, iconKey: "analytics", permission: "viewAnalytics" },
  { href: "/dashboard/billing", label: "Subscription", icon: CreditCard, iconKey: "subscription", permission: "viewBilling" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, iconKey: "settings", permission: "viewSettings" },
];

type DashboardIdentity = {
  restaurantId: string | null;
  restaurantName: string;
  memberRole: string;
  initials: string;
  restaurants: DashboardRestaurantOption[];
};

export async function DashboardShell({
  children,
  title,
  eyebrow,
  showClock = false,
}: {
  children: React.ReactNode;
  title: string;
  eyebrow?: string;
  showClock?: boolean;
}) {
  const identity = await getDashboardIdentity();
  const visibleNavItems = navItems.filter((item) => hasPermission(identity.memberRole, item.permission));
  const visibleMobileNavItems = visibleNavItems.map(({ href, label, iconKey }) => ({ href, label, iconKey }));

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-zinc-950">
      <DashboardRealtimeRefresh restaurantId={identity.restaurantId} />
      <MobileDashboardNav
        restaurantName={identity.restaurantName}
        memberRole={identity.memberRole}
        initials={identity.initials}
        restaurants={identity.restaurants}
        selectedRestaurantId={identity.restaurantId}
        navItems={visibleMobileNavItems}
      />
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[244px_1fr]">
        <aside className="hidden bg-[#071117] p-4 text-white lg:sticky lg:top-0 lg:block lg:h-screen">
          <Link href="/" className="mb-7 inline-flex px-2" aria-label="Go to FlickOrder homepage">
            <FlickOrderLogo className="h-10 w-10 rounded-xl" priority />
          </Link>
          <div className="mb-5 rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-xs font-bold text-emerald-900">
                {identity.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{identity.restaurantName}</p>
                <p className="text-xs text-zinc-400">{formatRole(identity.memberRole)}</p>
              </div>
            </div>
            <RestaurantSwitcher
              restaurants={identity.restaurants}
              selectedRestaurantId={identity.restaurantId}
              className="mt-3"
            />
            {hasPermission(identity.memberRole, "viewOrders") ? (
              <div className="mt-3">
                <DeviceNotificationToggle restaurantId={identity.restaurantId} />
              </div>
            ) : null}
          </div>
          <nav className="grid gap-1">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "dashboard-nav-link flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-zinc-300 transition hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8 grid gap-1 border-t border-white/10 pt-4">
            <Link href="/" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-red-500/10 hover:text-red-400">
              <LogOut className="h-4 w-4" /> Logout
            </Link>
          </div>
        </aside>
        <main className="min-w-0 px-4 pb-4 pt-20 sm:px-6 sm:pb-6 lg:p-6">
          <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              {eyebrow ? <p className="text-sm font-medium text-emerald-700">{eyebrow}</p> : null}
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">{title}</h1>
            </div>
            {showClock ? <DashboardClock /> : null}
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}

async function getDashboardIdentity(): Promise<DashboardIdentity> {
  const fallback: DashboardIdentity = {
    restaurantId: null,
    restaurantName: "Restaurant",
    memberRole: "OWNER",
    initials: "R",
    restaurants: [],
  };

  if (!isSupabaseConfigured()) {
    return fallback;
  }

  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context) {
    return fallback;
  }

  return {
    restaurantId: context.selected.restaurantId,
    restaurantName: context.selected.restaurantName,
    memberRole: context.selected.memberRole,
    initials: getInitials(context.selected.restaurantName),
    restaurants: context.restaurants,
  };
}

function formatRole(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
