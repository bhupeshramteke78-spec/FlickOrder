import { NextResponse } from "next/server";
import { getPaidSubscriptionPlan } from "@/lib/billing-plans";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature");
  const rawBody = await request.text();

  if (!signature || !verifyRazorpayWebhookSignature({ body: rawBody, signature })) {
    return NextResponse.json({ error: "Invalid Razorpay webhook signature." }, { status: 400 });
  }

  let event: RazorpayWebhookEvent;

  try {
    event = JSON.parse(rawBody) as RazorpayWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid Razorpay webhook body." }, { status: 400 });
  }

  if (!["payment.captured", "order.paid"].includes(event.event)) {
    return NextResponse.json({ ok: true });
  }

  const payment = event.payload.payment?.entity;
  const order = event.payload.order?.entity;
  const razorpayOrderId = payment?.order_id ?? order?.id ?? null;

  if (!razorpayOrderId) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { data: upgradeRequest } = await admin
    .from("subscription_upgrade_requests")
    .select("id,restaurant_id,plan,status")
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();

  if (!upgradeRequest || upgradeRequest.status === "APPROVED") {
    return NextResponse.json({ ok: true });
  }

  if (upgradeRequest.status !== "PENDING_PAYMENT") {
    return NextResponse.json({ ok: true });
  }

  const plan = getPaidSubscriptionPlan(upgradeRequest.plan);

  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const [{ error: requestError }, { error: subscriptionError }] = await Promise.all([
    admin
      .from("subscription_upgrade_requests")
      .update({
        status: "APPROVED",
        razorpay_payment_id: payment?.id ?? null,
        paid_at: now.toISOString(),
        verified_at: now.toISOString(),
      })
      .eq("id", upgradeRequest.id),
    admin
      .from("subscriptions")
      .update({
        plan: plan.id,
        status: "ACTIVE",
        trial_ends_at: null,
        current_period_ends_at: periodEnd.toISOString(),
      })
      .eq("restaurant_id", upgradeRequest.restaurant_id),
  ]);

  const error = requestError ?? subscriptionError;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

type RazorpayWebhookEvent = {
  event: string;
  payload: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
      };
    };
    order?: {
      entity?: {
        id?: string;
      };
    };
  };
};
