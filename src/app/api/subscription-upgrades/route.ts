import { NextResponse } from "next/server";
import { z } from "zod";
import { getPaidSubscriptionPlan, type PaidSubscriptionPlan } from "@/lib/billing-plans";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import { createManualSubscriptionPayment } from "@/lib/manual-subscription-payment";
import { hasPermission } from "@/lib/permissions";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSubscriptionAccessForRestaurantId } from "@/lib/subscription-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const createUpgradeRequestSchema = z.object({
  plan: z.enum(["basic", "growth", "pro"]),
});

type MembershipResult =
  | {
      userId: string;
      restaurantId: string;
      restaurantName: string;
      role: string;
      error: null;
    }
  | {
      userId: null;
      restaurantId: null;
      restaurantName: null;
      role: null;
      error: NextResponse;
    };

export async function POST(request: Request) {
  const rateLimitResponse = await enforceRateLimit(request, {
    keyPrefix: "subscription-upgrade-create",
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const payload = createUpgradeRequestSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid subscription plan." }, { status: 422 });
  }

  const plan = getPaidSubscriptionPlan(payload.data.plan);

  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  const membership = await getOwnerOrManagerMembership();

  if (membership.error) {
    return membership.error;
  }

  const admin = createAdminClient();
  const access = await getSubscriptionAccessForRestaurantId(admin, membership.restaurantId);

  if (access.deletedAt || access.isAbandonedTrialPastDeletionDate) {
    return NextResponse.json(
      { error: access.message ?? "This restaurant account is no longer eligible for subscription renewal." },
      { status: 403 },
    );
  }

  const { data: existingRequest } = await admin
    .from("subscription_upgrade_requests")
    .select("id,plan,amount,status,transaction_note,transaction_id,payment_submitted_at,created_at")
    .eq("restaurant_id", membership.restaurantId)
    .in("status", ["PENDING_PAYMENT", "VERIFICATION_PENDING"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRequest) {
    const payment = createManualSubscriptionPayment({
      amount: Number(existingRequest.amount),
      transactionNote: existingRequest.transaction_note,
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Manual UPI subscription payments are not configured." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      request: toUpgradeRequestView(existingRequest),
      payment,
    });
  }

  const transactionNote = `FO-SUB-${membership.restaurantId.slice(0, 8).toUpperCase()}-${Date.now()}`;
  const payment = createManualSubscriptionPayment({
    amount: plan.price,
    transactionNote,
  });

  if (!payment) {
    return NextResponse.json(
      { error: "Manual UPI subscription payments are not configured." },
      { status: 503 },
    );
  }

  const { data: upgradeRequest, error } = await admin
    .from("subscription_upgrade_requests")
    .insert({
      restaurant_id: membership.restaurantId,
      requested_by: membership.userId,
      plan: plan.id,
      amount: plan.price,
      payment_method: "UPI",
      gateway: "MANUAL_UPI",
      transaction_note: transactionNote,
    })
    .select("id,plan,amount,status,transaction_note,transaction_id,payment_submitted_at,created_at")
    .single();

  if (error || !upgradeRequest) {
    return NextResponse.json({ error: error?.message ?? "Unable to create subscription upgrade request." }, { status: 400 });
  }

  return NextResponse.json({
    request: toUpgradeRequestView(upgradeRequest),
    payment,
  }, { status: 201 });
}

async function getOwnerOrManagerMembership(): Promise<MembershipResult> {
  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context) {
    return {
      userId: null,
      restaurantId: null,
      restaurantName: null,
      role: null,
      error: NextResponse.json({ error: "Restaurant membership not found." }, { status: 404 }),
    };
  }

  if (!hasPermission(context.selected.memberRole, "manageBilling")) {
    return {
      userId: null,
      restaurantId: null,
      restaurantName: null,
      role: null,
      error: NextResponse.json({ error: "Only owners can request subscription upgrades." }, { status: 403 }),
    };
  }

  return {
    userId: context.userId,
    restaurantId: context.selected.restaurantId,
    restaurantName: context.selected.restaurantName,
    role: context.selected.memberRole,
    error: null,
  };
}

function toUpgradeRequestView(request: {
  id: string;
  plan: string;
  amount: number;
  status: string;
  transaction_note: string;
  transaction_id?: string | null;
  payment_submitted_at?: string | null;
  created_at: string;
}) {
  return {
    id: request.id,
    plan: request.plan as PaidSubscriptionPlan,
    amount: Number(request.amount),
    status: request.status,
    transactionNote: request.transaction_note,
    transactionId: request.transaction_id ?? null,
    paymentSubmittedAt: request.payment_submitted_at ?? null,
    createdAt: request.created_at,
  };
}
