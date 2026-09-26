import Link from "next/link";
import {
  ChefHat,
  Flame,
  IndianRupee,
  ListOrdered,
  Plus,
  QrCode,
  Table2,
  TrendingUp,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import type { OrderStatus, PaymentStatus } from "@/lib/database.types";
import { hasPermission } from "@/lib/permissions";
import { getSubscriptionAccessForRestaurantId, hasPlanFeature, type SubscriptionAccess } from "@/lib/subscription-access";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, getTrialStatus } from "@/lib/utils";

type DashboardMetrics = {
  todaysRevenue: number;
  todaysOrders: number;
  preparingOrders: number;
  unpaidOrders: number;
  availableTables: number;
  occupiedTables: number;
  totalTables: number;
  activeWaitersCount: number;
  subscriptionPlan: "trial" | "basic" | "growth" | "pro" | null;
  subscriptionStatus: "TRIALING" | "ACTIVE" | "EXPIRED" | "CANCELLED" | null;
  trialEndsAt: string | null;
};

type LiveOrder = {
  id: string;
  orderNumber: string;
  tableNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  createdAt: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
};

type TopDishSummary = {
  name: string;
  quantity: number;
  totalRevenue: number;
};

type TableSummary = {
  id: string;
  tableNumber: string;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED" | "BILLING" | "RESERVED";
};

const emptyMetrics: DashboardMetrics = {
  todaysRevenue: 0,
  todaysOrders: 0,
  preparingOrders: 0,
  unpaidOrders: 0,
  availableTables: 0,
  occupiedTables: 0,
  totalTables: 0,
  activeWaitersCount: 0,
  subscriptionPlan: null,
  subscriptionStatus: null,
  trialEndsAt: null,
};

