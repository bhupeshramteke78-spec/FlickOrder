import {
  CalendarCheck,
  CalendarClock,
  Check,
  CreditCard,
  Crown,
  Sparkles,
  Zap,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { SubscriptionUpgradePanel, type SubscriptionUpgradeRequestView } from "@/components/dashboard/subscription/subscription-upgrade-panel";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { subscriptionPlans } from "@/lib/billing-plans";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import { hasPermission } from "@/lib/permissions";
import { getSubscriptionAccessForRestaurantId } from "@/lib/subscription-access";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, getTrialStatus } from "@/lib/utils";

type SubscriptionDetails = {
  restaurantName: string;
  memberRole: string;
  plan: "trial" | "basic" | "growth" | "pro";
  status: "TRIALING" | "ACTIVE" | "EXPIRED" | "CANCELLED" | "PAST_DUE";
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  graceEndsAt: string | null;
  abandonedTrialDeletionAt: string | null;
  isInGracePeriod: boolean;
  isAbandonedTrialPastDeletionDate: boolean;
  accessMessage: string | null;
  subscriptionCreatedAt: string | null;
  subscriptionUpdatedAt: string | null;
};

const planPrices: Record<string, number> = {
  trial: 0,
  basic: 299,
  growth: 599,
  pro: 999,
};

export default async function BillingPage() {
  const [subscription, pendingRequest] = await Promise.all([
    getCurrentSubscription(),
    getPendingUpgradeRequest(),
  ]);

  const canViewBilling = subscription ? hasPermission(subscription.memberRole, "viewBilling") : true;

  return (
    <DashboardShell title="Subscription & Billing" eyebrow="Plan Management & Upgrades" showClock>
      {!canViewBilling ? (
        <PermissionLock description="Kitchen and waiter staff roles cannot view or manage restaurant subscriptions." />
      ) : subscription ? (
        <BillingContent subscription={subscription} pendingRequest={pendingRequest} />
      ) : (
        <EmptyState
          icon={CreditCard}
          title="Subscription information unavailable"
          description="We could not load your active subscription status. Ensure your restaurant is configured."
        />
      )}
    </DashboardShell>
  );
}

