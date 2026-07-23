import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { SubscriptionLock } from "@/components/dashboard/subscription-lock";
import { TableManagementClient, type TableRow } from "@/components/dashboard/tables/table-management-client";
import { appUrl } from "@/lib/constants";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import { hasPermission } from "@/lib/permissions";
import { getSubscriptionAccessForCurrentUser, hasPlanFeature } from "@/lib/subscription-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function TablesPage() {
  const { tables, access, role, canManage } = await getTables();
  const canViewTables = hasPermission(role, "viewTables");

  return (
    <DashboardShell title="Table management" eyebrow="QR ordering" showClock>
      {!canViewTables ? (
        <PermissionLock description="Only owners and managers can view table management." />
      ) : (
      <>
      <SubscriptionLock access={access} feature="tableManagement" />
      <TableManagementClient tables={tables} canManage={canManage} />
      </>
      )}
    </DashboardShell>
  );
}

async function getTables(): Promise<{
  tables: TableRow[];
  access: Awaited<ReturnType<typeof getSubscriptionAccessForCurrentUser>>["access"];
  role: string | null;
  canManage: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { tables: [], access: null, role: null, canManage: false };
  }

  const supabase = await createClient();
  const accessResult = await getSubscriptionAccessForCurrentUser(supabase);
  const access = accessResult.access;
  const role = accessResult.membership?.role ?? null;
  const context = await getSelectedDashboardRestaurant(supabase);
  const canManage = hasPlanFeature(access, "tableManagement") && hasPermission(role, "manageTables");

  if (!context) {
    return { tables: [], access, role, canManage };
  }

  if (!hasPermission(context.selected.memberRole, "viewTables")) {
    return { tables: [], access, role: context.selected.memberRole, canManage: false };
  }

  const [{ data: restaurant }, { data: tables }, { data: activeOrders }] = await Promise.all([
    supabase.from("restaurants").select("slug").eq("id", context.selected.restaurantId).single(),
    supabase
      .from("tables")
      .select("id,table_number,seats,status")
      .eq("restaurant_id", context.selected.restaurantId)
      .order("table_number", { ascending: true }),
    supabase
      .from("orders")
      .select("table_id")
      .eq("restaurant_id", context.selected.restaurantId)
      .neq("payment_status", "PAID")
      .in("status", ["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED"]),
  ]);

  if (!restaurant || !tables) {
    return { tables: [], access, role, canManage };
  }

  const occupiedTableIds = new Set((activeOrders ?? []).map((order) => order.table_id));
  const reconciledTables = tables.map((table) => ({
    ...table,
    status: occupiedTableIds.has(table.id) ? "OCCUPIED" as const : "AVAILABLE" as const,
  }));
  const staleTables = reconciledTables.filter((table) => table.status !== tables.find((storedTable) => storedTable.id === table.id)?.status);
  const admin = createAdminClient();

  await Promise.all(
    staleTables.map((table) => (
      admin
        .from("tables")
        .update({ status: table.status })
        .eq("id", table.id)
        .eq("restaurant_id", context.selected.restaurantId)
    )),
  );

  return { tables: reconciledTables.map((table) => ({
    id: table.id,
    tableNumber: table.table_number,
    seats: table.seats,
    status: table.status,
    url: `${appUrl}/menu/${restaurant.slug}/table/${encodeURIComponent(table.table_number)}`,
  })), access, role, canManage };
}
