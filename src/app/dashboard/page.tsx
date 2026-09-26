import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ChefHat,
  Clock,
  CreditCard,
  ExternalLink,
  Flame,
  IndianRupee,
  Layers,
  ListOrdered,
  Plus,
  QrCode,
  Sparkles,
  Table2,
  TrendingUp,
  Users,
  Utensils,
  Zap,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
  subscriptionPlan: null,
  subscriptionStatus: null,
  trialEndsAt: null,
};

export default async function DashboardPage() {
  const { metrics, liveOrders, tables, role, access } = await getOverviewData();
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

          {/* 4 KPI Metric Cards matching Page 7 */}
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
              label="Avg. Prep Time"
              value={metrics.preparingOrders > 0 ? `${Math.max(10, metrics.preparingOrders * 4)} min` : "14.5 min"}
              icon={Zap}
              subcaption="Average order to serve speed"
              trend="-2.4m"
              tone="purple"
              href="/dashboard/kitchen"
            />
          </div>

          {/* Main Grid matching DineFlow Page 7 */}
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* Left Column: Live QR Orders + Sales Analytics Chart */}
            <div className="space-y-6">
              {/* Live QR Orders Table Card */}
              <Card className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-black text-zinc-950">Live QR Orders</h2>
                    <span className="rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                      {liveOrders.length} Active
                    </span>
                  </div>
                  <Link
                    href="/dashboard/orders"
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 transition"
                  >
                    View All
                  </Link>
                </div>

                {liveOrders.length > 0 ? (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                          <th className="pb-3 font-semibold">Table</th>
                          <th className="pb-3 font-semibold">Items</th>
                          <th className="pb-3 font-semibold">Status</th>
                          <th className="pb-3 text-right font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {liveOrders.map((order, idx) => {
                          const tableBadgeTones = ["bg-rose-50 text-rose-700 border-rose-200", "bg-blue-50 text-blue-700 border-blue-200", "bg-emerald-50 text-emerald-700 border-emerald-200", "bg-amber-50 text-amber-700 border-amber-200"];
                          const badgeTone = tableBadgeTones[idx % tableBadgeTones.length];

                          return (
                            <tr key={order.id} className="transition-colors hover:bg-zinc-50/60">
                              <td className="py-3.5 pr-3 align-top">
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center justify-center rounded-lg border px-2 py-1 text-xs font-mono font-bold ${badgeTone}`}>
                                    T-{order.tableNumber}
                                  </span>
                                  <div>
                                    <p className="font-bold text-zinc-900 leading-tight">Table {order.tableNumber}</p>
                                    <p className="text-[10px] text-zinc-400 font-medium">QR {formatTime(order.createdAt)}</p>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 pr-3 align-top">
                                <p className="font-medium text-zinc-800 line-clamp-1">
                                  {order.items.length > 0
                                    ? order.items.map((it) => `${it.quantity}x ${it.name}`).join(", ")
                                    : "Food order"}
                                </p>
                                <p className="text-[11px] font-bold text-zinc-900 mt-0.5">
                                  {formatCurrency(order.total)}
                                </p>
                              </td>

                              <td className="py-3.5 pr-3 align-top">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                    order.status === "PENDING"
                                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                                      : order.status === "PREPARING"
                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  }`}
                                >
                                  {formatStatus(order.status)}
                                </span>
                              </td>

                              <td className="py-3.5 text-right align-top">
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
                  <div className="py-8 text-center text-xs text-zinc-500">
                    No active QR orders right now. Orders placed via table QR codes will appear here in real-time.
                  </div>
                )}
              </Card>

              {/* Sales Analytics Preview Card matching Page 7 */}
              <Card className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                  <div>
                    <h2 className="text-base font-black text-zinc-950">Sales Analytics</h2>
                    <p className="text-xs text-zinc-500">Weekly revenue trends</p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-700">
                    Last 7 Days
                  </div>
                </div>

                <div className="mt-6 h-48 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-2">
                  {[
                    { day: "Mon", val: 45, rev: "₹2,200" },
                    { day: "Tue", val: 38, rev: "₹1,850" },
                    { day: "Wed", val: 58, rev: "₹2,900" },
                    { day: "Thu", val: 65, rev: "₹3,400" },
                    { day: "Fri", val: 78, rev: "₹4,100" },
                    { day: "Sat", val: 95, rev: "₹5,200" },
                    { day: "Sun", val: 88, rev: "₹4,800" },
                  ].map((bar) => (
                    <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 group relative">
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity rounded bg-zinc-900 text-white text-[10px] font-bold px-1.5 py-0.5 whitespace-nowrap pointer-events-none">
                        {bar.rev}
                      </div>
                      <div className="w-full bg-rose-50 rounded-t-lg relative overflow-hidden flex items-end h-32">
                        <div
                          className="w-full bg-rose-500 rounded-t-lg transition-all duration-500 group-hover:bg-rose-600"
                          style={{ height: `${bar.val}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-zinc-500">{bar.day}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Column: Kitchen Load + Top QR Orders + Waiter Status */}
            <div className="space-y-6">
              {/* Kitchen Load Progress Card */}
              <Card className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3">
                  <h2 className="text-sm font-black text-zinc-950">Kitchen Load</h2>
                  <ChefHat className="h-4 w-4 text-rose-600" />
                </div>

                <div className="space-y-4 mt-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-zinc-800 mb-1.5">
                      <span>Main Course</span>
                      <span className="text-rose-600 font-extrabold">85%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: "85%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-zinc-800 mb-1.5">
                      <span>Desserts</span>
                      <span className="text-emerald-600 font-extrabold">30%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: "30%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-zinc-800 mb-1.5">
                      <span>Appetizers</span>
                      <span className="text-blue-600 font-extrabold">50%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: "50%" }} />
                    </div>
                  </div>
                </div>

                <Link href="/dashboard/kitchen" className="mt-5 block">
                  <Button variant="outline" size="sm" className="w-full text-xs font-bold text-zinc-800 border-zinc-200 hover:bg-zinc-50 rounded-xl">
                    Manage Kitchen
                  </Button>
                </Link>
              </Card>

              {/* Top QR Orders Card */}
              <Card className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3">
                  <h2 className="text-sm font-black text-zinc-950">Top QR Orders</h2>
                  <TrendingUp className="h-4 w-4 text-rose-600" />
                </div>

                <div className="divide-y divide-zinc-50 mt-1">
                  {[
                    { name: "Classic Beef Burger", orders: "45 orders today", price: "₹280.00", initial: "🍔" },
                    { name: "Pasta Carbonara", orders: "32 orders today", price: "₹340.00", initial: "🍝" },
                    { name: "Garden Fresh Salad", orders: "28 orders today", price: "₹180.00", initial: "🥗" },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-100 text-base shadow-sm">
                          {item.initial}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900 leading-tight">{item.name}</p>
                          <p className="text-[10px] font-medium text-zinc-400">{item.orders}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-zinc-950">{item.price}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Waiter Status Sleek Dark Card */}
              <div className="rounded-2xl bg-[#090e17] p-5 text-white shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="h-4 w-4 text-rose-400" /> Waiter Status
                  </h2>
                  <Link href="/dashboard/waiter" className="text-[11px] font-bold text-rose-400 hover:underline">
                    View
                  </Link>
                </div>

                <div className="space-y-3 mt-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-white/10 grid place-items-center text-[10px] font-bold">
                        SJ
                      </div>
                      <span className="font-semibold text-zinc-200">Sarah J.</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400">Active (T-04)</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-white/10 grid place-items-center text-[10px] font-bold">
                        MR
                      </div>
                      <span className="font-semibold text-zinc-200">Mark R.</span>
                    </div>
                    <span className="text-[11px] font-semibold text-zinc-400">Break</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-white/10 grid place-items-center text-[10px] font-bold">
                        EK
                      </div>
                      <span className="font-semibold text-zinc-200">Elena K.</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400">Active (T-12)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-8 text-center text-xs font-medium text-zinc-400">
            © {new Date().getFullYear()} DineFlow SaaS. All Rights Reserved. Powered by QR-Quick Technology.
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

async function getOverviewData(): Promise<{
  metrics: DashboardMetrics;
  liveOrders: LiveOrder[];
  tables: TableSummary[];
  role: string | null;
  access: SubscriptionAccess | null;
}> {
  if (!isSupabaseConfigured()) {
    return { metrics: emptyMetrics, liveOrders: [], tables: [], role: null, access: null };
  }

  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context) {
    return { metrics: emptyMetrics, liveOrders: [], tables: [], role: null, access: null };
  }

  const role = context.selected.memberRole;

  if (!hasPermission(role, "viewOverview")) {
    return { metrics: emptyMetrics, liveOrders: [], tables: [], role, access: null };
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
    subscription,
    liveOrders,
    access,
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
      .from("subscriptions")
      .select("plan,status,trial_ends_at")
      .eq("restaurant_id", restaurantId)
      .maybeSingle(),
    getLiveOrdersForRestaurant(supabase, restaurantId),
    getSubscriptionAccessForRestaurantId(supabase, restaurantId),
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
    tables: tablesList,
    access,
    metrics: {
      todaysRevenue: paidOrders.data?.reduce((sum, order) => sum + Number(order.total), 0) ?? 0,
      todaysOrders: todaysOrders.count ?? 0,
      preparingOrders: preparingOrders.count ?? 0,
      unpaidOrders: unpaidOrders.count ?? 0,
      availableTables: availableCount,
      occupiedTables: occupiedCount,
      totalTables: tablesList.length,
      subscriptionPlan: subscription.data?.plan ?? null,
      subscriptionStatus: subscription.data?.status ?? null,
      trialEndsAt: subscription.data?.trial_ends_at ?? null,
    },
  };
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

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}
