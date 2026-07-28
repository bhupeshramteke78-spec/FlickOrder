import { NextResponse } from "next/server";
import { isManualSubscriptionPaymentEnabled } from "@/lib/manual-subscription-payment";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (isManualSubscriptionPaymentEnabled()) {
    return NextResponse.json({ error: "Razorpay subscription payments are disabled." }, { status: 404 });
  }

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
  const webhookEventId =
    request.headers.get("x-razorpay-event-id") ??
    `${event.event}:${payment?.id ?? razorpayOrderId ?? "unknown"}`;

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

  const { error } = await admin.rpc("activate_subscription_payment", {
    p_request_id: upgradeRequest.id,
    p_payment_id: payment?.id ?? null,
    p_signature: null,
    p_verified_by: null,
    p_webhook_event_id: webhookEventId,
  });

  if (error) {
    return NextResponse.json({ error: "Unable to activate subscription payment." }, { status: 500 });
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
