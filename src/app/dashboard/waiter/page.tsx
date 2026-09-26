import Link from "next/link";
import {
  BellRing,
  CheckCircle2,
  Clock,
  ExternalLink,
  QrCode,
  UserPlus,
  Users,
  Utensils,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { WorkflowOrderCard } from "@/components/dashboard/orders/workflow-order-card";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboardOrders } from "@/lib/dashboard-orders";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import { hasPermission } from "@/lib/permissions";
import { getSubscriptionAccessForCurrentUser, hasPlanFeature } from "@/lib/subscription-access";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type WaiterStaffMember = {
  id: string;
  name: string;
  phone: string | null;
  role: string;
  createdAt: string;
};

export default async function WaiterPage() {
  const { role, canUseLiveOrders, restaurantSlug } = await getWaiterAccess();
  const canViewWaiter = hasPermission(role, "viewWaiter");
  const canServe = canUseLiveOrders && hasPermission(role, "serveOrders");
  const orders = canViewWaiter ? await getDashboardOrders() : [];
  const readyOrders = orders.filter((order) => order.status === "READY" && order.paymentStatus !== "PAID");
  const staffMembers = canViewWaiter ? await getWaiterStaff() : [];

  return (
    <DashboardShell title="Waiter Operations" eyebrow="Prepared table orders and floor service">
      {!canViewWaiter ? (
        <PermissionLock description="Only owners, managers, and waiters can view the waiter panel." />
      ) : (
        <div className="space-y-8">
          {/* Top Info & Quick Actions Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <BellRing className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-zinc-950">Prepared Dishes Ready to Serve</h2>
                  <p className="text-xs text-zinc-500 font-medium">Orders completed by kitchen waiting for table delivery</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {restaurantSlug && (
                <Link
                  href={`/waiter?slug=${restaurantSlug}`}
                  target="_blank"
                  prefetch={false}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition"
                >
                  <QrCode className="h-3.5 w-3.5 text-rose-600" />
                  <span>Open Floor Waiter Kiosk</span>
                  <ExternalLink className="h-3 w-3 text-zinc-400" />
                </Link>
              )}
              <Link href="/dashboard/settings" prefetch={false}>
                <Button
                  size="sm"
                  className="h-9 gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Manage Staff
                </Button>
              </Link>
            </div>
          </div>

          {/* Section 1: Ready to Serve Live Queue */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-rose-600" />
                <h3 className="text-base font-black text-zinc-950">Tickets Ready for Table Delivery</h3>
              </div>
              <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700">
                {readyOrders.length} {readyOrders.length === 1 ? "Ticket" : "Tickets"}
              </span>
            </div>

            {readyOrders.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {readyOrders.map((order) => (
                  <WorkflowOrderCard key={order.id} order={order} stage="waiter" canServe={canServe} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-zinc-200/80 bg-white p-10 text-center shadow-xs">
                <EmptyState
                  icon={CheckCircle2}
                  title="All caught up! No dishes waiting for pickup"
                  description="When the kitchen marks prepared tickets as ready, they will appear here instantly for floor staff to serve."
                />
              </div>
            )}
          </section>

          {/* Section 2: Real Waiter Staff Members */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-zinc-700" />
                <h3 className="text-base font-black text-zinc-950">Floor Waiter Team ({staffMembers.length})</h3>
              </div>
              <p className="text-xs text-zinc-500 font-medium">Real registered waiters for this outlet</p>
            </div>

            {staffMembers.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {staffMembers.map((member) => (
                  <Card key={member.id} className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 font-black text-rose-600 border border-rose-100">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-zinc-950 truncate">{member.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                            {member.role}
                          </span>
                          {member.phone && (
                            <span className="text-[11px] text-zinc-400 font-medium">{member.phone}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-6 text-center text-xs text-zinc-500">
                No dedicated waiter accounts added yet. You can invite staff members in{" "}
                <Link href="/dashboard/settings" prefetch={false} className="font-bold text-rose-600 hover:underline">
                  Settings &gt; Staff
                </Link>
                .
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

async function getWaiterAccess() {
  if (!isSupabaseConfigured()) {
    return { role: null, canUseLiveOrders: false, restaurantSlug: null };
  }

  const supabase = await createClient();
  const [{ access, membership }, context] = await Promise.all([
    getSubscriptionAccessForCurrentUser(supabase),
    getSelectedDashboardRestaurant(supabase),
  ]);

  return {
    role: membership?.role ?? null,
    canUseLiveOrders: hasPlanFeature(access, "liveOrders"),
    restaurantSlug: context?.selected?.restaurantSlug ?? null,
  };
}

async function getWaiterStaff(): Promise<WaiterStaffMember[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context?.selected?.restaurantId) return [];

  const { data: members } = await supabase
    .from("restaurant_members")
    .select("id, profile_id, role, created_at, profiles(full_name, phone)")
    .eq("restaurant_id", context.selected.restaurantId)
    .eq("role", "WAITER")
    .order("created_at", { ascending: true });

  return (members ?? []).map((m) => {
    const profile = m.profiles as { full_name?: string; phone?: string | null } | null;
    return {
      id: m.id,
      name: profile?.full_name || "Floor Waiter",
      phone: profile?.phone || null,
      role: m.role,
      createdAt: m.created_at,
    };
  });
}
