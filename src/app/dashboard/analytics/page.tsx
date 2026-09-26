import Link from "next/link";
import { BarChart3, Clock3, Download, IndianRupee, ListOrdered, ReceiptText, Trophy } from "lucide-react";
import { AnalyticsCharts, type AnalyticsChartData, type CategorySalesShare, type DayHourlyTraffic } from "@/components/dashboard/analytics/analytics-charts";
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

type AnalyticsRange = 7 | 30 | 90;

const analyticsRanges: AnalyticsRange[] = [7, 30, 90];

const paletteColors = [
  "#e11d48", // rose-600
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // purple-500
  "#06b6d4", // cyan-500
  "#64748b", // slate-500
  "#ec4899", // pink-500
];

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
  revenueGrowthRate: number | null;
  ordersGrowthRate: number | null;
  aovGrowthRate: number | null;
  topItems: ItemSalesRow[];
  leastSoldItems: ItemSalesRow[];
  busiestHour: string;
  chartData: AnalyticsChartData;
};

const emptyAnalytics: AnalyticsData = {
  rangeDays: 7,
  totalRevenue: 0,
  todayRevenue: 0,
  paidOrders: 0,
  averageOrderValue: 0,
  revenueGrowthRate: null,
  ordersGrowthRate: null,
  aovGrowthRate: null,
  topItems: [],
  leastSoldItems: [],
  busiestHour: "No orders yet",
  chartData: {
    revenueByDay: [],
    ordersByDay: [],
    busyHours: [],
    categoryDistribution: [],
    weeklyHeatmap: [],
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
  const hasOrders = analytics.paidOrders > 0;

  return (
    <DashboardShell title="Advanced Analytics" eyebrow="Real performance insights generated directly from database orders">
      {!canViewAnalytics ? (
        <PermissionLock description="Only owners and managers can view restaurant analytics." />
      ) : (
        <>
          <SubscriptionLock access={access} feature="analytics" />
          {!canUseAnalytics ? null : (
            <div className="space-y-6">
              {/* Header Controls */}
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

              {/* Real Metric KPI Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Total Period Revenue"
                  value={formatCurrency(analytics.totalRevenue)}
                  icon={IndianRupee}
                  trend={formatTrend(analytics.revenueGrowthRate)}
                  tone="emerald"
                />
                <MetricCard
                  label="Total Orders"
                  value={String(analytics.paidOrders)}
                  icon={ReceiptText}
                  trend={formatTrend(analytics.ordersGrowthRate)}
                  tone="blue"
                />
                <MetricCard
                  label="Average Order Value"
                  value={formatCurrency(analytics.averageOrderValue)}
                  icon={ListOrdered}
                  trend={formatTrend(analytics.aovGrowthRate)}
                  tone="amber"
                />
                <MetricCard
                  label="Peak Hour"
                  value={analytics.busiestHour}
                  icon={Clock3}
                  trend="Live"
                  tone="purple"
                />
              </div>

              {hasOrders ? (
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
                    title="No live order analytics yet"
                    description="Analytics and sales charts will calculate automatically when orders are placed and processed."
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

function formatTrend(growthRate: number | null): string | undefined {
  if (growthRate === null || Number.isNaN(growthRate)) {
    return undefined;
  }
  const prefix = growthRate >= 0 ? "+" : "";
  return `${prefix}${growthRate.toFixed(1)}% vs prev period`;
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
          <p className="text-xs text-zinc-500 font-medium">Ranked by real quantity ordered</p>
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
            ? "Not enough distinct menu items ordered yet."
            : "Item sales appear after orders are placed."}
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

  if (!context?.selected?.restaurantId) {
    return { ...emptyAnalytics, rangeDays };
  }

  const restaurantId = context.selected.restaurantId;
  const now = new Date();
  const currentPeriodStart = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000);
  const previousPeriodStart = new Date(now.getTime() - rangeDays * 2 * 24 * 60 * 60 * 1000);

  // 1. Fetch orders covering both current and previous comparison periods
  const { data: allRawOrders } = await supabase
    .from("orders")
    .select("id,total,status,payment_status,created_at")
    .eq("restaurant_id", restaurantId)
    .neq("status", "CANCELLED")
    .gte("created_at", previousPeriodStart.toISOString())
    .order("created_at", { ascending: false });

  const currentPeriodOrders = (allRawOrders ?? []).filter(
    (o) => new Date(o.created_at) >= currentPeriodStart,
  );
  const previousPeriodOrders = (allRawOrders ?? []).filter(
    (o) => new Date(o.created_at) < currentPeriodStart && new Date(o.created_at) >= previousPeriodStart,
  );

  const currentOrderIds = currentPeriodOrders.map((o) => o.id);

  // 2. Fetch order items, menu items, and categories in parallel for current period
  const [{ data: orderItems }, { data: menuItems }, { data: categories }] = await Promise.all([
    currentOrderIds.length > 0
      ? supabase
          .from("order_items")
          .select("order_id,menu_item_id,name_snapshot,quantity,unit_price,total")
          .in("order_id", currentOrderIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from("menu_items")
      .select("id,name,category_id")
      .eq("restaurant_id", restaurantId),
    supabase
      .from("categories")
      .select("id,name")
      .eq("restaurant_id", restaurantId),
  ]);

  // Build maps
  const categoryNameById = new Map<string, string>((categories ?? []).map((c) => [c.id, c.name]));
  const itemCategoryNameMap = new Map<string, string>();
  for (const item of menuItems ?? []) {
    const catName = categoryNameById.get(item.category_id) || "General";
    itemCategoryNameMap.set(item.id, catName);
    itemCategoryNameMap.set(item.name.toLowerCase().trim(), catName);
  }

  // 3. Current period metrics
  const totalRevenue = currentPeriodOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const todayKey = getDateKey(new Date());
  const todayRevenue = currentPeriodOrders
    .filter((o) => getDateKey(new Date(o.created_at)) === todayKey)
    .reduce((sum, o) => sum + Number(o.total || 0), 0);
  const paidOrdersCount = currentPeriodOrders.length;
  const averageOrderValue = paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0;

  // 4. Previous period metrics for real trend calculation
  const prevRevenue = previousPeriodOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const prevOrdersCount = previousPeriodOrders.length;
  const prevAov = prevOrdersCount > 0 ? prevRevenue / prevOrdersCount : 0;

  const revenueGrowthRate = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;
  const ordersGrowthRate = prevOrdersCount > 0 ? ((paidOrdersCount - prevOrdersCount) / prevOrdersCount) * 100 : null;
  const aovGrowthRate = prevAov > 0 ? ((averageOrderValue - prevAov) / prevAov) * 100 : null;

  // 5. Daily timeline data
  const revenueByDay = buildRevenueByDay(currentPeriodOrders, rangeDays);
  const ordersByDay = revenueByDay.map((day) => ({
    label: day.label,
    orders: currentPeriodOrders.filter((o) => getDateKey(new Date(o.created_at)) === day.key).length,
  }));

  // 6. Busy hours & Busiest hour
  const busyHours = buildBusyHours(currentPeriodOrders);
  const busiestHour = getBusiestHourLabel(busyHours);

  // 7. Item sales aggregation
  const itemSalesMap = new Map<string, ItemSalesRow>();
  for (const item of orderItems ?? []) {
    const name = item.name_snapshot || "Item";
    const current = itemSalesMap.get(name) ?? { name, quantity: 0, revenue: 0 };
    const qty = item.quantity || 1;
    const itemTotal = Number(item.total ?? Number(item.unit_price || 0) * qty);
    current.quantity += qty;
    current.revenue += itemTotal;
    itemSalesMap.set(name, current);
  }

  const sortedItemSales = Array.from(itemSalesMap.values()).sort((a, b) => {
    if (b.quantity !== a.quantity) return b.quantity - a.quantity;
    return b.revenue - a.revenue;
  });

  const topItems = sortedItemSales.slice(0, 5);
  const topNames = new Set(topItems.map((i) => i.name));
  const leastSoldItems = sortedItemSales.length > 1
    ? [...sortedItemSales].reverse().filter((i) => !topNames.has(i.name)).slice(0, 5)
    : [];

  // 8. Real Category Sales Distribution
  const categorySalesMap = new Map<string, { sales: number; count: number }>();
  for (const item of orderItems ?? []) {
    const dishName = (item.name_snapshot || "").toLowerCase().trim();
    const catName =
      (item.menu_item_id && itemCategoryNameMap.get(item.menu_item_id)) ||
      itemCategoryNameMap.get(dishName) ||
      "Main Course";

    const current = categorySalesMap.get(catName) ?? { sales: 0, count: 0 };
    const qty = item.quantity || 1;
    const itemTotal = Number(item.total ?? Number(item.unit_price || 0) * qty);
    current.sales += itemTotal;
    current.count += qty;
    categorySalesMap.set(catName, current);
  }

  const totalCatSales = Array.from(categorySalesMap.values()).reduce((sum, c) => sum + c.sales, 0);
  const categoryDistribution: CategorySalesShare[] = Array.from(categorySalesMap.entries())
    .map(([name, stat], idx) => {
      const percentage = totalCatSales > 0 ? Math.round((stat.sales / totalCatSales) * 100) : 0;
      return {
        name,
        value: percentage,
        sales: stat.sales,
        count: stat.count,
        color: paletteColors[idx % paletteColors.length],
      };
    })
    .sort((a, b) => b.sales - a.sales);

  // 9. Real Weekly Heatmap Matrix
  const weeklyHeatmap = buildWeeklyHeatmap(currentPeriodOrders);

  return {
    rangeDays,
    totalRevenue,
    todayRevenue,
    paidOrders: paidOrdersCount,
    averageOrderValue,
    revenueGrowthRate,
    ordersGrowthRate,
    aovGrowthRate,
    topItems,
    leastSoldItems,
    busiestHour,
    chartData: {
      revenueByDay: revenueByDay.map(({ label, revenue }) => ({ label, revenue })),
      ordersByDay,
      busyHours,
      categoryDistribution,
      weeklyHeatmap,
    },
  };
}

function buildRevenueByDay(orders: Array<{ total: number; created_at: string }>, rangeDays: AnalyticsRange) {
  return getLastDays(rangeDays).map((date) => {
    const key = getDateKey(date);

    return {
      key,
      label: new Intl.DateTimeFormat("en-IN", rangeDays === 7 ? { weekday: "short" } : { day: "2-digit", month: "short" }).format(date),
      revenue: orders
        .filter((order) => getDateKey(new Date(order.created_at)) === key)
        .reduce((sum, order) => sum + Number(order.total || 0), 0),
    };
  });
}

function buildBusyHours(orders: Array<{ created_at: string }>) {
  const hourCounts = new Map<number, number>();

  for (const order of orders) {
    const hour = new Date(order.created_at).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
  }

  return Array.from({ length: 24 }, (_, hour) => ({
    label: formatHour(hour),
    orders: hourCounts.get(hour) ?? 0,
  })).filter((hour) => hour.orders > 0);
}

function buildWeeklyHeatmap(orders: Array<{ created_at: string }>): DayHourlyTraffic[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayIndices = [1, 2, 3, 4, 5, 6, 0]; // Monday = 1, Sunday = 0

  // 5 standard restaurant meal slots
  // 12-14: Lunch, 14-16: Afternoon, 16-18: Evening, 18-20: Dinner, 20-22: Late
  const slotDefinitions = [
    { label: "12 - 2 PM", minHour: 12, maxHour: 13 },
    { label: "2 - 4 PM", minHour: 14, maxHour: 15 },
    { label: "4 - 6 PM", minHour: 16, maxHour: 17 },
    { label: "6 - 8 PM", minHour: 18, maxHour: 19 },
    { label: "8 - 10 PM", minHour: 20, maxHour: 21 },
  ];

  return days.map((dayName, idx) => {
    const targetDayIndex = dayIndices[idx];

    const slots = slotDefinitions.map((slot) => {
      const matchingCount = orders.filter((order) => {
        const orderDate = new Date(order.created_at);
        const orderDay = orderDate.getDay();
        const orderHour = orderDate.getHours();

        return orderDay === targetDayIndex && orderHour >= slot.minHour && orderHour <= slot.maxHour;
      }).length;

      return {
        hourLabel: slot.label,
        ordersCount: matchingCount,
      };
    });

    return {
      day: dayName,
      slots,
    };
  });
}

function getBusiestHourLabel(busyHours: Array<{ label: string; orders: number }>) {
  const busiestHour = busyHours.reduce<{ label: string; orders: number } | null>((current, hour) => {
    if (!current || hour.orders > current.orders) {
      return hour;
    }

    return current;
  }, null);

  return busiestHour ? `${busiestHour.label} (${busiestHour.orders} orders)` : "No orders yet";
}

function getLastDays(rangeDays: AnalyticsRange) {
  return Array.from({ length: rangeDays }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (rangeDays - 1 - index));
    return date;
  });
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
