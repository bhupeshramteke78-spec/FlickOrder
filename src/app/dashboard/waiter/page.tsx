import { BellRing } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { EmptyState } from "@/components/ui/empty-state";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import { hasPermission } from "@/lib/permissions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function WaiterPage() {
  const role = await getDashboardRole();
  const canViewWaiter = hasPermission(role, "viewWaiter");

  return (
    <DashboardShell title="Waiter panel" eyebrow="Service and serving">
      {!canViewWaiter ? (
        <PermissionLock description="Only owners, managers, and waiters can view the waiter panel." />
      ) : (
        <EmptyState icon={BellRing} title="No waiter requests" description="Water, tissue, spoon, fork, bill, waiter, ready-order serving, and payment verification requests appear here live." />
      )}
    </DashboardShell>
  );
}

async function getDashboardRole() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  return context?.selected.memberRole ?? null;
}