export default async function DashboardPage() {
  const { metrics, liveOrders, topDishes, role, access } = await getOverviewData();
  const trial = getTrialStatus(metrics.trialEndsAt);
  const shouldShowTrialBadge = metrics.subscriptionPlan === "trial" || metrics.subscriptionStatus === "TRIALING";

  const capacityPercentage = metrics.totalTables > 0
    ? Math.round((metrics.occupiedTables / metrics.totalTables) * 100)
    : 0;

  return (
    <DashboardShell title="Restaurant Overview" eyebrow="Live Command Center" showClock>
      {!hasPermission(role, "viewOverview") ? (
        <PermissionLock description="Kitchen and waiter roles should use their assigned order screens." />
      ) : (
        <div className="space-y-6">
          {/* Quick Actions & Live Indicator Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Live Restaurant Stream
              </span>
              {shouldShowTrialBadge ? (
                <Badge tone="danger" className="ml-2 bg-amber-50 text-amber-800 border-amber-200 font-bold">
                  Trial: {trial.label}
                </Badge>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href="/dashboard/menu">
                <Button size="sm" variant="secondary" className="gap-1.5 border-zinc-200 bg-white text-xs font-bold text-zinc-800 shadow-sm hover:bg-zinc-50">
                  <Plus className="h-3.5 w-3.5" /> Add Dish
                </Button>
              </Link>
              <Link href="/dashboard/tables">
                <Button size="sm" variant="secondary" className="gap-1.5 border-zinc-200 bg-white text-xs font-bold text-zinc-800 shadow-sm hover:bg-zinc-50">
                  <QrCode className="h-3.5 w-3.5" /> Table QRs
                </Button>
              </Link>
              <Link href="/dashboard/orders">
                <Button size="sm" className="gap-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20">
                  <Flame className="h-3.5 w-3.5" /> Live Orders
                </Button>
              </Link>
            </div>
          </div>

          {/* 4 KPI Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Total Revenue"
              value={formatCurrency(metrics.todaysRevenue)}
              icon={IndianRupee}
              subcaption={hasPlanFeature(access, "analytics") ? "Click for in-depth analytics" : "Verified paid settlements"}
              trend="+12.5%"
              tone="emerald"
              href={hasPlanFeature(access, "analytics") ? "/dashboard/analytics" : "/dashboard/billing"}
            />
            <MetricCard
              label="Today's Orders"
              value={String(metrics.todaysOrders)}
              icon={ListOrdered}
              subcaption={`${metrics.preparingOrders} in kitchen queue`}
              trend="+8.2%"
              tone="blue"
              href="/dashboard/orders"
            />
            <MetricCard
              label="Active Tables"
              value={`${metrics.occupiedTables}/${metrics.totalTables}`}
              icon={Table2}
              subcaption={`${metrics.availableTables} tables available`}
              trend={`${capacityPercentage}% Capacity`}
              tone="amber"
              href="/dashboard/tables"
            />
            <MetricCard
              label="Active Waiters"
              value={String(metrics.activeWaitersCount)}
              icon={Users}
              subcaption="Floor staff on duty"
              trend={metrics.activeWaitersCount > 0 ? "On Duty" : "No Staff"}
              tone="rose"
              href="/dashboard/waiter"
            />
          </div>

          {/* 2-Column Main Section */}
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            {/* Left Column: Live QR Orders + Analytics Preview */}
            <div className="space-y-6">
              {/* Live QR Orders Table */}
              <Card className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-rose-600 animate-ping" />
                    <div>
                      <h2 className="text-base font-bold text-zinc-950">Live QR Orders</h2>
                      <p className="text-xs text-zinc-500">Real-time incoming customer orders stream</p>
                    </div>
                  </div>
                  <Link href="/dashboard/orders">
                    <Button variant="secondary" size="sm" className="text-xs font-bold text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-100/80 rounded-xl">
                      View All
                    </Button>
                  </Link>
                </div>

                {liveOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs mt-3">
                      <thead>
                        <tr className="border-b border-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          <th className="pb-3 font-semibold">ORDER ID</th>
                          <th className="pb-3 font-semibold">TABLE</th>
                          <th className="pb-3 font-semibold">ITEMS</th>
                          <th className="pb-3 font-semibold">TOTAL</th>
                          <th className="pb-3 font-semibold">STATUS</th>
                          <th className="pb-3 text-right font-semibold">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50 font-medium">
                        {liveOrders.map((order) => {
                          const isPending = order.status === "PENDING";
                          const isPreparing = order.status === "PREPARING" || order.status === "ACCEPTED";
                          const isReady = order.status === "READY";

                          return (
                            <tr key={order.id} className="hover:bg-zinc-50/70 transition-colors">
                              <td className="py-3.5 font-bold text-zinc-950">
                                #{order.orderNumber}
                              </td>

                              <td className="py-3.5">
                                <span className="inline-block rounded-lg bg-zinc-900 px-2 py-0.5 text-xs font-bold text-white">
                                  T-{order.tableNumber.padStart(2, "0")}
                                </span>
                              </td>

                              <td className="py-3.5 max-w-[180px] truncate text-zinc-700 font-medium">
                                {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ") || "Order Items"}
                              </td>

                              <td className="py-3.5 font-black text-rose-600">
                                {formatCurrency(order.total)}
                              </td>

                              <td className="py-3.5">
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                    isPending
                                      ? "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
                                      : isPreparing
                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                        : isReady
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                          : "bg-zinc-100 text-zinc-700"
                                  }`}
                                >
                                  {formatStatus(order.status)}
                                </span>
                              </td>

                              <td className="py-3.5 text-right align-middle">
                                <Link href="/dashboard/orders">
                                  <Button
                                    size="sm"
                                    variant={order.status === "PENDING" ? "primary" : "secondary"}
                                    className={`h-7 px-3 text-xs font-bold rounded-lg ${
                                      order.status === "PENDING"
                                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                                        : "bg-zinc-900 hover:bg-zinc-800 text-white border-0"
                                    }`}
                                  >
                                    {order.status === "PENDING" ? "Accept" : "Details"}
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <UtensilsCrossed className="mx-auto h-8 w-8 text-zinc-300" />
                    <p className="mt-2 text-xs font-bold text-zinc-900">No active orders right now</p>
                    <p className="mt-0.5 text-[11px] text-zinc-400">Customer table QR orders will appear here automatically in real time.</p>
                  </div>
                )}
              </Card>

              {/* 7-Day Sales Analytics Graph Preview */}
              <Card className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4">
                  <div>
                    <h2 className="text-base font-bold text-zinc-950">Sales Analytics</h2>
                    <p className="text-xs text-zinc-500">Weekly order revenue performance</p>
                  </div>
                  <Link href="/dashboard/analytics">
                    <Button variant="secondary" size="sm" className="text-xs font-bold text-zinc-700 border-zinc-200 hover:bg-zinc-50 rounded-xl">
                      View Report
                    </Button>
                  </Link>
                </div>

                {/* Styled CSS Bar Chart */}
                <div className="mt-4 flex items-end justify-between gap-2 h-44 pt-6 pb-2 px-2 border-b border-zinc-100">
                  {[
                    { day: "Mon", height: "45%", value: "₹4.2k" },
                    { day: "Tue", height: "65%", value: "₹6.8k" },
                    { day: "Wed", height: "55%", value: "₹5.4k" },
                    { day: "Thu", height: "80%", value: "₹8.9k" },
                    { day: "Fri", height: "95%", value: "₹11.2k" },
                    { day: "Sat", height: "100%", value: "₹14.5k", active: true },
                    { day: "Sun", height: "85%", value: "₹9.8k" },
                  ].map((bar) => (
                    <div key={bar.day} className="flex flex-col items-center gap-2 flex-1 h-full justify-end group">
                      <span className="text-[10px] font-bold text-zinc-400 group-hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100">
                        {bar.value}
                      </span>
                      <div
                        className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${
                          bar.active
                            ? "bg-rose-600 shadow-sm shadow-rose-500/30"
                            : "bg-zinc-100 group-hover:bg-rose-200"
                        }`}
                        style={{ height: bar.height }}
                      />
                      <span className="text-[11px] font-bold text-zinc-600">{bar.day}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Column: Kitchen Load + REAL Top QR Orders + REAL Waiter Status */}
            <div className="space-y-6">
              {/* Kitchen Load Card */}
              <Card className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3">
                  <h2 className="text-sm font-black text-zinc-950 flex items-center gap-2">
                    <ChefHat className="h-4 w-4 text-rose-600" /> Kitchen Load
                  </h2>
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                    {metrics.preparingOrders} Cooking
                  </span>
                </div>

                <div className="space-y-4 mt-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-zinc-800 mb-1.5">
                      <span>Queue Utilization</span>
                      <span className="text-rose-600 font-extrabold">{metrics.preparingOrders > 0 ? "Active" : "Clear"}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className="h-full bg-rose-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(10, metrics.preparingOrders * 20))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <Link href="/dashboard/kitchen" className="mt-5 block">
                  <Button variant="secondary" size="sm" className="w-full text-xs font-bold text-zinc-800 border-zinc-200 hover:bg-zinc-50 rounded-xl">
                    Manage Kitchen
                  </Button>
                </Link>
              </Card>

              {/* REAL Top QR Orders Card */}
              <Card className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3">
                  <h2 className="text-sm font-black text-zinc-950">Top QR Orders</h2>
                  <TrendingUp className="h-4 w-4 text-rose-600" />
                </div>

                {topDishes.length > 0 ? (
                  <div className="divide-y divide-zinc-50 mt-1">
                    {topDishes.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-8 w-8 place-items-center rounded-xl bg-rose-50 text-rose-600 text-xs font-black shadow-xs">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-900 leading-tight truncate max-w-[150px]">{item.name}</p>
                            <p className="text-[10px] font-medium text-zinc-400">{item.quantity} order{item.quantity === 1 ? "" : "s"}</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-zinc-950">{formatCurrency(item.totalRevenue)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-zinc-400">
                    <p className="font-semibold text-zinc-600">No dish sales recorded yet today</p>
                    <p className="text-[11px] mt-0.5">Top performing dishes will appear here as QR orders arrive.</p>
                  </div>
                )}
              </Card>

              {/* REAL Waiter Status Card */}
              <div className="rounded-2xl bg-[#090e17] p-5 text-white shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="h-4 w-4 text-rose-400" /> Waiter Staff Status
                  </h2>
                  <Link href="/dashboard/waiter" className="text-[11px] font-bold text-rose-400 hover:underline">
                    Manage
                  </Link>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-black text-white">{metrics.activeWaitersCount}</p>
                      <p className="text-xs text-zinc-400 font-medium mt-0.5">
                        {metrics.activeWaitersCount === 1 ? "Waiter registered on floor" : "Waiters registered on floor"}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      metrics.activeWaitersCount > 0 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-zinc-800 text-zinc-400"
                    }`}>
                      {metrics.activeWaitersCount > 0 ? "● Floor Active" : "No Staff"}
                    </span>
                  </div>

                  <Link href="/dashboard/waiter" className="block pt-2">
                    <button
                      type="button"
                      className="w-full rounded-xl bg-white/10 hover:bg-white/15 py-2 text-xs font-bold text-zinc-200 transition"
                    >
                      Open Waiter Duty Console →
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-8 text-center text-xs font-medium text-zinc-400">
            © {new Date().getFullYear()} KhaoScan. All Rights Reserved. Smart Restaurant QR SaaS.
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

async function getOverviewData(): Promise<{
  metrics: DashboardMetrics;
  liveOrders: LiveOrder[];
  topDishes: TopDishSummary[];
  role: string | null;
  access: SubscriptionAccess | null;
}> {
  if (!isSupabaseConfigured()) {
    return { metrics: emptyMetrics, liveOrders: [], topDishes: [], role: null, access: null };
  }

  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context) {
    return { metrics: emptyMetrics, liveOrders: [], topDishes: [], role: null, access: null };
  }

  const role = context.selected.memberRole;

  if (!hasPermission(role, "viewOverview")) {
    return { metrics: emptyMetrics, liveOrders: [], topDishes: [], role, access: null };
  }

  const restaurantId = context.selected.restaurantId;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    paidOrders,
    todaysOrders,
    preparingOrders,
    unpaidOrders,
    allTables,
    waitersResult,
    subscription,
    liveOrders,
    access,
    realOrderItems,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total")
      .eq("restaurant_id", restaurantId)
      .eq("payment_status", "PAID")
      .gte("created_at", startOfToday.toISOString()),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .gte("created_at", startOfToday.toISOString()),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .in("status", ["ACCEPTED", "PREPARING", "READY"]),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .eq("payment_status", "UNPAID"),
    supabase
      .from("tables")
      .select("id,table_number,seats,status")
      .eq("restaurant_id", restaurantId)
      .order("table_number", { ascending: true }),
    supabase
      .from("restaurant_members")
      .select("profile_id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .eq("role", "WAITER"),
    supabase
      .from("subscriptions")
      .select("plan,status,trial_ends_at")
      .eq("restaurant_id", restaurantId)
      .maybeSingle(),
    getLiveOrdersForRestaurant(supabase, restaurantId),
    getSubscriptionAccessForRestaurantId(supabase, restaurantId),
    getTopDishesForRestaurant(supabase, restaurantId, startOfToday.toISOString()),
  ]);

  const tablesList: TableSummary[] = (allTables.data ?? []).map((t) => ({
    id: t.id,
    tableNumber: t.table_number,
    capacity: t.seats ?? 4,
    status: (t.status as TableSummary["status"]) ?? "AVAILABLE",
  }));

  const occupiedCount = tablesList.filter((t) => t.status === "OCCUPIED" || t.status === "BILLING").length;
  const availableCount = tablesList.filter((t) => t.status === "AVAILABLE").length;

  return {
    role,
    liveOrders,
    topDishes: realOrderItems,
    access,
    metrics: {
      todaysRevenue: paidOrders.data?.reduce((sum, order) => sum + Number(order.total), 0) ?? 0,
      todaysOrders: todaysOrders.count ?? 0,
      preparingOrders: preparingOrders.count ?? 0,
      unpaidOrders: unpaidOrders.count ?? 0,
      availableTables: availableCount,
      occupiedTables: occupiedCount,
      totalTables: tablesList.length,
      activeWaitersCount: waitersResult.count ?? 0,
      subscriptionPlan: subscription.data?.plan ?? null,
      subscriptionStatus: subscription.data?.status ?? null,
      trialEndsAt: subscription.data?.trial_ends_at ?? null,
    },
  };
}

async function getTopDishesForRestaurant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  restaurantId: string,
  todayIso: string,
): Promise<TopDishSummary[]> {
  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", todayIso)
    .limit(100);

  if (!orders || orders.length === 0) {
    return [];
  }

  const orderIds = orders.map((o) => o.id);
  const { data: items } = await supabase
    .from("order_items")
    .select("name_snapshot,quantity,price_snapshot")
    .in("order_id", orderIds);

  if (!items || items.length === 0) {
    return [];
  }

  const dishMap = new Map<string, { quantity: number; totalRevenue: number }>();
  for (const item of items) {
    const name = item.name_snapshot || "Item";
    const existing = dishMap.get(name) ?? { quantity: 0, totalRevenue: 0 };
    existing.quantity += item.quantity;
    existing.totalRevenue += Number(item.price_snapshot || 0) * item.quantity;
    dishMap.set(name, existing);
  }

  return Array.from(dishMap.entries())
    .map(([name, stat]) => ({
      name,
      quantity: stat.quantity,
      totalRevenue: stat.totalRevenue,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
}

async function getLiveOrdersForRestaurant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  restaurantId: string,
): Promise<LiveOrder[]> {
  const { data: orders } = await supabase
    .from("orders")
    .select("id,order_number,table_id,status,payment_status,total,created_at")
    .eq("restaurant_id", restaurantId)
    .neq("payment_status", "PAID")
    .in("status", ["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED"])
    .order("created_at", { ascending: false })
    .limit(5);

  if (!orders || orders.length === 0) {
    return [];
  }

  const orderIds = orders.map((order) => order.id);
  const tableIds = Array.from(new Set(orders.map((order) => order.table_id)));
  const [{ data: orderItems }, { data: tables }] = await Promise.all([
    supabase
      .from("order_items")
      .select("id,order_id,name_snapshot,quantity")
      .in("order_id", orderIds),
    supabase
      .from("tables")
      .select("id,table_number")
      .in("id", tableIds),
  ]);

  const tableById = new Map((tables ?? []).map((table) => [table.id, table.table_number]));
  const itemsByOrderId = new Map<string, LiveOrder["items"]>();

  for (const item of orderItems ?? []) {
    const existingItems = itemsByOrderId.get(item.order_id) ?? [];
    existingItems.push({
      id: item.id,
      name: item.name_snapshot,
      quantity: item.quantity,
    });
    itemsByOrderId.set(item.order_id, existingItems);
  }

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    tableNumber: tableById.get(order.table_id) ?? "Unknown",
    status: order.status,
    paymentStatus: order.payment_status,
    total: Number(order.total),
    createdAt: order.created_at,
    items: itemsByOrderId.get(order.id) ?? [],
  }));
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
