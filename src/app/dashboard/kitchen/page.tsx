import { ChefHat } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { EmptyState } from "@/components/ui/empty-state";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import { hasPermission } from "@/lib/permissions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function KitchenPage() {
  const role = await getDashboardRole();
  const canViewKitchen = hasPermission(role, "viewKitchen");

  return (
    <DashboardShell title="Kitchen display" eyebrow="Accepted, preparing, ready">
      {!canViewKitchen ? (
        <PermissionLock description="Only owners, managers, and kitchen staff can view the kitchen display." />
      ) : (
        <EmptyState icon={ChefHat} title="No kitchen tickets" description="Realtime tickets and notification sound hooks are reserved for accepted, preparing, and ready orders only." />
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
