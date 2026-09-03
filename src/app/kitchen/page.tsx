import { StaffPinKiosk } from "@/components/staff/staff-pin-kiosk";
import { KitchenKioskView } from "@/components/staff/kitchen-kiosk-view";
import { getStaffSessionFromCookie } from "@/lib/staff-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function KitchenPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug } = await searchParams;
  const staffSession = await getStaffSessionFromCookie("chef");

  if (staffSession && (!slug || staffSession.restaurantSlug === slug)) {
    const orders = await getKitchenOrders(staffSession.restaurantId);
    return (
      <KitchenKioskView
        orders={orders}
        restaurantName={staffSession.restaurantName}
        restaurantSlug={staffSession.restaurantSlug}
        restaurantId={staffSession.restaurantId}
      />
    );
  }

  // If no session or different slug, find restaurant for PIN login
  const restaurant = await getTargetRestaurant(slug);

  if (!restaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090D10] p-4 text-center text-white">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Restaurant Not Found</h1>
          <p className="mt-1 text-xs text-zinc-400">Please scan the Kitchen QR code provided in your restaurant dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <StaffPinKiosk
      role="chef"
      restaurantSlug={restaurant.slug}
      restaurantName={restaurant.name}
    />
  );
}

async function getTargetRestaurant(slug?: string) {
  if (!isSupabaseConfigured()) return null;
  const admin = createAdminClient();

  if (slug) {
    const { data } = await admin.from("restaurants").select("id, name, slug").eq("slug", slug).maybeSingle();
    return data;
  }

  // Fallback to first active restaurant
  const { data } = await admin.from("restaurants").select("id, name, slug").is("deleted_at", null).limit(1).maybeSingle();
  return data;
}

async function getKitchenOrders(restaurantId: string) {
  if (!isSupabaseConfigured()) return [];
  const admin = createAdminClient();

  const { data: orders } = await admin
    .from("orders")
    .select("id, order_number, table_id, customer_name, status, payment_status, total, created_at, kitchen_notes, guest_count")
    .eq("restaurant_id", restaurantId)
    .in("status", ["ACCEPTED", "PREPARING"])
    .neq("payment_status", "PAID")
    .order("created_at", { ascending: true });

  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map((o) => o.id);
  const tableIds = Array.from(new Set(orders.map((o) => o.table_id)));

  const [{ data: items }, { data: tables }] = await Promise.all([
    admin.from("order_items").select("id, order_id, name_snapshot, quantity, options").in("order_id", orderIds),
    admin.from("tables").select("id, table_number").in("id", tableIds),
  ]);

  const tableMap = new Map((tables ?? []).map((t) => [t.id, t.table_number]));
  const itemsByOrder = new Map<string, Array<{ id: string; name: string; quantity: number; options: string[] }>>();

  for (const item of items ?? []) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push({
      id: item.id,
      name: item.name_snapshot,
      quantity: item.quantity,
      options: (item.options as string[]) ?? [],
    });
    itemsByOrder.set(item.order_id, list);
  }

  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    tableNumber: tableMap.get(o.table_id) ?? "1",
    customerName: o.customer_name ?? "Guest",
    guestCount: o.guest_count ?? 1,
    status: o.status,
    paymentStatus: o.payment_status,
    total: Number(o.total),
    kitchenNotes: o.kitchen_notes,
    createdAt: o.created_at,
    items: itemsByOrder.get(o.id) ?? [],
    payment: null,
  }));
}
