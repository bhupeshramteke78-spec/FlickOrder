import Link from "next/link";
import { BarChart3, Clock3, IndianRupee, ListOrdered, ReceiptText, Trophy } from "lucide-react";
import { AnalyticsCharts, type AnalyticsChartData } from "@/components/dashboard/analytics/analytics-charts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { SubscriptionLock } from "@/components/dashboard/subscription-lock";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import { hasPermission } from "@/lib/permissions";
import { getSubscriptionAccessForCurrentUser, hasPlanFeature, type SubscriptionAccess } from "@/lib/subscription-access";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

type PaidOrderRow = {
  id: string;
  total: number;
  createdAt: string;
};

type PaidOrderItemRow = {
  orderId: string;
  name: string;
  quantity: number;
  total: number;
};

type ItemSalesRow = {
  name: string;
  quantity: number;
  revenue: number;
};

type AnalyticsData = {
  rangeDays: AnalyticsRange;
  totalRevenue: number;
  todayRevenue: number;
  paidOrders: number;
  averageOrderValue: number;
  topItems: ItemSalesRow[];
  leastSoldItems: ItemSalesRow[];
  busiestHour: string;
  chartData: AnalyticsChartData;
};

type AnalyticsRange = 7 | 30 | 90;

const analyticsRanges: AnalyticsRange[] = [7, 30, 90];

