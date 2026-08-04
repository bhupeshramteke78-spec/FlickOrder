import type { MemberRole } from "@/lib/database.types";

export type Permission =
  | "viewOverview"
  | "viewOrders"
  | "acceptOrders"
  | "prepareOrders"
  | "serveOrders"
  | "confirmPayments"
  | "viewOrderHistory"
  | "viewMenu"
  | "manageMenu"
  | "viewTables"
  | "manageTables"
  | "viewAnalytics"
  | "viewSettings"
  | "manageSettings"
  | "viewBilling"
  | "manageBilling"
  | "viewKitchen"
  | "viewWaiter"
  | "viewBookings"
  | "manageBookings";

const rolePermissions: Record<MemberRole, Permission[]> = {
  OWNER: [
    "viewOverview",
    "viewOrders",
    "acceptOrders",
    "prepareOrders",
    "serveOrders",
    "confirmPayments",
    "viewOrderHistory",
    "viewMenu",
    "manageMenu",
    "viewTables",
    "manageTables",
    "viewAnalytics",
    "viewSettings",
    "manageSettings",
    "viewBilling",
    "manageBilling",
    "viewKitchen",
    "viewWaiter",
    "viewBookings",
    "manageBookings",
  ],
  MANAGER: [
    "viewOverview",
    "viewOrders",
    "acceptOrders",
    "prepareOrders",
    "serveOrders",
    "confirmPayments",
    "viewOrderHistory",
    "viewMenu",
    "manageMenu",
    "viewTables",
    "manageTables",
    "viewAnalytics",
    "viewSettings",
    "manageSettings",
    "viewKitchen",
    "viewWaiter",
    "viewBookings",
    "manageBookings",
  ],
  KITCHEN: ["viewOrders", "prepareOrders", "viewKitchen"],
  WAITER: ["viewOrders", "serveOrders", "viewWaiter", "viewBookings", "manageBookings"],
};

export function hasPermission(role: string | null | undefined, permission: Permission) {
  return isMemberRole(role) && rolePermissions[role].includes(permission);
}

export function hasAnyPermission(role: string | null | undefined, permissions: Permission[]) {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function getAllowedOrderStatuses(role: string | null | undefined) {
  if (hasPermission(role, "acceptOrders") && hasPermission(role, "confirmPayments")) {
    return ["PENDING", "SERVED"] as const;
  }

  if (hasPermission(role, "prepareOrders")) {
    return ["ACCEPTED", "PREPARING"] as const;
  }

  if (hasPermission(role, "serveOrders")) {
    return ["READY"] as const;
  }

  return [] as const;
}

export function isMemberRole(role: string | null | undefined): role is MemberRole {
  return role === "OWNER" || role === "MANAGER" || role === "KITCHEN" || role === "WAITER";
}
