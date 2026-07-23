import type { OrderStatus, PaymentStatus } from "@/lib/database.types";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type DashboardOrder = {
  id: string;
  orderNumber: string;
  tableNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  guestCount: number;
  customerName: string | null;
  kitchenNotes: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    options: string[];
  }>;
  payment: {
    id: string;
    method: string;
    status: PaymentStatus;
  } | null;
};

export async function getDashboardOrders(): Promise<DashboardOrder[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context) {
    return [];
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id,order_number,table_id,status,payment_status,total,guest_count,customer_name,kitchen_notes,created_at")
    .eq("restaurant_id", context.selected.restaurantId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!orders || orders.length === 0) {
    return [];
  }

  const orderIds = orders.map((order) => order.id);
  const tableIds = Array.from(new Set(orders.map((order) => order.table_id)));
  const [{ data: orderItems }, { data: tables }, { data: payments }] = await Promise.all([
    supabase
      .from("order_items")
      .select("id,order_id,name_snapshot,quantity,options")
      .in("order_id", orderIds),
    supabase
      .from("tables")
      .select("id,table_number")
      .in("id", tableIds),
    supabase
      .from("payments")
      .select("id,order_id,method,status,created_at")
      .in("order_id", orderIds)
      .order("created_at", { ascending: false }),
  ]);

  const tableById = new Map((tables ?? []).map((table) => [table.id, table.table_number]));
  const itemsByOrderId = new Map<string, DashboardOrder["items"]>();
  const paymentByOrderId = new Map<string, DashboardOrder["payment"]>();

  for (const item of orderItems ?? []) {
    const existingItems = itemsByOrderId.get(item.order_id) ?? [];
    existingItems.push({
      id: item.id,
      name: item.name_snapshot,
      quantity: item.quantity,
      options: item.options ?? [],
    });
    itemsByOrderId.set(item.order_id, existingItems);
  }

  for (const payment of payments ?? []) {
    if (!paymentByOrderId.has(payment.order_id)) {
      paymentByOrderId.set(payment.order_id, {
        id: payment.id,
        method: payment.method,
        status: payment.status,
      });
    }
  }

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    tableNumber: tableById.get(order.table_id) ?? "Unknown",
    status: order.status,
    paymentStatus: order.payment_status,
    total: Number(order.total),
    guestCount: order.guest_count,
    customerName: order.customer_name,
    kitchenNotes: order.kitchen_notes,
    createdAt: order.created_at,
    items: itemsByOrderId.get(order.id) ?? [],
    payment: paymentByOrderId.get(order.id) ?? null,
  }));
}

export function getOrderCustomerName(order: Pick<DashboardOrder, "customerName" | "kitchenNotes">) {
  if (order.customerName?.trim()) {
    return order.customerName.trim();
  }

  if (!order.kitchenNotes) {
    return "Customer";
  }

  const customerLine = order.kitchenNotes.split("\n").find((line) => line.toLowerCase().startsWith("customer:"));

  return customerLine?.replace(/^customer:\s*/i, "").trim() || "Customer";
}
