import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { OrderHistoryExplorer, type OrderHistoryExplorerRow } from "@/components/dashboard/orders/order-history-explorer";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { SubscriptionLock } from "@/components/dashboard/subscription-lock";
import { getDashboardOrders, getOrderCustomerName } from "@/lib/dashboard-orders";
import { hasPermission } from "@/lib/permissions";
import { getSubscriptionAccessForCurrentUser, hasPlanFeature } from "@/lib/subscription-access";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function OrderHistoryPage() {
  const { access, role } = await getOrderHistoryAccess();
  const canViewOrderHistory = hasPermission(role, "viewOrderHistory");
  const canUseOrderHistory = hasPlanFeature(access, "orderHistory");
  const canUseAdvancedSearch = hasPlanFeature(access, "orderHistorySearch");
  const orders = canViewOrderHistory && canUseOrderHistory ? await getDashboardOrders() : [];
  const historyOrders: OrderHistoryExplorerRow[] = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    tableNumber: order.tableNumber,
    customerName: getOrderCustomerName(order),
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total,
    createdAt: order.createdAt,
    items: order.items,
  }));

  return (
    <DashboardShell title="Order history" eyebrow="Searchable records">
      {!canViewOrderHistory ? (
        <PermissionLock description="Only owners and managers can view order history." />
      ) : (
      <>
      <SubscriptionLock access={access} feature="orderHistory" />
      {canUseOrderHistory ? <OrderHistoryExplorer orders={historyOrders} canUseAdvancedSearch={canUseAdvancedSearch} /> : null}
      </>
      )}
    </DashboardShell>
  );
}

async function getOrderHistoryAccess() {
  if (!isSupabaseConfigured()) {
    return { access: null, role: null };
  }

  const supabase = await createClient();
  const { access, membership } = await getSubscriptionAccessForCurrentUser(supabase);

  return { access, role: membership?.role ?? null };
}
