export type PaidSubscriptionPlan = "basic" | "growth" | "pro";
export type SubscriptionPlan = "trial" | PaidSubscriptionPlan | "none";
export type PlanFeature =
  | "qrOrdering"
  | "menuManagement"
  | "tableManagement"
  | "liveOrders"
  | "staffWorkflow"
  | "analytics"
  | "orderHistory"
  | "advancedReporting"
  | "orderHistorySearch";

export type PlanRules = Record<PlanFeature, boolean>;

export type SubscriptionPlanDetails = {
  id: PaidSubscriptionPlan;
  name: string;
  price: number;
  description: string;
  features: string[];
};

export const subscriptionPlans: SubscriptionPlanDetails[] = [
  {
    id: "basic",
    name: "Basic",
    price: 299,
    description: "Core QR ordering and restaurant operations for small teams.",
    features: ["QR table menu access", "Menu and table management", "Live orders and payment verification", "Owner dashboard"],
  },
  {
    id: "growth",
    name: "Growth",
    price: 799,
    description: "Realtime operations, order history, and analytics for busy restaurants.",
    features: ["Everything in Basic", "Optional Kitchen and Waiter staff tabs", "Order history records", "Paid-order revenue and item analytics"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 1499,
    description: "Advanced controls and reporting for scaling restaurant teams.",
    features: ["Everything in Growth", "Optional Kitchen and Waiter staff tabs", "Searchable order history", "Detailed busy-hour reporting"],
  },
];

const emptyRules: PlanRules = {
  qrOrdering: false,
  menuManagement: false,
  tableManagement: false,
  liveOrders: false,
  staffWorkflow: false,
  analytics: false,
  orderHistory: false,
  advancedReporting: false,
  orderHistorySearch: false,
};

const basicRules: PlanRules = {
  ...emptyRules,
  qrOrdering: true,
  menuManagement: true,
  tableManagement: true,
  liveOrders: true,
};

const growthRules: PlanRules = {
  ...basicRules,
  staffWorkflow: true,
  analytics: true,
  orderHistory: true,
};

const proRules: PlanRules = {
  ...growthRules,
  advancedReporting: true,
  orderHistorySearch: true,
};

export const planRules: Record<SubscriptionPlan, PlanRules> = {
  none: emptyRules,
  basic: basicRules,
  growth: growthRules,
  pro: proRules,
  trial: proRules,
};

export function getPaidSubscriptionPlan(plan: string): SubscriptionPlanDetails | null {
  return subscriptionPlans.find((subscriptionPlan) => subscriptionPlan.id === plan) ?? null;
}

export function getPlanRules(plan: SubscriptionPlan) {
  return planRules[plan] ?? emptyRules;
}

export function getMinimumPlanForFeature(feature: PlanFeature) {
  if (basicRules[feature]) {
    return "Basic";
  }

  if (growthRules[feature]) {
    return "Growth";
  }

  return "Pro";
}

export function getPlanAmount(plan: PaidSubscriptionPlan) {
  return getPaidSubscriptionPlan(plan)?.price ?? 0;
}

export function getPlatformUpiDetails() {
  return {
    upiId: process.env.FLICKORDER_UPI_ID?.trim() || null,
    upiDisplayName: process.env.FLICKORDER_UPI_DISPLAY_NAME?.trim() || "FlickOrder",
  };
}
