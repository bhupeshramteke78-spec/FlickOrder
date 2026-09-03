import Link from "next/link";
import {
  ArrowRight,
  ChefHat,
  Clock,
  CreditCard,
  ExternalLink,
  Flame,
  IndianRupee,
  ListOrdered,
  Plus,
  QrCode,
  Sparkles,
  Table2,
  Utensils,
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
  const { metrics, liveOrders, tables, role } = await getOverviewData();
  const trial = getTrialStatus(metrics.trialEndsAt);
  const shouldShowTrialBadge = metrics.subscriptionPlan === "trial" || metrics.subscriptionStatus === "TRIALING";

  return (
    <DashboardShell title="Operations Overview" eyebrow="Live Command Center" showClock>
      {!hasPermission(role, "viewOverview") ? (
        <PermissionLock description="Kitchen and waiter roles should use their assigned order screens." />
      ) : (
        <div className="grid gap-6">
          {/* Top Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Live Restaurant Stream
              </span>
              {shouldShowTrialBadge ? (
                <Badge tone="danger" className="ml-2 bg-amber-50 text-amber-800 border-amber-200">
                  Trial: {trial.label}
                </Badge>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href="/dashboard/menu">
                <Button size="sm" variant="secondary" className="gap-1.5 border-zinc-200 text-xs font-bold">
                  <Plus className="h-3.5 w-3.5" /> Add Dish
                </Button>
              </Link>
              <Link href="/dashboard/tables">
                <Button size="sm" variant="secondary" className="gap-1.5 border-zinc-200 text-xs font-bold">
                  <QrCode className="h-3.5 w-3.5" /> Table QRs
                </Button>
              </Link>
              <Link href="/dashboard/orders">
                <Button size="sm" className="gap-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white">
                  <Flame className="h-3.5 w-3.5" /> Live Kitchen Orders
                </Button>
              </Link>
            </div>
          </div>

          {/* KPI Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Today's Revenue"
              value={formatCurrency(metrics.todaysRevenue)}
              icon={IndianRupee}
              subcaption="Verified paid settlements"
              trend="+12.5%"
              tone="emerald"
            />
            <MetricCard
              label="Active Dine-In Orders"
              value={String(metrics.todaysOrders)}
              icon={ListOrdered}
              subcaption={`${metrics.preparingOrders} in kitchen queue`}
              tone="amber"
            />
            <MetricCard
              label="Table Floor Occupancy"
              value={`${metrics.occupiedTables} / ${metrics.totalTables}`}
              icon={Table2}
              subcaption={`${metrics.availableTables} tables available`}
              tone="blue"
            />
            <MetricCard
              label="Unpaid Orders"
              value={String(metrics.unpaidOrders)}
              icon={CreditCard}
              subcaption="Awaiting staff payment confirmation"
              tone={metrics.unpaidOrders > 0 ? "rose" : "zinc"}
            />
          </div>

          {/* Main 2-Column Section: Live Orders Activity + Table Floor Plan Mini-Map */}
          <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
            {/* Live Orders Stream */}
            <LiveOrdersPanel orders={liveOrders} />

            {/* Right Column: Table Floor Mini-Map & Quick Shortcuts */}
            <div className="space-y-6">
              {/* Floor Plan Mini-Map */}
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Table2 className="h-4 w-4 text-emerald-700" />
                    <h2 className="text-base font-bold text-zinc-950">Table Floor Plan</h2>
                  </div>
                  <Link
                    href="/dashboard/tables"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                  >
                    Manage <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-zinc-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Occupied
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-zinc-300" /> Free
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2.5 sm:grid-cols-6 lg:grid-cols-4">
                  {tables.length > 0 ? (
                    tables.map((table) => {
                      const isOccupied = table.status === "OCCUPIED" || table.status === "BILLING";
                      return (
                        <Link
                          key={table.id}
                          href="/dashboard/tables"
                          className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
                            isOccupied
                              ? "border-emerald-300 bg-emerald-50/60 shadow-sm hover:border-emerald-400"
                              : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300 hover:bg-white"
                          }`}
                        >
                          <span className={`text-xs font-black ${isOccupied ? "text-emerald-950" : "text-zinc-700"}`}>
                            T-{table.tableNumber}
                          </span>
                          <span className="mt-0.5 text-[10px] text-zinc-500">
                            {table.capacity} Pax
                          </span>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-4 text-center text-xs text-zinc-500">
                      No tables added yet. <Link href="/dashboard/tables" className="text-emerald-700 underline font-bold">Add tables</Link>
                    </div>
                  )}
                </div>
              </Card>

              {/* Quick Operational Links */}
              <Card className="p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-700" />
                  <h2 className="text-base font-bold text-zinc-950">Quick Navigation</h2>
                </div>

                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  <Link
                    href="/dashboard/orders"
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 text-xs font-bold text-zinc-800 transition hover:border-emerald-300 hover:bg-emerald-50/40"
                  >
                    <span className="flex items-center gap-2">
                      <ListOrdered className="h-4 w-4 text-emerald-700" /> Live Orders
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                  </Link>

                  <Link
                    href="/dashboard/menu"
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 text-xs font-bold text-zinc-800 transition hover:border-emerald-300 hover:bg-emerald-50/40"
                  >
                    <span className="flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-emerald-700" /> Digital Menu
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                  </Link>

                  <Link
                    href="/dashboard/kitchen"
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 text-xs font-bold text-zinc-800 transition hover:border-emerald-300 hover:bg-emerald-50/40"
                  >
                    <span className="flex items-center gap-2">
                      <ChefHat className="h-4 w-4 text-emerald-700" /> Kitchen Display
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                  </Link>

                  <Link
                    href="/dashboard/billing"
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 text-xs font-bold text-zinc-800 transition hover:border-emerald-300 hover:bg-emerald-50/40"
                  >
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-emerald-700" /> Subscription
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function LiveOrdersPanel({ orders }: { orders: LiveOrder[] }) {
  if (orders.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={ListOrdered}
          title="No active dine-in orders"
          description="Live table QR orders will appear here automatically with dish details as soon as guests place them."
        />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-950">Live Orders Feed</h2>
            <Badge tone="success" className="bg-emerald-100 text-emerald-800 font-bold">
              {orders.length} Active
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            Real-time table orders awaiting kitchen preparation or bill settlement.
          </p>
        </div>

        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
        >
          View Kanban <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href="/dashboard/orders"
            className="group block rounded-2xl border border-zinc-200/90 bg-zinc-50/60 p-4 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50/30"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-zinc-950">
                    #{order.orderNumber}
                  </span>
                  <span className="rounded-lg bg-zinc-200/80 px-2 py-0.5 text-xs font-bold text-zinc-800">
                    Table {order.tableNumber}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-zinc-500 font-medium">
                  <Clock className="h-3 w-3" />
                  {formatTime(order.createdAt)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    order.status === "PENDING"
                      ? "bg-amber-100 text-amber-800"
                      : order.status === "PREPARING"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {formatStatus(order.status)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    order.paymentStatus === "PAID"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {order.paymentStatus === "PAID" ? "Paid" : "Unpaid"}
                </span>
              </div>
            </div>

            {/* Ordered Dish Items */}
            <div className="mt-3 rounded-xl border border-zinc-200/60 bg-white p-3 space-y-1.5">
              {order.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-800">
                    {item.quantity}x {item.name}
                  </span>
                </div>
              ))}
              {order.items.length > 3 ? (
                <p className="text-[11px] font-semibold text-zinc-500">
                  +{order.items.length - 3} more items...
                </p>
              ) : null}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-zinc-200/60 pt-2.5">
              <span className="text-xs text-zinc-500">Total Bill</span>
              <span className="text-sm font-black text-zinc-950">
                {formatCurrency(order.total)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

async function getOverviewData(): Promise<{
  metrics: DashboardMetrics;
  liveOrders: LiveOrder[];
  tables: TableSummary[];
  role: string | null;
}> {
  if (!isSupabaseConfigured()) {
    return { metrics: emptyMetrics, liveOrders: [], tables: [], role: null };
  }

  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context) {
    return { metrics: emptyMetrics, liveOrders: [], tables: [], role: null };
  }

  const role = context.selected.memberRole;

  if (!hasPermission(role, "viewOverview")) {
    return { metrics: emptyMetrics, liveOrders: [], tables: [], role };
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
