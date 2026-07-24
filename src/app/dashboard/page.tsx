import { ChefHat, Clock, CreditCard, IndianRupee, ListOrdered, Table2, Timer } from "lucide-react";
import Link from "next/link";
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

const emptyMetrics: DashboardMetrics = {
  todaysRevenue: 0,
  todaysOrders: 0,
  preparingOrders: 0,
  unpaidOrders: 0,
  availableTables: 0,
  occupiedTables: 0,
  subscriptionPlan: null,
  subscriptionStatus: null,
  trialEndsAt: null,
};

export default async function DashboardPage() {
  const { metrics, liveOrders, role } = await getOverviewData();
  const trial = getTrialStatus(metrics.trialEndsAt);
  const shouldShowTrialBadge = metrics.subscriptionPlan === "trial" || metrics.subscriptionStatus === "TRIALING";

  return (
    <DashboardShell title="Operations overview" eyebrow="Owner dashboard" showClock>
      {!hasPermission(role, "viewOverview") ? (
        <PermissionLock description="Kitchen and waiter roles should use their assigned order screens." />
      ) : (
      <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {shouldShowTrialBadge ? <Badge tone="danger">Trial {trial.label}</Badge> : null}
        <Link href="/dashboard/menu"><Button size="sm">Add item</Button></Link>
        <Link href="/dashboard/tables"><Button size="sm" variant="secondary" className="border-zinc-950">Add table</Button></Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Today's revenue" value={formatCurrency(metrics.todaysRevenue)} icon={IndianRupee} />
        <MetricCard label="Today's orders" value={String(metrics.todaysOrders)} icon={ListOrdered} />
        <MetricCard label="Preparing" value={String(metrics.preparingOrders)} icon={ChefHat} />
        <MetricCard label="Unpaid" value={String(metrics.unpaidOrders)} icon={CreditCard} />
        <MetricCard label="Available tables" value={String(metrics.availableTables)} icon={Table2} />
        <MetricCard label="Occupied tables" value={String(metrics.occupiedTables)} icon={Timer} />
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_0.72fr]">
        <LiveOrdersPanel orders={liveOrders} />
        <Card>
          <h2 className="text-lg font-semibold text-zinc-950">Quick actions</h2>
          <div className="mt-4 grid gap-3">
            {[
              ["/dashboard/orders", "Open orders"],
              ["/dashboard/tables", "Tables"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 transition hover:border-emerald-200 hover:bg-emerald-50">
                {label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
      </>
      )}
    </DashboardShell>
  );
}

function LiveOrdersPanel({ orders }: { orders: LiveOrder[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={ListOrdered}
        title="No active orders"
        description="New table QR orders will appear here as soon as customers place them."
      />
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">Live orders</h2>
          <p className="mt-1 text-sm text-zinc-500">Latest active table orders that still need service or payment.</p>
        </div>
        <Badge tone="success">{orders.length} active</Badge>
      </div>

      <div className="mt-4 grid gap-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href="/dashboard/orders"
            className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/70"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-950">#{order.orderNumber}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-500">
                  <Table2 className="h-3.5 w-3.5" />
                  Table {order.tableNumber}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Badge tone={order.status === "PENDING" ? "warning" : "success"}>{formatStatus(order.status)}</Badge>
                <Badge tone={order.paymentStatus === "PAID" ? "success" : "warning"}>
                  {formatStatus(order.paymentStatus)}
                </Badge>
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              {order.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex justify-between gap-3 rounded-md bg-white px-3 py-2 text-xs">
                  <span className="font-medium text-zinc-800">{item.quantity} x {item.name}</span>
                </div>
              ))}
              {order.items.length > 3 ? (
                <p className="text-xs font-medium text-zinc-500">+{order.items.length - 3} more item{order.items.length - 3 === 1 ? "" : "s"}</p>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-3 text-xs text-zinc-500">
              <span className="font-semibold text-zinc-950">{formatCurrency(order.total)}</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(order.createdAt)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

async function getOverviewData(): Promise<{ metrics: DashboardMetrics; liveOrders: LiveOrder[]; role: string | null }> {
  if (!isSupabaseConfigured()) {
    return { metrics: emptyMetrics, liveOrders: [], role: null };
  }

  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context) {
    return { metrics: emptyMetrics, liveOrders: [], role: null };
  }

  const role = context.selected.memberRole;

  if (!hasPermission(role, "viewOverview")) {
    return { metrics: emptyMetrics, liveOrders: [], role };
  }

  const restaurantId = context.selected.restaurantId;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    paidOrders,
    todaysOrders,
    preparingOrders,
    unpaidOrders,
    availableTables,
    occupiedTables,
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
      .eq("status", "PREPARING"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .eq("payment_status", "UNPAID"),
    supabase
      .from("tables")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .eq("status", "AVAILABLE"),
    supabase
      .from("tables")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .eq("status", "OCCUPIED"),
    supabase
      .from("subscriptions")
      .select("plan,status,trial_ends_at")
      .eq("restaurant_id", restaurantId)
      .maybeSingle(),
    getLiveOrdersForRestaurant(supabase, restaurantId),
  ]);

  return {
    role,
    liveOrders,
    metrics: {
      todaysRevenue: paidOrders.data?.reduce((sum, order) => sum + Number(order.total), 0) ?? 0,
      todaysOrders: todaysOrders.count ?? 0,
      preparingOrders: preparingOrders.count ?? 0,
      unpaidOrders: unpaidOrders.count ?? 0,
      availableTables: availableTables.count ?? 0,
      occupiedTables: occupiedTables.count ?? 0,
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
    .in("status", ["PENDING", "ACCEPTED", "SERVED"])
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
  }).format(new Date(value));
}
