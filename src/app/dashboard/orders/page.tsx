import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LiveOrdersClient } from "@/components/dashboard/orders/live-orders-client";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { SubscriptionLock } from "@/components/dashboard/subscription-lock";
import { getDashboardOrders } from "@/lib/dashboard-orders";
import { hasPermission } from "@/lib/permissions";
import { getSubscriptionAccessForCurrentUser, hasPlanFeature } from "@/lib/subscription-access";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function OrdersPage() {
  const { access, memberRole } = await getOrdersAccess();
  const canViewOrders = hasPermission(memberRole, "viewOrders");
  const orders = canViewOrders ? await getDashboardOrders() : [];
  const canUseLiveOrders = hasPlanFeature(access, "liveOrders");
  const canAcceptOrders = canUseLiveOrders && hasPermission(memberRole, "acceptOrders");
  const canConfirmPayments = canUseLiveOrders && hasPermission(memberRole, "confirmPayments");
  const canPrepareOrders = hasPermission(memberRole, "prepareOrders");
  const canServeOrders = hasPermission(memberRole, "serveOrders");

  return (
    <DashboardShell title="Live Orders Kanban" eyebrow="Real-time Stream" showClock>
      {!canViewOrders ? (
        <PermissionLock description="This staff role cannot view the orders control desk." />
      ) : (
        <div className="space-y-6">
          <SubscriptionLock access={access} feature="liveOrders" />

          <LiveOrdersClient
            orders={orders}
            canAcceptOrders={canAcceptOrders}
            canConfirmPayments={canConfirmPayments}
            canPrepareOrders={canPrepareOrders}
            canServeOrders={canServeOrders}
          />
        </div>
      )}
    </DashboardShell>
  );
}

async function getOrdersAccess() {
  if (!isSupabaseConfigured()) {
    return { access: null, memberRole: "guest" };
  }

  const supabase = await createClient();
  const { access, membership } = await getSubscriptionAccessForCurrentUser(supabase);

  return {
    access,
    memberRole: membership?.role ?? "guest",
  };
}