const emptyAnalytics: AnalyticsData = {
  rangeDays: 7,
  totalRevenue: 0,
  todayRevenue: 0,
  paidOrders: 0,
  averageOrderValue: 0,
  topItems: [],
  leastSoldItems: [],
  busiestHour: "No paid orders",
  chartData: {
    revenueByDay: [],
    ordersByDay: [],
    busyHours: [],
  },
};

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const requestedRangeDays = parseAnalyticsRange((await searchParams).range);
  const { access, role } = await getAnalyticsAccess();
  const canViewAnalytics = hasPermission(role, "viewAnalytics");
  const canUseAnalytics = hasPlanFeature(access, "analytics");
  const canUseAdvancedReporting = hasPlanFeature(access, "advancedReporting");
  const rangeDays = canUseAdvancedReporting ? requestedRangeDays : 7;
  const analytics = canViewAnalytics && canUseAnalytics ? await getAnalyticsData(rangeDays) : { ...emptyAnalytics, rangeDays };
  const hasPaidOrders = analytics.paidOrders > 0;

  return (
    <DashboardShell title="Analytics" eyebrow="Paid-order reporting">
      {!canViewAnalytics ? (
        <PermissionLock description="Only owners and managers can view restaurant analytics." />
      ) : (
      <>
      <SubscriptionLock access={access} feature="analytics" />
      {!canUseAnalytics ? null : (
      <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">Performance window</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {canUseAdvancedReporting ? "Filter paid-order analytics by recent restaurant activity." : "Growth includes the last 7 days. Upgrade to Pro for 30 and 90 day reporting."}
          </p>
        </div>
        {canUseAdvancedReporting ? <div className="flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
          {analyticsRanges.map((range) => {
            const isActive = range === analytics.rangeDays;

            return (
              <Link
                key={range}
                href={`/dashboard/analytics?range=${range}`}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-zinc-600 hover:bg-emerald-50 hover:text-emerald-800"
                }`}
              >
                {range} days
              </Link>
            );
          })}
        </div> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Today's revenue" value={formatCurrency(analytics.todayRevenue)} icon={IndianRupee} />
        <MetricCard label="Paid orders" value={String(analytics.paidOrders)} icon={ReceiptText} />
        <MetricCard label="Average order value" value={formatCurrency(analytics.averageOrderValue)} icon={ListOrdered} />
        <MetricCard label="Busiest hour" value={analytics.busiestHour} icon={Clock3} />
      </div>

      {hasPaidOrders ? (
        <>
          <div className="mt-5">
            <AnalyticsCharts data={analytics.chartData} rangeDays={analytics.rangeDays} />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <ItemSalesCard title="Top selling items" icon={Trophy} items={analytics.topItems} />
            <ItemSalesCard title="Least sold items" icon={BarChart3} items={analytics.leastSoldItems} />
          </div>
        </>
      ) : (
        <div className="mt-5">
          <EmptyState
            icon={BarChart3}
            title="No paid-order analytics yet"
            description="Analytics will appear after the restaurant accepts payment for at least one order."
          />
        </div>
      )}
      </>
      )}
      </>
      )}
    </DashboardShell>
  );
}

async function getAnalyticsAccess(): Promise<{ access: SubscriptionAccess | null; role: string | null }> {
  if (!isSupabaseConfigured()) {
    return { access: null, role: null };
  }

  const supabase = await createClient();
  const { access, membership } = await getSubscriptionAccessForCurrentUser(supabase);

  return { access, role: membership?.role ?? null };
}

function ItemSalesCard({ title, icon: Icon, items }: { title: string; icon: typeof Trophy; items: ItemSalesRow[] }) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
          <p className="mt-1 text-sm text-zinc-500">Based on verified paid orders only.</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-950">{item.name}</p>
                <p className="mt-1 text-xs text-zinc-500">{item.quantity} sold</p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-emerald-700">{formatCurrency(item.revenue)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-sm text-zinc-500">
          {title === "Least sold items"
            ? "Not enough item variety yet to calculate least sold items."
            : "Item sales appear after paid orders include menu items."}
        </p>
      )}
    </Card>
  );
}

async function getAnalyticsData(rangeDays: AnalyticsRange): Promise<AnalyticsData> {
  if (!isSupabaseConfigured()) {
    return { ...emptyAnalytics, rangeDays };
  }

  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context) {
    return { ...emptyAnalytics, rangeDays };
  }

  const rangeStart = getRangeStart(rangeDays);

  const { data: paidOrders } = await supabase
    .from("orders")
    .select("id,total,created_at")
    .eq("restaurant_id", context.selected.restaurantId)
    .eq("payment_status", "PAID")
    .gte("created_at", rangeStart.toISOString())
    .order("created_at", { ascending: false })
    .limit(500);

  if (!paidOrders || paidOrders.length === 0) {
    return { ...emptyAnalytics, rangeDays };
  }

  const orders: PaidOrderRow[] = paidOrders.map((order) => ({
    id: order.id,
    total: Number(order.total),
    createdAt: order.created_at,
  }));
  const orderIds = orders.map((order) => order.id);
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("order_id,name_snapshot,quantity,total")
    .in("order_id", orderIds);

  const items: PaidOrderItemRow[] = (orderItems ?? []).map((item) => ({
    orderId: item.order_id,
    name: item.name_snapshot,
    quantity: item.quantity,
    total: Number(item.total),
  }));

  return buildAnalytics(orders, items, rangeDays);
}

function buildAnalytics(orders: PaidOrderRow[], items: PaidOrderItemRow[], rangeDays: AnalyticsRange): AnalyticsData {
  const todayKey = getDateKey(new Date());
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const todayRevenue = orders
    .filter((order) => getDateKey(new Date(order.createdAt)) === todayKey)
    .reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const revenueByDay = buildRevenueByDay(orders, rangeDays);
  const ordersByDay = revenueByDay.map((day) => ({
    label: day.label,
    orders: orders.filter((order) => getDateKey(new Date(order.createdAt)) === day.key).length,
  }));
  const busyHours = buildBusyHours(orders);
  const itemSales = buildItemSales(items);
  const topItems = itemSales.slice(0, 5);
  const topItemNames = new Set(topItems.map((item) => item.name));
  const leastSoldItems = itemSales.length > 1
    ? [...itemSales].reverse().filter((item) => !topItemNames.has(item.name)).slice(0, 5)
    : [];

  return {
    rangeDays,
    totalRevenue,
    todayRevenue,
    paidOrders: orders.length,
    averageOrderValue,
    topItems,
    leastSoldItems,
    busiestHour: getBusiestHourLabel(busyHours),
    chartData: {
      revenueByDay: revenueByDay.map(({ label, revenue }) => ({ label, revenue })),
      ordersByDay,
      busyHours,
    },
  };
}

function buildRevenueByDay(orders: PaidOrderRow[], rangeDays: AnalyticsRange) {
  return getLastDays(rangeDays).map((date) => {
    const key = getDateKey(date);

    return {
      key,
      label: new Intl.DateTimeFormat("en-IN", rangeDays === 7 ? { weekday: "short" } : { day: "2-digit", month: "short" }).format(date),
      revenue: orders
        .filter((order) => getDateKey(new Date(order.createdAt)) === key)
        .reduce((sum, order) => sum + order.total, 0),
    };
  });
}

function buildBusyHours(orders: PaidOrderRow[]) {
  const hourCounts = new Map<number, number>();

  for (const order of orders) {
    const hour = new Date(order.createdAt).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
  }

  return Array.from({ length: 24 }, (_, hour) => ({
    label: formatHour(hour),
    orders: hourCounts.get(hour) ?? 0,
  })).filter((hour) => hour.orders > 0);
}

function buildItemSales(items: PaidOrderItemRow[]) {
  const salesByName = new Map<string, ItemSalesRow>();

  for (const item of items) {
    const current = salesByName.get(item.name) ?? { name: item.name, quantity: 0, revenue: 0 };
    current.quantity += item.quantity;
    current.revenue += item.total;
    salesByName.set(item.name, current);
  }

  return Array.from(salesByName.values()).sort((first, second) => {
    if (second.quantity !== first.quantity) {
      return second.quantity - first.quantity;
    }

    return second.revenue - first.revenue;
  });
}

function getBusiestHourLabel(busyHours: Array<{ label: string; orders: number }>) {
  const busiestHour = busyHours.reduce<{ label: string; orders: number } | null>((current, hour) => {
    if (!current || hour.orders > current.orders) {
      return hour;
    }

    return current;
  }, null);

  return busiestHour ? `${busiestHour.label} (${busiestHour.orders})` : "No paid orders";
}

function getLastDays(rangeDays: AnalyticsRange) {
  return Array.from({ length: rangeDays }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (rangeDays - 1 - index));
    return date;
  });
}

function getRangeStart(rangeDays: AnalyticsRange) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (rangeDays - 1));
  return date;
}

function parseAnalyticsRange(value: string | string[] | undefined): AnalyticsRange {
  const rangeValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = Number(rangeValue);

  return analyticsRanges.includes(parsedValue as AnalyticsRange) ? (parsedValue as AnalyticsRange) : 7;
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatHour(hour: number) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    hour12: true,
  }).format(new Date(2026, 0, 1, hour));
}
