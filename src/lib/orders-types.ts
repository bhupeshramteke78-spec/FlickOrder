import type { OrderStatus, PaymentStatus } from "@/lib/database.types";

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