function BillingContent({
  subscription,
  pendingRequest,
}: {
  subscription: SubscriptionDetails;
  pendingRequest: SubscriptionUpgradeRequestView | null;
}) {
  const isTrial = subscription.plan.toLowerCase() === "trial" || subscription.status === "TRIALING";
  const trial = getTrialStatus(subscription.trialEndsAt);
  const monthlyPrice = planPrices[subscription.plan.toLowerCase()] ?? 0;
  const isExpired = subscription.status === "EXPIRED" || subscription.status === "PAST_DUE";
  const currentPlanMeta = subscriptionPlans.find((p) => p.name.toLowerCase() === subscription.plan.toLowerCase());

  return (
    <div className="space-y-6">
      {/* 4 Detail Metric Tiles in Modern Red/Rose Palette */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DetailTile
          label="Current Plan"
          value={subscription.plan.toUpperCase()}
          subcaption={isTrial ? `Trial (${trial.label})` : "Active Subscription"}
          icon={Crown}
          tone="rose"
        />

        <DetailTile
          label="Status"
          value={subscription.status}
          subcaption={isExpired ? "Plan expired, renew now" : "All services operational"}
          icon={Zap}
          tone={isExpired ? "rose" : "emerald"}
          valueClassName={isExpired ? "text-rose-600" : "text-emerald-700"}
        />

        <DetailTile
          label="Rate"
          value={monthlyPrice > 0 ? `${formatCurrency(monthlyPrice)}/mo` : "Free"}
          subcaption={monthlyPrice > 0 ? "Billed per restaurant outlet" : "Full access trial period"}
          icon={CreditCard}
          tone="zinc"
        />

        <DetailTile
          label="Next Billing / Expiry"
          value={formatDateShort(isTrial ? subscription.trialEndsAt : subscription.currentPeriodEndsAt)}
          subcaption={isTrial ? trial.label : "Auto-renews or renewal due"}
          icon={CalendarClock}
          tone="amber"
        />
      </div>

      {/* 2-Column Schedule & Features Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Timeline & Schedule Card */}
        <Card className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
            <CalendarClock className="h-4 w-4 text-rose-600" />
            <h3 className="text-sm font-black text-zinc-950">Subscription Timeline</h3>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {isTrial ? "Your trial start and expiry milestones." : "Your active plan start and renewal dates."}
          </p>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3.5">
              <div className="flex items-center gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                  <CalendarCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    {isTrial ? "Trial Started" : "Subscription Started"}
                  </p>
                  <p className="text-xs font-bold text-zinc-950 mt-0.5">
                    {formatDate(subscription.subscriptionCreatedAt)}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                Activated
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3.5">
              <div className="flex items-center gap-3">
                <div className={`grid h-8 w-8 place-items-center rounded-lg font-bold ${isExpired ? "bg-rose-100 text-rose-800" : "bg-zinc-200 text-zinc-800"}`}>
                  <CalendarClock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    {isTrial ? "Trial Expiry Date" : "Subscription Renewal Date"}
                  </p>
                  <p className="text-xs font-bold text-zinc-950 mt-0.5">
                    {formatDate(isTrial ? subscription.trialEndsAt : subscription.currentPeriodEndsAt)}
                  </p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                isExpired ? "bg-rose-100 text-rose-800 border border-rose-200" : "bg-zinc-100 text-zinc-700"
              }`}>
                {isExpired ? "Expired" : "Valid Till"}
              </span>
            </div>
          </div>
        </Card>

        {/* Current Plan Highlights */}
        <Card className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
            <Sparkles className="h-4 w-4 text-rose-600" />
            <h3 className="text-sm font-black text-zinc-950">Active Plan Features</h3>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Included with your <span className="capitalize font-bold text-rose-600">{subscription.plan}</span> subscription tier.
          </p>

          <div className="mt-4 space-y-2.5">
            {(currentPlanMeta?.features ?? [
              "QR table menu access",
              "Live kitchen display & waiter routing",
              "Direct customer UPI payments",
              "Analytics & sales reporting",
            ]).map((feature) => (
              <div key={feature} className="flex items-center gap-2.5 text-xs font-medium text-zinc-700">
                <div className="grid h-5 w-5 place-items-center rounded-full bg-rose-50 text-rose-600 shrink-0">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Plan Selection / Renewal & Upgrade Panel */}
      <SubscriptionUpgradePanel
        plans={subscriptionPlans}
        currentPlan={subscription.plan}
        currentStatus={subscription.status}
        pendingRequest={pendingRequest}
      />
    </div>
  );
}

function DetailTile({
  label,
  value,
  subcaption,
  icon: Icon,
  tone,
  valueClassName,
}: {
  label: string;
  value: string;
  subcaption?: string;
  icon: typeof CreditCard;
  tone: "emerald" | "amber" | "rose" | "zinc";
  valueClassName?: string;
}) {
  const toneClass = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-600 border-rose-200",
    zinc: "bg-zinc-100 text-zinc-700 border-zinc-200",
  }[tone];

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:border-zinc-300">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">{label}</span>
        <div className={`grid h-8 w-8 place-items-center rounded-xl border ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={`mt-2.5 text-xl font-black truncate ${valueClassName ?? "text-zinc-950"}`}>{value}</p>
      {subcaption ? <p className="mt-1 text-xs font-medium text-zinc-500 line-clamp-1">{subcaption}</p> : null}
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatDateShort(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
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

  const access = await getSubscriptionAccessForRestaurantId(supabase, context.selected.restaurantId);

  return {
    restaurantName: restaurant.name,
    memberRole: context.selected.memberRole,
    plan: subscription.plan,
    status: access.status,
    trialEndsAt: subscription.trial_ends_at,
    currentPeriodEndsAt: subscription.current_period_ends_at,
    graceEndsAt: access.graceEndsAt,
    abandonedTrialDeletionAt: access.abandonedTrialDeletionAt,
    isInGracePeriod: access.isInGracePeriod,
    isAbandonedTrialPastDeletionDate: access.isAbandonedTrialPastDeletionDate,
    accessMessage: access.message,
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
    .select("id,plan,amount,status,transaction_note,transaction_id,payment_submitted_at,created_at")
    .eq("restaurant_id", context.selected.restaurantId)
    .in("status", ["PENDING_PAYMENT", "VERIFICATION_PENDING"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!request) {
    return null;
  }

  const isYearly = Number(request.amount) >= 2000 || request.transaction_note?.includes("YEARLY");

  return {
    id: request.id,
    plan: request.plan as "basic" | "growth" | "pro",
    amount: Number(request.amount),
    interval: isYearly ? "YEARLY" : "MONTHLY",
    status: request.status,
    transactionNote: request.transaction_note,
    transactionId: request.transaction_id ?? null,
    paymentSubmittedAt: request.payment_submitted_at ?? null,
    createdAt: request.created_at,
  };
}
