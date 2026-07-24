import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MenuManagementClient, type MenuItemRow } from "@/components/dashboard/menu/menu-management-client";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { SubscriptionLock } from "@/components/dashboard/subscription-lock";
import { hasPermission } from "@/lib/permissions";
import { getSubscriptionAccessForCurrentUser, hasPlanFeature } from "@/lib/subscription-access";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function MenuManagementPage() {
  const { access, role, items, canManage } = await getMenuData();
  const canViewMenu = hasPermission(role, "viewMenu");

  return (
    <DashboardShell title="Menu management" eyebrow="Professional item controls" showClock>
      {!canViewMenu ? (
        <PermissionLock description="Only owners and managers can view menu management." />
      ) : (
      <>
      <SubscriptionLock access={access} feature="menuManagement" />
      <MenuManagementClient items={items} canManage={canManage} />
      </>
      )}
    </DashboardShell>
  );
}

async function getMenuData(): Promise<{
  access: Awaited<ReturnType<typeof getSubscriptionAccessForCurrentUser>>["access"];
  role: string | null;
  items: MenuItemRow[];
  canManage: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { access: null, role: null, items: [], canManage: false };
  }

  const supabase = await createClient();
  const { access, membership } = await getSubscriptionAccessForCurrentUser(supabase);
  const role = membership?.role ?? null;
  const canManage = hasPlanFeature(access, "menuManagement") && hasPermission(role, "manageMenu");

  if (!membership || !hasPermission(role, "viewMenu")) {
    return { access, role, items: [], canManage: false };
  }

  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("id,name,description,price,offer_price,preparation_time_minutes,food_type,is_available,is_sold_out,is_popular,category_id,created_at")
    .eq("restaurant_id", membership.restaurant_id)
    .order("created_at", { ascending: false });

  if (!menuItems || menuItems.length === 0) {
    return { access, role, items: [], canManage };
  }

  const categoryIds = Array.from(new Set(menuItems.map((item) => item.category_id)));
  const { data: categories } = await supabase
    .from("categories")
    .select("id,name")
    .in("id", categoryIds);
  const categoriesById = new Map((categories ?? []).map((category) => [category.id, category.name]));

  return { access, role, items: menuItems.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    category: categoriesById.get(item.category_id) ?? "Uncategorized",
    price: Number(item.price),
    offerPrice: item.offer_price === null ? null : Number(item.offer_price),
    preparationTimeMinutes: item.preparation_time_minutes,
    foodType: item.food_type,
    isAvailable: item.is_available,
    isSoldOut: item.is_sold_out,
    isPopular: item.is_popular,
  })), canManage };
}
