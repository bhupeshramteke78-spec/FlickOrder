import Link from "next/link";
import dynamic from "next/dynamic";
import { LogOut } from "lucide-react";
import { FlickOrderLogo } from "@/components/brand/flickorder-logo";
import { DashboardNavLink, type DashboardNavIconKey } from "@/components/dashboard/dashboard-nav-link";
import { MobileDashboardNav } from "@/components/dashboard/mobile-dashboard-nav";
import { RestaurantSwitcher } from "@/components/dashboard/restaurant-switcher";
import { DashboardRealtimeRefresh } from "@/components/realtime/dashboard-realtime-refresh";
import { getInitials, getSelectedDashboardRestaurant, type DashboardRestaurantOption } from "@/lib/dashboard-restaurant";
import { hasPermission, type Permission } from "@/lib/permissions";
import { getSubscriptionAccessForRestaurantId, type SubscriptionAccess } from "@/lib/subscription-access";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const DeviceNotificationToggle = dynamic(
  () => import("@/components/dashboard/device-notification-toggle").then((mod) => mod.DeviceNotificationToggle),
  { loading: () => null },
);

const navItems: Array<{
  href: string;
  label: string;
  iconKey: DashboardNavIconKey;
  permission: Permission;
}> = [
  { href: "/dashboard", label: "Overview", iconKey: "overview", permission: "viewOverview" },
  { href: "/dashboard/orders", label: "Orders", iconKey: "orders", permission: "viewOrders" },
  { href: "/dashboard/bookings", label: "Bookings", iconKey: "bookings", permission: "viewBookings" },
  { href: "/dashboard/order-history", label: "Order History", iconKey: "history", permission: "viewOrderHistory" },
  { href: "/dashboard/menu", label: "Menu", iconKey: "menu", permission: "viewMenu" },
  { href: "/dashboard/tables", label: "Tables", iconKey: "tables", permission: "viewTables" },
  { href: "/dashboard/kitchen", label: "Kitchen", iconKey: "kitchen", permission: "viewKitchen" },
  { href: "/dashboard/waiter", label: "Waiter", iconKey: "waiter", permission: "viewWaiter" },
  { href: "/dashboard/analytics", label: "Analytics", iconKey: "analytics", permission: "viewAnalytics" },
  { href: "/dashboard/billing", label: "Subscription", iconKey: "subscription", permission: "viewBilling" },
  { href: "/dashboard/settings", label: "Settings", iconKey: "settings", permission: "viewSettings" },
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
}: {
  children: React.ReactNode;
  title: string;
  eyebrow?: string;
  showClock?: boolean;
}) {
  const identity = await getDashboardIdentity();
  const access = identity.restaurantId && isSupabaseConfigured()
    ? await getSubscriptionAccessForRestaurantId(await createClient(), identity.restaurantId)
    : null;
  const subscriptionNotice = access ? getDashboardSubscriptionNotice(access) : null;
  const visibleNavItems = navItems.filter((item) => {
    if (!hasPermission(identity.memberRole, item.permission)) {
      return false;
    }

    if (item.href === "/dashboard/kitchen") {
      return Boolean(access?.kitchenEnabled);
    }

    if (item.href === "/dashboard/waiter") {
      return Boolean(access?.waiterEnabled);
    }

    if (item.href === "/dashboard/order-history") {
      return Boolean(access?.features?.orderHistory);
    }

    if (item.href === "/dashboard/analytics") {
      return Boolean(access?.features?.analytics);
    }

    return true;
  });
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
        <aside className="hidden bg-[#071117] p-4 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
          <Link href="/" prefetch={false} className="mb-7 inline-flex shrink-0 px-2" aria-label="Go to FlickOrder homepage">
            <FlickOrderLogo className="h-10 w-10 rounded-xl" priority />
          </Link>
          <div className="mb-5 shrink-0 rounded-lg border border-white/10 bg-white/[0.04] p-3">
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
          </div>
          <nav className="grid flex-1 content-start gap-1 overflow-y-auto pr-1">
            {visibleNavItems.map((item) => (
              <DashboardNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                iconKey={item.iconKey}
              />
            ))}
          </nav>
          <div className="mt-auto grid shrink-0 gap-1 border-t border-white/10 pt-4">
            <Link href="/" prefetch={false} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-red-500/10 hover:text-red-400">
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {hasPermission(identity.memberRole, "viewOrders") ? (
                <DeviceNotificationToggle
                  restaurantId={identity.restaurantId}
                  className="justify-start border border-zinc-200 bg-white text-zinc-900 hover:-translate-y-0.5 hover:bg-zinc-50"
                />
              ) : null}
            </div>
          </header>
          {subscriptionNotice ? (
            <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${subscriptionNotice.className}`}>
              <p className="font-semibold">{subscriptionNotice.title}</p>
              <p className="mt-1 leading-6">{subscriptionNotice.description}</p>
              <Link href="/dashboard/billing" prefetch={false} className="mt-2 inline-flex font-semibold underline underline-offset-4">
                Open subscription
              </Link>
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}

function getDashboardSubscriptionNotice(access: SubscriptionAccess) {
  if (access.deletedAt || access.isAbandonedTrialPastDeletionDate) {
    return {
      title: "Trial account deletion pending",
      description: access.message ?? "This trial account is no longer available for restaurant operations.",
      className: "border-rose-200 bg-rose-50 text-rose-900",
    };
  }

  if (access.isInGracePeriod) {
    return {
      title: "Subscription grace access",
      description: access.message ?? "Renew the subscription before grace access ends to avoid service lock.",
      className: "border-amber-200 bg-amber-50 text-amber-950",
    };
  }

  return null;
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
