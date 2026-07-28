import Link from "next/link";
import { cookies } from "next/headers";
import { ShieldCheck } from "lucide-react";
import {
  SuperAdminControlPanel,
  type SuperAdminAuditLog,
  type SuperAdminCustomer,
  type SuperAdminDashboardData,
  type SuperAdminOrder,
  type SuperAdminRestaurant,
  type SuperAdminSubscriptionRequest,
} from "@/components/admin/super-admin-control-panel";
import { SuperAdminUnlockForm } from "@/components/admin/super-admin-unlock-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getSuperAdminContext, SUPER_ADMIN_UNLOCK_COOKIE, verifySuperAdminUnlockToken } from "@/lib/super-admin";

export default async function AdminPage() {
  const access = await getSuperAdminPageAccess();

  if (!access) {
    return <SuperAdminRestricted />;
  }

  if (!access.isUnlocked) {
    return <SuperAdminUnlockForm adminName={access.adminName} />;
  }

  const data = await getSuperAdminDashboardData(access.adminName);

  return <SuperAdminControlPanel data={data} />;
}

function SuperAdminRestricted() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#071117] px-5 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,102,0,0.22),transparent_30%),radial-gradient(circle_at_78%_20%,rgba(16,185,129,0.2),transparent_34%)]" />
      <Card className="relative max-w-3xl overflow-hidden border-white/10 bg-white/[0.05] p-0 text-white shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="p-8 text-center sm:p-10">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-200">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-orange-200">Protected platform route</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Super admin access required</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-300">
            This console is reserved for SUPER_ADMIN profiles. Sign in with the correct account before verifying
            subscription payments, managing plans, searching records, or inspecting audit logs.
          </p>
          <Link href="/auth/owner?mode=login" className="mt-7 inline-flex">
            <Button type="button" variant="glass">Sign in securely</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}

async function getSuperAdminPageAccess() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const superAdmin = await getSuperAdminContext(supabase);

  if (!superAdmin) {
    return null;
  }

  const cookieStore = await cookies();
  const unlockToken = cookieStore.get(SUPER_ADMIN_UNLOCK_COOKIE)?.value;

  return {
    adminName: superAdmin.fullName,
    isUnlocked: verifySuperAdminUnlockToken(unlockToken, superAdmin.userId),
  };
}

async function getSuperAdminDashboardData(adminName: string): Promise<SuperAdminDashboardData> {
  const admin = createAdminClient();
  const [
    requests,
    restaurants,
    customers,
    orders,
    auditLogs,
  ] = await Promise.all([
    getSubscriptionUpgradeRequests(admin),
    getRestaurants(admin),
    getCustomers(admin),
    getOrders(admin),
    getAuditLogs(admin),
  ]);

  return {
    adminName,
    requests,
    restaurants,
    customers,
    orders,
    auditLogs,
  };
}

async function getSubscriptionUpgradeRequests(admin: ReturnType<typeof createAdminClient>): Promise<SuperAdminSubscriptionRequest[]> {
  const { data: requests } = await admin
    .from("subscription_upgrade_requests")
    .select("id,restaurant_id,requested_by,plan,amount,status,transaction_note,transaction_id,payment_submitted_at,created_at")
    .eq("status", "VERIFICATION_PENDING")
    .order("created_at", { ascending: true })
    .limit(50);

  if (!requests || requests.length === 0) {
    return [];
  }

  const restaurantIds = Array.from(new Set(requests.map((request) => request.restaurant_id)));
  const profileIds = Array.from(
    new Set(requests.map((request) => request.requested_by).filter((profileId): profileId is string => Boolean(profileId))),
  );
  const [{ data: restaurants }, { data: profiles }] = await Promise.all([
    admin.from("restaurants").select("id,name").in("id", restaurantIds),
    profileIds.length > 0
      ? admin.from("profiles").select("id,full_name").in("id", profileIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string }> }),
  ]);

  const restaurantById = new Map((restaurants ?? []).map((restaurant) => [restaurant.id, restaurant.name]));
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));

  return requests.map((request) => ({
    id: request.id,
    restaurantName: restaurantById.get(request.restaurant_id) ?? "Restaurant",
    ownerName: request.requested_by ? profileById.get(request.requested_by) ?? "Owner" : "Owner",
    plan: request.plan,
    amount: Number(request.amount),
    status: request.status,
    transactionNote: request.transaction_note,
    transactionId: request.transaction_id,
    paymentSubmittedAt: request.payment_submitted_at,
    createdAt: request.created_at,
  }));
}

