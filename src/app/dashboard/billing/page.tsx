import Link from "next/link";
import {
  AlertTriangle,
  Check,
  CreditCard,
  Crown,
  Download,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PermissionLock } from "@/components/dashboard/permission-lock";
import { SubscriptionUpgradePanel, type SubscriptionUpgradeRequestView } from "@/components/dashboard/subscription/subscription-upgrade-panel";
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
    <DashboardShell title="Subscription & Billing" eyebrow="Manage your plan, payment methods, and billing history">
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

  return (
    <div className="space-y-6">
      {/* Top 2-Column Section matching DineFlow Page 5 */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Sleek Dark Pro Plan Card */}
        <div className="relative overflow-hidden rounded-2xl bg-[#090e17] p-7 text-white shadow-md flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-rose-400">
                {subscription.plan.toUpperCase()} PLAN
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                {isTrial ? `Trial (${trial.label})` : `Active since ${formatDateMonthYear(subscription.subscriptionCreatedAt)}`}
              </span>
            </div>

            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                {isTrial ? "₹0" : formatCurrency(monthlyPrice)}
              </span>
              <span className="text-sm font-medium text-zinc-400">/ month</span>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-zinc-300 font-medium max-w-md">
              {isTrial
                ? "Your restaurant is currently enjoying 3-day full access trial. Upgrade anytime to ensure 0 interruptions."
                : `Your next billing renewal date is ${formatDate(subscription.currentPeriodEndsAt)} via Direct UPI/Online.`}
            </p>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3 relative z-10">
            <Link href="#upgrade-section">
              <Button
                type="button"
                className="h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 shadow-sm shadow-rose-600/30"
              >
                Upgrade Plan
              </Button>
            </Link>

            <Link href="/pricing">
              <Button
                type="button"
                variant="secondary"
                className="h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 px-5 backdrop-blur"
              >
                Manage Billing
              </Button>
            </Link>
          </div>

          {/* Background Crown Watermark matching Page 5 */}
          <Crown className="absolute -right-6 -bottom-6 h-52 w-52 text-white/[0.04] pointer-events-none" />
        </div>

        {/* Plan Features Checklist Card matching Page 5 */}
        <Card className="rounded-2xl border border-zinc-200/80 bg-white p-7 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-black text-zinc-950">Plan Features</h2>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">Capabilities included in your current subscription</p>

            <ul className="mt-5 space-y-3 text-xs font-medium text-zinc-700">
              <li className="flex items-center gap-3">
                <div className="grid h-5 w-5 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span>Unlimited QR Menu Scans</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="grid h-5 w-5 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span>Up to 50 Tables</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="grid h-5 w-5 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span>10 Staff Accounts</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="grid h-5 w-5 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span>Advanced Analytics</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="grid h-5 w-5 place-items-center rounded-full bg-zinc-100 text-zinc-400">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span className="text-zinc-400">Multi-Location Support</span>
              </li>
            </ul>
          </div>
        </Card>
      </div>

      {/* Warning Alerts */}
      {subscription.isInGracePeriod && (
        <Card className="rounded-2xl border-amber-300 bg-amber-50/80 p-5 text-amber-950">
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
      )}

      {/* Billing History Table Card matching DineFlow Page 5 */}
      <Card className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-black text-zinc-950">Billing History</h2>
            <p className="text-xs text-zinc-500 font-medium">Download past invoices and review payment receipts</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="pb-3 font-semibold">INVOICE</th>
                <th className="pb-3 font-semibold">DATE</th>
                <th className="pb-3 font-semibold">AMOUNT</th>
                <th className="pb-3 font-semibold">STATUS</th>
                <th className="pb-3 text-right font-semibold">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 font-medium">
              {[
                { id: "INV-0842", date: "May 12, 2024", amount: "₹1,499.00", status: "PAID" },
                { id: "INV-0721", date: "Apr 12, 2024", amount: "₹1,499.00", status: "PAID" },
              ].map((inv) => (
                <tr key={inv.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="py-3.5 font-bold text-zinc-900">{inv.id}</td>
                  <td className="py-3.5 text-zinc-500">{inv.date}</td>
                  <td className="py-3.5 font-bold text-zinc-900">{inv.amount}</td>
                  <td className="py-3.5">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition"
                      title="Download Invoice"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Plan Upgrade Section */}
      <div id="upgrade-section" className="pt-2">
        <SubscriptionUpgradePanel
          plans={subscriptionPlans}
          currentPlan={subscription.plan}
          currentStatus={subscription.status}
          pendingRequest={pendingRequest}
        />
      </div>
    </div>
  );
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

  const restaurantId = context.selected.restaurantId;
  const access = await getSubscriptionAccessForRestaurantId(supabase, restaurantId);

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan,billing_interval,status,trial_ends_at,current_period_ends_at,created_at,updated_at")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (!subscription) {
    return null;
  }

  return {
    restaurantName: context.selected.restaurantName,
    memberRole: context.selected.memberRole,
    plan: subscription.plan,
    billingInterval: (subscription.billing_interval as "MONTHLY" | "YEARLY") ?? "MONTHLY",
    status: subscription.status,
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
    .select("id,plan,amount,billing_interval,status,transaction_note,transaction_id,payment_submitted_at,created_at")
    .eq("restaurant_id", context.selected.restaurantId)
    .in("status", ["PENDING_PAYMENT", "VERIFICATION_PENDING"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!request) {
    return null;
  }

  return {
    id: request.id,
    plan: request.plan as SubscriptionUpgradeRequestView["plan"],
    amount: Number(request.amount),
    interval: (request.billing_interval ?? "MONTHLY") as SubscriptionUpgradeRequestView["interval"],
    status: request.status as SubscriptionUpgradeRequestView["status"],
    transactionNote: request.transaction_note ?? "",
    transactionId: request.transaction_id,
    paymentSubmittedAt: request.payment_submitted_at,
    createdAt: request.created_at,
  };
}

function formatDate(value: string | null) {
  if (!value) return "None";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatDateMonthYear(value: string | null) {
  if (!value) return "Recently";

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}
