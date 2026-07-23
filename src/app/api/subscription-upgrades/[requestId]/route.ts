import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit-log";
import { getPaidSubscriptionPlan, type PaidSubscriptionPlan } from "@/lib/billing-plans";
import { hasPermission } from "@/lib/permissions";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdminUnlocked } from "@/lib/super-admin";

const paramsSchema = z.object({
  requestId: z.string().uuid(),
});
const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("VERIFY_RAZORPAY"),
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
  }),
  z.object({ action: z.literal("MARK_PAID") }),
  z.object({ action: z.enum(["APPROVE", "REJECT"]) }),
]);

export async function PATCH(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const parsedParams = paramsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid subscription request id." }, { status: 422 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const payload = actionSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid subscription action." }, { status: 422 });
  }

  if (payload.data.action === "VERIFY_RAZORPAY") {
    return verifyRazorpayPayment(parsedParams.data.requestId, payload.data);
  }

  if (payload.data.action === "MARK_PAID") {
    return markPaid(parsedParams.data.requestId);
  }

  return reviewRequest(parsedParams.data.requestId, payload.data.action);
}

async function verifyRazorpayPayment(
  requestId: string,
  payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  },
) {
  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();

  if (!userResult.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: upgradeRequest } = await supabase
    .from("subscription_upgrade_requests")
    .select("id,restaurant_id,plan,amount,status,transaction_note,razorpay_order_id,created_at")
    .eq("id", requestId)
    .maybeSingle();

  if (!upgradeRequest) {
    return NextResponse.json({ error: "Subscription request not found." }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from("restaurant_members")
    .select("role")
    .eq("restaurant_id", upgradeRequest.restaurant_id)
    .eq("profile_id", userResult.user.id)
    .maybeSingle();

  if (!membership || !hasPermission(membership.role, "manageBilling")) {
    return NextResponse.json({ error: "You do not have access to update this subscription request." }, { status: 403 });
  }

  if (upgradeRequest.status !== "PENDING_PAYMENT") {
    return NextResponse.json({ error: "Only pending payment requests can be verified." }, { status: 409 });
  }

  if (!upgradeRequest.razorpay_order_id || upgradeRequest.razorpay_order_id !== payload.razorpayOrderId) {
    return NextResponse.json({ error: "Razorpay order mismatch." }, { status: 409 });
  }

  const isValidPayment = verifyRazorpaySignature({
    orderId: payload.razorpayOrderId,
    paymentId: payload.razorpayPaymentId,
    signature: payload.razorpaySignature,
  });

  if (!isValidPayment) {
    return NextResponse.json({ error: "Razorpay payment signature verification failed." }, { status: 400 });
  }

  const plan = getPaidSubscriptionPlan(upgradeRequest.plan);

  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const [{ error: requestError }, { error: subscriptionError }] = await Promise.all([
    admin
      .from("subscription_upgrade_requests")
      .update({
        status: "APPROVED",
        razorpay_payment_id: payload.razorpayPaymentId,
        razorpay_signature: payload.razorpaySignature,
        paid_at: now.toISOString(),
        verified_by: userResult.user.id,
        verified_at: now.toISOString(),
      })
      .eq("id", requestId),
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

async function markPaid(requestId: string) {
  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();

  if (!userResult.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: upgradeRequest } = await supabase
    .from("subscription_upgrade_requests")
    .select("id,restaurant_id,plan,amount,status,transaction_note,created_at")
    .eq("id", requestId)
    .maybeSingle();

  if (!upgradeRequest) {
    return NextResponse.json({ error: "Subscription request not found." }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from("restaurant_members")
    .select("role")
    .eq("restaurant_id", upgradeRequest.restaurant_id)
    .eq("profile_id", userResult.user.id)
    .maybeSingle();

  if (!membership || !hasPermission(membership.role, "manageBilling")) {
    return NextResponse.json({ error: "You do not have access to update this subscription request." }, { status: 403 });
  }

  if (upgradeRequest.status !== "PENDING_PAYMENT") {
    return NextResponse.json({ error: "Only pending payment requests can be marked as paid." }, { status: 409 });
  }

  const admin = createAdminClient();
  const { data: updatedRequest, error } = await admin
    .from("subscription_upgrade_requests")
    .update({ status: "VERIFICATION_PENDING" })
    .eq("id", requestId)
    .select("id,plan,amount,status,transaction_note,created_at")
    .single();

  if (error || !updatedRequest) {
    return NextResponse.json({ error: error?.message ?? "Unable to update subscription request." }, { status: 400 });
  }

  return NextResponse.json({ request: toUpgradeRequestView(updatedRequest) });
}

async function reviewRequest(requestId: string, action: "APPROVE" | "REJECT") {
  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();

  if (!userResult.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userResult.user.id)
    .maybeSingle();

  if (profile?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only super admins can approve subscription payments." }, { status: 403 });
  }

  if (!(await isSuperAdminUnlocked(userResult.user.id))) {
    return NextResponse.json({ error: "Super admin password unlock required." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: upgradeRequest } = await admin
    .from("subscription_upgrade_requests")
    .select("id,restaurant_id,plan,amount,status,transaction_note,created_at")
    .eq("id", requestId)
    .maybeSingle();

  if (!upgradeRequest) {
    return NextResponse.json({ error: "Subscription request not found." }, { status: 404 });
  }

  if (upgradeRequest.status !== "VERIFICATION_PENDING") {
    return NextResponse.json({ error: "Only verification pending requests can be reviewed." }, { status: 409 });
  }

  if (action === "REJECT") {
    const { error } = await admin
      .from("subscription_upgrade_requests")
      .update({
        status: "REJECTED",
        verified_by: userResult.user.id,
        verified_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await writeAuditLog(admin, {
      actorId: userResult.user.id,
      restaurantId: upgradeRequest.restaurant_id,
      action: "subscription_payment_rejected",
      entity: "subscription_upgrade_requests",
      entityId: requestId,
      metadata: {
        plan: upgradeRequest.plan,
        amount: Number(upgradeRequest.amount),
      },
    });

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
        verified_by: userResult.user.id,
        verified_at: now.toISOString(),
      })
      .eq("id", requestId),
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

  await writeAuditLog(admin, {
    actorId: userResult.user.id,
    restaurantId: upgradeRequest.restaurant_id,
    action: "subscription_payment_approved",
    entity: "subscription_upgrade_requests",
    entityId: requestId,
    metadata: {
      plan: plan.id,
      amount: Number(upgradeRequest.amount),
      currentPeriodEndsAt: periodEnd.toISOString(),
    },
  });

  return NextResponse.json({ ok: true });
}

function toUpgradeRequestView(request: {
  id: string;
  plan: string;
  amount: number;
  status: string;
  transaction_note: string;
  created_at: string;
}) {
  return {
    id: request.id,
    plan: request.plan as PaidSubscriptionPlan,
    amount: Number(request.amount),
    status: request.status,
    transactionNote: request.transaction_note,
    createdAt: request.created_at,
  };
}
