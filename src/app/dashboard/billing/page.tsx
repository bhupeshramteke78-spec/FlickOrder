import Link from "next/link";
import { CalendarClock, CreditCard, Store } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { SubscriptionUpgradePanel, type SubscriptionUpgradeRequestView } from "@/components/dashboard/subscription/subscription-upgrade-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { subscriptionPlans } from "@/lib/billing-plans";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import { hasPermission } from "@/lib/permissions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, getTrialStatus } from "@/lib/utils";

type SubscriptionDetails = {
  restaurantName: string;
  memberRole: string;
  plan: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  subscriptionCreatedAt: string;
  subscriptionUpdatedAt: string;
};

const planPrices: Record<string, number> = {
  trial: 0,
  basic: 299,
  growth: 799,
  pro: 1499,
};

export default async function SubscriptionPage() {
  const role = await getBillingRole();
  const canViewBilling = hasPermission(role, "viewBilling");
  const [subscription, pendingRequest] = canViewBilling
    ? await Promise.all([getCurrentSubscription(), getPendingUpgradeRequest()])
    : [null, null];

  return (
    <DashboardShell title="Subscription" eyebrow="Current subscription details">
      {!canViewBilling ? (
        <PermissionLock description="Only owners can view billing and subscription management." />
      ) : subscription ? (
        <SubscriptionDetailsView
          subscription={subscription}
          pendingRequest={pendingRequest}
        />
      ) : (
        <EmptyState
          icon={CreditCard}
          title="No subscription found"
          description="Once your restaurant registration is complete, the current subscription, trial period, billing plan, and renewal details will appear here."
        />
      )}
    </DashboardShell>
  );
}

async function getBillingRole() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  return context?.selected.memberRole ?? null;
}

function SubscriptionDetailsView({
  subscription,
  pendingRequest,
}: {
  subscription: SubscriptionDetails;
  pendingRequest: SubscriptionUpgradeRequestView | null;
}) {
  const trial = getTrialStatus(subscription.trialEndsAt);
  const monthlyPrice = planPrices[subscription.plan] ?? 0;

  return (
    <div className="grid gap-5">
      <Card className="overflow-hidden p-0">
        <div className="bg-gradient-to-r from-[#071117] via-[#0f2a20] to-[#163828] p-6 text-white">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-200">Active Restaurant</p>
              <h2 className="mt-3 text-3xl font-semibold">{subscription.restaurantName}</h2>
              <p className="mt-2 text-sm text-zinc-300">Role: {subscription.memberRole}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-sm text-zinc-300">Current Plan</p>
                <p className="mt-1 text-3xl font-semibold capitalize">{subscription.plan}</p>
              </div>
              <Link href="/pricing">
                <Button type="button" variant="glass" className="w-full border-emerald-200/30 bg-emerald-400/20 text-white sm:w-auto">
                  View pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-4">
          <DetailTile label="Status" value={subscription.status} icon={CreditCard} tone="emerald" />
          <DetailTile label="Trial" value={trial.label} icon={CalendarClock} tone={trial.expired ? "rose" : "emerald"} />
          <DetailTile label="Monthly Price" value={formatCurrency(monthlyPrice)} icon={CreditCard} tone="orange" />
          <DetailTile label="Restaurant" value={subscription.restaurantName} icon={Store} tone="zinc" />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.72fr]">
        <Card>
          <h3 className="text-lg font-semibold text-zinc-950">Subscription Timeline</h3>
          <div className="mt-5 grid gap-3">
            <TimelineRow label="Subscription created" value={formatDate(subscription.subscriptionCreatedAt)} />
            <TimelineRow label="Last updated" value={formatDate(subscription.subscriptionUpdatedAt)} />
            <TimelineRow label="Trial ends" value={formatDate(subscription.trialEndsAt)} />
            <TimelineRow label="Current period ends" value={formatDate(subscription.currentPeriodEndsAt)} />
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-zinc-950">Plan Details</h3>
          <div className="mt-5 space-y-3 text-sm text-zinc-600">
            <p>
              Revenue analytics count only paid orders. Payment status is verified by restaurant staff and is never
              trusted from the customer device.
            </p>
            <p>
              Trial status is calculated dynamically from the subscription dates, so it automatically changes from days
              left to expired.
            </p>
          </div>
        </Card>
      </div>

      <SubscriptionUpgradePanel
        plans={subscriptionPlans}
        currentPlan={subscription.plan}
        pendingRequest={pendingRequest}
      />
    </div>
  );
}

function DetailTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof CreditCard;
  tone: "emerald" | "orange" | "rose" | "zinc";
}) {
  const toneClass = {
    emerald: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-orange-700",
    rose: "bg-rose-50 text-rose-700",
    zinc: "bg-zinc-100 text-zinc-700",
  }[tone];

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div className={`mb-4 grid h-10 w-10 place-items-center rounded-lg ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 break-words text-lg font-semibold capitalize text-zinc-950">{value}</p>
    </div>
  );
}

function TimelineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-semibold text-zinc-950">{value}</span>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function getCurrentSubscription(): Promise<SubscriptionDetails | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context) {
    return null;
  }

  const [{ data: restaurant }, { data: subscription }] = await Promise.all([
    supabase.from("restaurants").select("name").eq("id", context.selected.restaurantId).single(),
    supabase
      .from("subscriptions")
      .select("plan,status,trial_ends_at,current_period_ends_at,created_at,updated_at")
      .eq("restaurant_id", context.selected.restaurantId)
      .single(),
  ]);

  if (!restaurant || !subscription) {
    return null;
  }

  return {
    restaurantName: restaurant.name,
    memberRole: context.selected.memberRole,
    plan: subscription.plan,
    status: subscription.status,
    trialEndsAt: subscription.trial_ends_at,
    currentPeriodEndsAt: subscription.current_period_ends_at,
    subscriptionCreatedAt: subscription.created_at,
    subscriptionUpdatedAt: subscription.updated_at,
  };
}

async function getPendingUpgradeRequest(): Promise<SubscriptionUpgradeRequestView | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context) {
    return null;
  }

  const { data: request } = await supabase
    .from("subscription_upgrade_requests")
    .select("id,plan,amount,status,transaction_note,razorpay_order_id,created_at")
    .eq("restaurant_id", context.selected.restaurantId)
    .eq("status", "PENDING_PAYMENT")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!request) {
    return null;
  }

  return {
    id: request.id,
    plan: request.plan,
    amount: Number(request.amount),
    status: request.status,
    transactionNote: request.transaction_note,
    razorpayOrderId: request.razorpay_order_id ?? null,
    createdAt: request.created_at,
  };
}