async function getRestaurants(admin: ReturnType<typeof createAdminClient>): Promise<SuperAdminRestaurant[]> {
  const [{ data: restaurants }, { data: subscriptions }] = await Promise.all([
    admin
      .from("restaurants")
      .select("id,owner_id,name,email,phone,city,state,address,fssai_number,google_maps_url,verification_status,verification_note,deletion_requested_at,deletion_reason,deleted_at,created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    admin
      .from("subscriptions")
      .select("restaurant_id,plan,status")
      .limit(500),
  ]);

  if (!restaurants || restaurants.length === 0) {
    return [];
  }

  const ownerIds = Array.from(new Set(restaurants.map((restaurant) => restaurant.owner_id)));
  const restaurantIds = restaurants.map((restaurant) => restaurant.id);
  const [{ data: owners }, { data: documents }] = await Promise.all([
    admin.from("profiles").select("id,full_name").in("id", ownerIds),
    admin.from("restaurant_verification_documents").select("id,restaurant_id,document_type,file_url").in("restaurant_id", restaurantIds),
  ]);
  const ownerById = new Map((owners ?? []).map((owner) => [owner.id, owner.full_name]));
  const subscriptionByRestaurantId = new Map((subscriptions ?? []).map((subscription) => [subscription.restaurant_id, subscription]));
  const documentsByRestaurantId = new Map<string, Array<{ id: string; type: string; url: string }>>();

  const securedDocuments = await Promise.all(
    (documents ?? []).map(async (document) => {
      if (/^https?:\/\//i.test(document.file_url)) {
        return { ...document, resolvedUrl: document.file_url };
      }

      const { data } = await admin.storage
        .from("restaurant-verification")
        .createSignedUrl(document.file_url, 10 * 60);

      return { ...document, resolvedUrl: data?.signedUrl ?? "" };
    }),
  );

  for (const document of securedDocuments) {
    const list = documentsByRestaurantId.get(document.restaurant_id) ?? [];
    if (document.resolvedUrl) {
      list.push({ id: document.id, type: document.document_type, url: document.resolvedUrl });
    }
    documentsByRestaurantId.set(document.restaurant_id, list);
  }

  return restaurants.map((restaurant) => {
    const subscription = subscriptionByRestaurantId.get(restaurant.id);

    return {
      id: restaurant.id,
      name: restaurant.name,
      ownerName: ownerById.get(restaurant.owner_id) ?? "Owner",
      email: restaurant.email,
      phone: restaurant.phone,
      city: restaurant.city,
      state: restaurant.state,
      address: restaurant.address,
      fssaiNumber: restaurant.fssai_number,
      googleMapsUrl: restaurant.google_maps_url,
      verificationStatus: restaurant.verification_status,
      verificationNote: restaurant.verification_note,
      deletionRequestedAt: restaurant.deletion_requested_at,
      deletionReason: restaurant.deletion_reason,
      deletedAt: restaurant.deleted_at,
      documents: documentsByRestaurantId.get(restaurant.id) ?? [],
      plan: subscription?.plan ?? "trial",
      status: subscription?.status ?? "TRIALING",
      createdAt: restaurant.created_at,
    };
  });
}

async function getCustomers(admin: ReturnType<typeof createAdminClient>): Promise<SuperAdminCustomer[]> {
  const { data: customers } = await admin
    .from("profiles")
    .select("id,full_name,phone,created_at")
    .eq("role", "CUSTOMER")
    .order("created_at", { ascending: false })
    .limit(200);

  return (customers ?? []).map((customer) => ({
    id: customer.id,
    name: customer.full_name,
    phone: customer.phone,
    createdAt: customer.created_at,
  }));
}

async function getOrders(admin: ReturnType<typeof createAdminClient>): Promise<SuperAdminOrder[]> {
  const { data: orders } = await admin
    .from("orders")
    .select("id,restaurant_id,table_id,order_number,customer_name,status,payment_status,total,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!orders || orders.length === 0) {
    return [];
  }

  const restaurantIds = Array.from(new Set(orders.map((order) => order.restaurant_id)));
  const tableIds = Array.from(new Set(orders.map((order) => order.table_id)));
  const orderIds = orders.map((order) => order.id);
  const [{ data: restaurants }, { data: tables }, { data: items }] = await Promise.all([
    admin.from("restaurants").select("id,name").in("id", restaurantIds),
    admin.from("tables").select("id,table_number").in("id", tableIds),
    admin.from("order_items").select("order_id,name_snapshot,quantity").in("order_id", orderIds),
  ]);

  const restaurantById = new Map((restaurants ?? []).map((restaurant) => [restaurant.id, restaurant.name]));
  const tableById = new Map((tables ?? []).map((table) => [table.id, table.table_number]));
  const itemsByOrderId = new Map<string, string[]>();

  for (const item of items ?? []) {
    const list = itemsByOrderId.get(item.order_id) ?? [];
    list.push(`${item.quantity} x ${item.name_snapshot}`);
    itemsByOrderId.set(item.order_id, list);
  }

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    restaurantName: restaurantById.get(order.restaurant_id) ?? "Restaurant",
    customerName: order.customer_name ?? "Customer",
    tableNumber: tableById.get(order.table_id) ?? "Unknown",
    status: order.status,
    paymentStatus: order.payment_status,
    total: Number(order.total),
    createdAt: order.created_at,
    itemSummary: (itemsByOrderId.get(order.id) ?? ["No items"]).slice(0, 3).join(", "),
  }));
}

async function getAuditLogs(admin: ReturnType<typeof createAdminClient>): Promise<SuperAdminAuditLog[]> {
  const { data: logs } = await admin
    .from("audit_logs")
    .select("id,actor_id,restaurant_id,action,entity,entity_id,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (!logs || logs.length === 0) {
    return [];
  }

  const actorIds = Array.from(new Set(logs.map((log) => log.actor_id).filter((actorId): actorId is string => Boolean(actorId))));
  const restaurantIds = Array.from(new Set(logs.map((log) => log.restaurant_id).filter((restaurantId): restaurantId is string => Boolean(restaurantId))));
  const [{ data: actors }, { data: restaurants }] = await Promise.all([
    actorIds.length > 0
      ? admin.from("profiles").select("id,full_name").in("id", actorIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string }> }),
    restaurantIds.length > 0
      ? admin.from("restaurants").select("id,name").in("id", restaurantIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
  ]);

  const actorById = new Map((actors ?? []).map((actor) => [actor.id, actor.full_name]));
  const restaurantById = new Map((restaurants ?? []).map((restaurant) => [restaurant.id, restaurant.name]));

  return logs.map((log) => ({
    id: log.id,
    actorName: log.actor_id ? actorById.get(log.actor_id) ?? "Unknown admin" : "System",
    restaurantName: log.restaurant_id ? restaurantById.get(log.restaurant_id) ?? "Restaurant" : null,
    action: log.action,
    entity: log.entity,
    entityId: log.entity_id,
    createdAt: log.created_at,
  }));
}
