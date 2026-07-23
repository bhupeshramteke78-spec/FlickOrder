import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getPlanRules, type PlanFeature, type PlanRules, type SubscriptionPlan } from "@/lib/billing-plans";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";

export type SubscriptionAccess = {
  restaurantId: string;
  plan: SubscriptionPlan;
  status: "TRIALING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  daysLeft: number;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  features: PlanRules;
  canManageRestaurant: boolean;
  canUseQrOrdering: boolean;
  message: string | null;
};

type RestaurantMembershipAccess =
  | {
      supabase: SupabaseClient<Database>;
      access: SubscriptionAccess;
      membership: { restaurant_id: string; role: string };
      error: null;
    }
  | {
      supabase: SupabaseClient<Database>;
      access: null;
      membership: null;
      error: { message: string; status: number };
    };

export async function getSubscriptionAccessForCurrentUser(
  supabase: SupabaseClient<Database>,
): Promise<RestaurantMembershipAccess> {
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context) {
    return {
      supabase,
      access: null,
      membership: null,
      error: { message: "Restaurant membership not found.", status: 404 },
    };
  }

  const membership = {
    restaurant_id: context.selected.restaurantId,
    role: context.selected.memberRole,
  };

  const access = await getSubscriptionAccessForRestaurantId(supabase, membership.restaurant_id);

  return {
    supabase,
    access,
    membership,
    error: null,
  };
}

export async function getSubscriptionAccessForRestaurantSlug(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<SubscriptionAccess | null> {
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!restaurant) {
    return null;
  }

  return getSubscriptionAccessForRestaurantId(supabase, restaurant.id);
}

export async function getSubscriptionAccessForRestaurantId(
  supabase: SupabaseClient<Database>,
  restaurantId: string,
): Promise<SubscriptionAccess> {
  const [{ data: subscription }, { data: settings }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan,status,trial_ends_at,current_period_ends_at")
      .eq("restaurant_id", restaurantId)
      .maybeSingle(),
    supabase
      .from("restaurant_settings")
      .select("qr_ordering_enabled")
      .eq("restaurant_id", restaurantId)
      .maybeSingle(),
  ]);

  if (!subscription) {
    return buildAccess({
      restaurantId,
      plan: "none",
      status: "EXPIRED",
      trialEndsAt: null,
      currentPeriodEndsAt: null,
      qrOrderingEnabled: settings?.qr_ordering_enabled ?? false,
      message: "Subscription not found. Please choose a plan to continue.",
    });
  }

  const computedStatus = getComputedStatus(subscription.status, subscription.trial_ends_at, subscription.current_period_ends_at);

  return buildAccess({
    restaurantId,
    plan: subscription.plan,
    status: computedStatus,
    trialEndsAt: subscription.trial_ends_at,
    currentPeriodEndsAt: subscription.current_period_ends_at,
    qrOrderingEnabled: settings?.qr_ordering_enabled ?? false,
    message: computedStatus === "EXPIRED" || computedStatus === "CANCELLED"
      ? "Your trial or subscription has ended. Choose a plan to continue restaurant operations."
      : null,
  });
}

export function isSubscriptionLocked(access: SubscriptionAccess | null) {
  return !access?.canManageRestaurant;
}

export function hasPlanFeature(access: SubscriptionAccess | null, feature: PlanFeature) {
  return Boolean(access?.canManageRestaurant && access.features[feature]);
}

function buildAccess({
  restaurantId,
  plan,
  status,
  trialEndsAt,
  currentPeriodEndsAt,
  qrOrderingEnabled,
  message,
}: {
  restaurantId: string;
  plan: SubscriptionAccess["plan"];
  status: SubscriptionAccess["status"];
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  qrOrderingEnabled: boolean;
  message: string | null;
}): SubscriptionAccess {
  const canUseSubscription = status === "ACTIVE" || status === "TRIALING";
  const features = canUseSubscription ? getPlanRules(plan) : getPlanRules("none");

  return {
    restaurantId,
    plan,
    status,
    daysLeft: getDaysLeft(status, trialEndsAt, currentPeriodEndsAt),
    trialEndsAt,
    currentPeriodEndsAt,
    features,
    canManageRestaurant: canUseSubscription,
    canUseQrOrdering: canUseSubscription && qrOrderingEnabled && features.qrOrdering,
    message,
  };
}

function getComputedStatus(
  status: SubscriptionAccess["status"],
  trialEndsAt: string | null,
  currentPeriodEndsAt: string | null,
): SubscriptionAccess["status"] {
  const now = Date.now();

  if (status === "TRIALING" && trialEndsAt && new Date(trialEndsAt).getTime() <= now) {
    return "EXPIRED";
  }

  if (status === "ACTIVE" && currentPeriodEndsAt && new Date(currentPeriodEndsAt).getTime() <= now) {
    return "EXPIRED";
  }

  return status;
}

function getDaysLeft(status: SubscriptionAccess["status"], trialEndsAt: string | null, currentPeriodEndsAt: string | null) {
  const endDate = status === "TRIALING" ? trialEndsAt : currentPeriodEndsAt;

  if (!endDate) {
    return 0;
  }

  const diff = new Date(endDate).getTime() - Date.now();

  if (diff <= 0) {
    return 0;
  }

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
