import Link from "next/link";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Sparkles,
  XCircle,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { SubscriptionUpgradePanel, type SubscriptionUpgradeRequestView } from "@/components/dashboard/subscription/subscription-upgrade-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  plan: string;
  billingInterval?: "MONTHLY" | "YEARLY";
  status: string;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  graceEndsAt: string | null;
  abandonedTrialDeletionAt: string | null;
  isInGracePeriod: boolean;
  isAbandonedTrialPastDeletionDate: boolean;
  accessMessage: string | null;
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
          description="Once your restaurant registration is complete, the current subscription, billing plan, and renewal details will appear here."
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
  const isTrial = subscription.plan.toLowerCase() === "trial" || subscription.status === "TRIAL";
  const trial = getTrialStatus(subscription.trialEndsAt);
  const monthlyPrice = planPrices[subscription.plan.toLowerCase()] ?? 0;
  const isPaidActive = !isTrial && (subscription.status === "ACTIVE" || subscription.status === "TRIAL");
  const isExpired = subscription.status === "EXPIRED" || subscription.status === "PAST_DUE";

  const currentPlanMeta = subscriptionPlans.find(
    (p) => p.id.toLowerCase() === subscription.plan.toLowerCase(),
  );

  return (
    <div className="grid gap-6">
      {/* Top Banner Card */}
      <Card className="overflow-hidden p-0 border-0 shadow-lg">
        <div className="bg-gradient-to-r from-[#071117] via-[#0f2a20] to-[#163828] p-6 text-white sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                  Active Restaurant
                </span>
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                <span className="text-xs text-zinc-300">Role: {subscription.memberRole}</span>
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl text-white">
                {subscription.restaurantName}
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3.5 backdrop-blur">
                <div className="flex items-center gap-2.5">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Plan</p>
                    <p className="text-2xl font-black capitalize text-white">{subscription.plan}</p>
                  </div>
                  <Badge
                    tone="danger"
                    className={`ml-2 px-3 py-1 text-xs font-black tracking-wider ${
                      isPaidActive
                        ? "bg-emerald-500/25 text-emerald-400 border border-emerald-400/40 shadow-sm"
                        : isExpired
                          ? "bg-rose-500/25 text-rose-400 border border-rose-400/40 shadow-sm"
                          : "bg-amber-500/25 text-amber-400 border border-amber-400/40 shadow-sm"
                    }`}
                  >
                    {subscription.status}
                  </Badge>
                </div>
              </div>

              <Link href="/pricing">
                <Button type="button" variant="glass" className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20 sm:w-auto">
                  Compare plans
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Clean, Polished Stat Cards */}
        <div className="grid gap-4 bg-white p-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailTile
            label="Subscription Status"
            value={subscription.status}
            valueClassName={isPaidActive ? "text-emerald-600" : isExpired ? "text-rose-600" : "text-amber-600"}
            subcaption={isPaidActive ? "All restaurant features active" : isExpired ? "Renewal required" : "In grace period"}
            icon={isPaidActive ? CheckCircle2 : isExpired ? XCircle : AlertTriangle}
            tone={isPaidActive ? "emerald" : isExpired ? "rose" : "orange"}
          />

          <DetailTile
            label="Monthly Pricing"
            value={isTrial ? "₹0 (Free Trial)" : formatCurrency(monthlyPrice)}
            subcaption={isTrial ? "3-Day Free Trial" : "Billed monthly via direct UPI"}
            icon={CreditCard}
            tone="emerald"
          />

          {isTrial ? (
            <DetailTile
              label="Trial Days Left"
              value={trial.label}
              subcaption={trial.expired ? "Trial period expired" : "Upgrade to keep full access"}
              icon={CalendarClock}
              tone={trial.expired ? "rose" : "orange"}
            />
          ) : (
            <DetailTile
              label="Plan Renewal Date"
              value={formatDateShort(subscription.currentPeriodEndsAt)}
              subcaption={isExpired ? "Plan expired" : "Next billing cycle date"}
              icon={CalendarCheck}
              tone={isExpired ? "rose" : "zinc"}
            />
          )}
        </div>
      </Card>

      {/* Warning Alerts */}
      {subscription.isInGracePeriod ? (
        <Card className="border-amber-300 bg-amber-50/80 p-5 text-amber-950">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold">Subscription Grace Access is Active</h3>
              <p className="mt-1 text-xs leading-5 text-amber-800">
                {subscription.accessMessage ?? "Renew your plan now to prevent interruption to your QR ordering and kitchen displays."}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {subscription.isAbandonedTrialPastDeletionDate ? (
        <Card className="border-rose-300 bg-rose-50/80 p-5 text-rose-950">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold">Trial Account Expiration Notice</h3>
              <p className="mt-1 text-xs leading-5 text-rose-800">
                {subscription.accessMessage ?? "This trial account was not renewed. Upgrade below to restore full service."}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Clean 2-Column Section: Simplified Timeline & Included Features */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Simplified Subscription Timeline (Only 2 Essential Dates) */}
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-700" />
            <h3 className="text-base font-bold text-zinc-950">Subscription Dates</h3>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {isTrial ? "Your trial start and expiry dates." : "Your active plan start and renewal dates."}
          </p>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                  <CalendarCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {isTrial ? "Trial Started" : "Subscription Started"}
                  </p>
                  <p className="text-sm font-bold text-zinc-950 mt-0.5">
                    {formatDate(subscription.subscriptionCreatedAt)}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                Activated
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
              <div className="flex items-center gap-3">
                <div className={`grid h-9 w-9 place-items-center rounded-lg font-bold ${isExpired ? "bg-rose-100 text-rose-800" : "bg-zinc-200 text-zinc-800"}`}>
                  <CalendarClock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {isTrial ? "Trial Ending Date" : "Subscription Ending Date"}
                  </p>
                  <p className="text-sm font-bold text-zinc-950 mt-0.5">
                    {formatDate(isTrial ? subscription.trialEndsAt : subscription.currentPeriodEndsAt)}
                  </p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                isExpired ? "bg-rose-100 text-rose-800" : "bg-zinc-100 text-zinc-700"
              }`}>
                {isExpired ? "Expired" : "Valid Till"}
              </span>
            </div>
          </div>
        </Card>

        {/* Current Plan Highlights */}
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-700" />
            <h3 className="text-base font-bold text-zinc-950">Plan Features</h3>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Included with your <span className="capitalize font-semibold text-zinc-900">{subscription.plan}</span> plan.
          </p>

          <div className="mt-4 space-y-2.5">
            {(currentPlanMeta?.features ?? [
              "QR table menu access",
              "Menu and table management",
              "Live order status tracker",
              "Direct UPI & Cash payments",
            ]).map((feature) => (
              <div key={feature} className="flex items-center gap-2.5 text-xs font-medium text-zinc-700">
                <div className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Plan Selection / Renewal Panel */}
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
  tone: "emerald" | "orange" | "rose" | "zinc";
  valueClassName?: string;
}) {
  const toneClass = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    zinc: "bg-zinc-100 text-zinc-700 border-zinc-200",
  }[tone];

  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/50 p-4 transition hover:border-zinc-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">{label}</span>
        <div className={`grid h-8 w-8 place-items-center rounded-xl border ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={`mt-3 text-2xl font-black truncate ${valueClassName ?? "text-zinc-950"}`}>{value}</p>
      {subcaption ? <p className="mt-1 text-xs text-zinc-500 line-clamp-1">{subcaption}</p> : null}
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

function formatDateShort(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
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
