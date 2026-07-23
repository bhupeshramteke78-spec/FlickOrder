import type { Role } from "@/lib/database.types";

export const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const roles: Role[] = [
  "CUSTOMER",
  "OWNER",
  "MANAGER",
  "KITCHEN",
  "WAITER",
  "SUPER_ADMIN",
];

export const foodStatuses = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "SERVED",
  "COMPLETED",
  "CANCELLED",
] as const;

export const paymentMethods = ["UPI", "CASH", "CARD_MACHINE"] as const;

export const subscriptionPlans = [
  { key: "basic", name: "Basic", price: 299, description: "QR ordering and core operations" },
  { key: "growth", name: "Growth", price: 799, description: "Realtime kitchen, staff, and analytics" },
  { key: "pro", name: "Pro", price: 1499, description: "Advanced controls for scaling restaurants" },
] as const;
