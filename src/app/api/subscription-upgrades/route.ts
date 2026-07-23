import { NextResponse } from "next/server";
import { z } from "zod";
import { getPaidSubscriptionPlan, type PaidSubscriptionPlan } from "@/lib/billing-plans";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import { hasPermission } from "@/lib/permissions";
import { createRazorpayOrder, getRazorpayConfig } from "@/lib/razorpay";
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

  const razorpay = getRazorpayConfig();

  if (!razorpay) {
    return NextResponse.json(
      { error: "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the server." },
      { status: 500 },
    );
  }

  const membership = await getOwnerOrManagerMembership();

  if (membership.error) {
    return membership.error;
  }

  const admin = createAdminClient();
  const { data: existingRequest } = await admin
    .from("subscription_upgrade_requests")
    .select("id,plan,amount,status,transaction_note,razorpay_order_id,created_at")
    .eq("restaurant_id", membership.restaurantId)
    .eq("status", "PENDING_PAYMENT")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRequest) {
    return NextResponse.json({
      request: toUpgradeRequestView(existingRequest),
      razorpay: existingRequest.razorpay_order_id
        ? {
            keyId: razorpay.keyId,
            orderId: existingRequest.razorpay_order_id,
            amount: Math.round(Number(existingRequest.amount) * 100),
            currency: "INR",
            name: "FlickOrder",
            description: `${getPaidSubscriptionPlan(existingRequest.plan)?.name ?? "Restaurant"} subscription`,
          }
        : null,
    });
  }

  const transactionNote = `FlickOrder ${plan.name} ${membership.restaurantName} ${Date.now()}`;
  let razorpayOrder: Awaited<ReturnType<typeof createRazorpayOrder>>;

  try {
    razorpayOrder = await createRazorpayOrder({
      amount: plan.price,
      receipt: `fo_${membership.restaurantId.slice(0, 8)}_${Date.now()}`.slice(0, 40),
      notes: {
        restaurant_id: membership.restaurantId,
        restaurant_name: membership.restaurantName,
        plan: plan.id,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create Razorpay order." },
      { status: 502 },
    );
  }

  const { data: upgradeRequest, error } = await admin
    .from("subscription_upgrade_requests")
    .insert({
      restaurant_id: membership.restaurantId,
      requested_by: membership.userId,
      plan: plan.id,
      amount: plan.price,
      payment_method: "RAZORPAY",
      gateway: "RAZORPAY",
      razorpay_order_id: razorpayOrder.id,
      transaction_note: transactionNote,
    })
    .select("id,plan,amount,status,transaction_note,razorpay_order_id,created_at")
    .single();

  if (error || !upgradeRequest) {
    return NextResponse.json({ error: error?.message ?? "Unable to create subscription upgrade request." }, { status: 400 });
  }

  return NextResponse.json({
    request: toUpgradeRequestView(upgradeRequest),
    razorpay: {
      keyId: razorpay.keyId,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: "FlickOrder",
      description: `${plan.name} subscription`,
    },
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
  razorpay_order_id?: string | null;
  created_at: string;
}) {
  return {
    id: request.id,
    plan: request.plan as PaidSubscriptionPlan,
    amount: Number(request.amount),
    status: request.status,
    transactionNote: request.transaction_note,
    razorpayOrderId: request.razorpay_order_id ?? null,
    createdAt: request.created_at,
  };
}
