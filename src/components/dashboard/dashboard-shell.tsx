import Link from "next/link";
import dynamic from "next/dynamic";
import { Crown, LogOut } from "lucide-react";
import { KhaoScanLogo } from "@/components/brand/khaoscan-logo";
import { DashboardNavLink, type DashboardNavIconKey } from "@/components/dashboard/dashboard-nav-link";
import { MobileDashboardNav } from "@/components/dashboard/mobile-dashboard-nav";
import { DashboardHeaderSearch } from "@/components/dashboard/dashboard-header-search";
import { RestaurantProfileMenu } from "@/components/dashboard/restaurant-profile-menu";
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

type NavItemConfig = {
  href: string;
  label: string;
  iconKey: DashboardNavIconKey;
  permission: Permission;
  badge?: string;
  isSystem?: boolean;
};

const navItems: NavItemConfig[] = [
  { href: "/dashboard", label: "Overview", iconKey: "overview", permission: "viewOverview" },
  { href: "/dashboard/orders", label: "Orders", iconKey: "orders", permission: "viewOrders", badge: "Live" },
  { href: "/dashboard/order-history", label: "Order History", iconKey: "history", permission: "viewOrderHistory" },
  { href: "/dashboard/menu", label: "Menu", iconKey: "menu", permission: "viewMenu" },
  { href: "/dashboard/tables", label: "Tables", iconKey: "tables", permission: "viewTables" },
  { href: "/dashboard/kitchen", label: "Kitchen", iconKey: "kitchen", permission: "viewKitchen" },
  { href: "/dashboard/waiter", label: "Waiter", iconKey: "waiter", permission: "viewWaiter" },
  { href: "/dashboard/analytics", label: "Analytics", iconKey: "analytics", permission: "viewAnalytics" },
  { href: "/dashboard/billing", label: "Subscriptions", iconKey: "subscription", permission: "viewBilling", isSystem: true },
  { href: "/dashboard/settings", label: "Settings", iconKey: "settings", permission: "viewSettings", isSystem: true },
];

type DashboardIdentity = {
  restaurantId: string | null;
  restaurantName: string;
  restaurantSlug?: string;
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

  const mainNav = visibleNavItems.filter((item) => !item.isSystem);
  const systemNav = visibleNavItems.filter((item) => item.isSystem);
  const visibleMobileNavItems = visibleNavItems.map(({ href, label, iconKey }) => ({ href, label, iconKey }));

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-950">
      <DashboardRealtimeRefresh restaurantId={identity.restaurantId} />
      <MobileDashboardNav
        restaurantName={identity.restaurantName}
        memberRole={identity.memberRole}
        initials={identity.initials}
        restaurants={identity.restaurants}
        selectedRestaurantId={identity.restaurantId}
        navItems={visibleMobileNavItems}
      />
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[240px_1fr]">
        {/* Modern Crisp White Sidebar with Official KhaoScan Brand */}
        <aside className="hidden bg-white border-r border-zinc-200/80 p-4 text-zinc-900 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden shadow-sm">
          {/* Platform Logo Header */}
          <Link href="/" prefetch={false} className="mb-6 flex items-center gap-2.5 px-2 group" aria-label="Go to KhaoScan homepage">
            <KhaoScanLogo size="sm" />
            <div className="min-w-0">
              <span className="text-lg font-black tracking-tight text-zinc-950 block leading-tight">KhaoScan</span>
              <span className="text-[10px] font-bold text-rose-600 tracking-wider uppercase block">Smart Dining</span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-1 overflow-y-auto pr-0.5 scrollbar-none">
            <div className="space-y-0.5">
              {mainNav.map((item) => (
                <DashboardNavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  iconKey={item.iconKey}
                  badge={item.badge}
                />
              ))}
            </div>

            {systemNav.length > 0 && (
              <div className="pt-3">
                <p className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  SYSTEM
                </p>
                <div className="space-y-0.5 mt-1">
                  {systemNav.map((item) => (
                    <DashboardNavLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      iconKey={item.iconKey}
                    />
                  ))}
                  <Link
                    href="/"
                    prefetch={false}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-zinc-600 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    <LogOut className="h-4 w-4 text-zinc-400" />
                    <span>Logout</span>
                  </Link>
                </div>
              </div>
            )}
          </nav>

          {/* Bottom Upgrade Card */}
          <div className="mt-auto shrink-0 pt-3">
            <div className="rounded-xl bg-[#090e17] p-3.5 text-white shadow-sm">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-400">
                <Crown className="h-3.5 w-3.5" />
                <span>Pro Plan</span>
              </div>
              <p className="mt-1 text-xs font-semibold text-zinc-200">Upgrade for more QR features</p>
              <Link href="/dashboard/billing">
                <button
                  type="button"
                  className="mt-2.5 w-full rounded-lg bg-rose-600 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700 active:scale-98 shadow-xs"
                >
                  View Plans
                </button>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 px-4 pb-6 pt-20 sm:px-6 lg:p-7">
          {/* Top Topbar Header */}
          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-950">{title}</h1>
              <p className="mt-0.5 text-xs font-medium text-zinc-500">
                {eyebrow ?? `Welcome back, ${identity.restaurantName}`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Header Search with Submit Button */}
              <DashboardHeaderSearch />

              {/* Notification Toggle (always interactive) */}
              {hasPermission(identity.memberRole, "viewOrders") ? (
                <DeviceNotificationToggle
                  restaurantId={identity.restaurantId}
                  className="h-9 border border-zinc-200/90 bg-white text-xs font-bold text-zinc-700 hover:bg-zinc-50 rounded-xl"
                />
              ) : null}

              {/* Interactive Restaurant Profile Chip (Right Side Only) */}
              <RestaurantProfileMenu
                restaurantId={identity.restaurantId}
                restaurantName={identity.restaurantName}
                restaurantSlug={identity.restaurantSlug}
                memberRole={identity.memberRole}
                initials={identity.initials}
                restaurants={identity.restaurants}
              />
            </div>
          </header>

          {subscriptionNotice ? (
            <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm shadow-sm ${subscriptionNotice.className}`}>
              <p className="font-bold">{subscriptionNotice.title}</p>
              <p className="mt-1 text-xs leading-5">{subscriptionNotice.description}</p>
              <Link href="/dashboard/billing" prefetch={false} className="mt-2 inline-flex text-xs font-bold underline underline-offset-4">
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
    restaurantSlug: context.selected.restaurantSlug,
    memberRole: context.selected.memberRole,
    initials: getInitials(context.selected.restaurantName),
    restaurants: context.restaurants,
  };
}
