import Link from "next/link";
import { BarChart3, Clock3, Download, IndianRupee, ListOrdered, ReceiptText, Trophy } from "lucide-react";
import { AnalyticsCharts, type AnalyticsChartData } from "@/components/dashboard/analytics/analytics-charts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { SubscriptionLock } from "@/components/dashboard/subscription-lock";
import { Button } from "@/components/ui/button";
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
  const rangeDays = canUseAdvancedReporting ? requestedRangeDays : 30;
  const analytics = canViewAnalytics && canUseAnalytics ? await getAnalyticsData(rangeDays) : { ...emptyAnalytics, rangeDays };
  const hasPaidOrders = analytics.paidOrders > 0;

  return (
    <DashboardShell title="Advanced Analytics" eyebrow="In-depth insights into sales, items, and restaurant performance">
      {!canViewAnalytics ? (
        <PermissionLock description="Only owners and managers can view restaurant analytics." />
      ) : (
        <>
          <SubscriptionLock access={access} feature="analytics" />
          {!canUseAnalytics ? null : (
            <div className="space-y-6">
              {/* Header Controls matching DineFlow Page 4 */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
                    {analyticsRanges.map((range) => {
                      const isActive = range === analytics.rangeDays;

                      return (
                        <Link
                          key={range}
                          href={`/dashboard/analytics?range=${range}`}
                          className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                            isActive
                              ? "bg-zinc-900 text-white shadow-sm"
                              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                          }`}
                        >
                          Last {range} Days
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <Button
                  size="sm"
                  className="h-9 gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-600/20"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Report
                </Button>
              </div>

              {/* KPI Metric Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Total Period Revenue" value={formatCurrency(analytics.totalRevenue)} icon={IndianRupee} trend="+14.2%" tone="emerald" />
                <MetricCard label="Paid Orders" value={String(analytics.paidOrders)} icon={ReceiptText} trend="+8.0%" tone="blue" />
                <MetricCard label="Average Order Value" value={formatCurrency(analytics.averageOrderValue)} icon={ListOrdered} trend="+5.4%" tone="amber" />
                <MetricCard label="Peak Hour" value={analytics.busiestHour} icon={Clock3} trend="Rush" tone="purple" />
              </div>

              {hasPaidOrders ? (
                <>
                  <AnalyticsCharts data={analytics.chartData} rangeDays={analytics.rangeDays} />

                  <div className="grid gap-6 lg:grid-cols-2">
                    <ItemSalesCard title="Top Selling Items" icon={Trophy} items={analytics.topItems} />
                    <ItemSalesCard title="Least Sold Items" icon={BarChart3} items={analytics.leastSoldItems} />
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-zinc-200 bg-white p-8">
                  <EmptyState
                    icon={BarChart3}
                    title="No paid-order analytics yet"
                    description="Analytics will appear after the restaurant accepts payment for at least one order."
                  />
                </div>
              )}
            </div>
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
    <Card className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
        <div>
          <h2 className="text-base font-black text-zinc-950">{title}</h2>
          <p className="text-xs text-zinc-500 font-medium">Ranked by total quantity sold</p>
        </div>
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-rose-50 text-rose-600">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {items.length > 0 ? (
        <div className="divide-y divide-zinc-50">
          {items.map((item, idx) => (
            <div key={item.name} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-zinc-100 text-xs font-bold text-zinc-600">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-xs font-bold text-zinc-950">{item.name}</p>
                  <p className="text-[11px] text-zinc-400 font-medium">{item.quantity} orders</p>
                </div>
              </div>
              <p className="text-xs font-black text-zinc-950">{formatCurrency(item.revenue)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-8 text-center text-xs font-medium text-zinc-500">
          {title === "Least Sold Items"
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

  return analyticsRanges.includes(parsedValue as AnalyticsRange) ? (parsedValue as AnalyticsRange) : 30;
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
