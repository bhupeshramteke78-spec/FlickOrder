import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit-log";
import { getPaidSubscriptionPlan, type PaidSubscriptionPlan } from "@/lib/billing-plans";
import { hasPermission } from "@/lib/permissions";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdminUnlocked } from "@/lib/super-admin";

const paramsSchema = z.object({
  requestId: z.string().uuid(),
});
const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("SUBMIT_MANUAL_PAYMENT"),
    transactionId: z
      .string()
      .trim()
      .min(6, "Enter a valid UPI transaction ID.")
      .max(64, "UPI transaction ID is too long.")
      .regex(/^[a-zA-Z0-9-]+$/, "Use only letters, numbers, and hyphens."),
  }),
  z.object({ action: z.enum(["APPROVE", "REJECT"]) }),
]);

export async function PATCH(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const rateLimitResponse = await enforceRateLimit(request, {
    keyPrefix: "subscription-upgrade-update",
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

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

  if (payload.data.action === "SUBMIT_MANUAL_PAYMENT") {
    return submitManualPayment(parsedParams.data.requestId, payload.data.transactionId);
  }

  return reviewRequest(parsedParams.data.requestId, payload.data.action);
}

async function submitManualPayment(requestId: string, transactionId: string) {
  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();

  if (!userResult.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: upgradeRequest } = await supabase
    .from("subscription_upgrade_requests")
    .select("id,restaurant_id,plan,amount,status,payment_method,transaction_note,created_at")
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
    return NextResponse.json({ error: "Only pending payment requests can be submitted." }, { status: 409 });
  }

  if (upgradeRequest.payment_method !== "UPI") {
    return NextResponse.json({ error: "This is not a manual UPI payment request." }, { status: 409 });
  }

  const admin = createAdminClient();
  const normalizedTransactionId = transactionId.replaceAll(" ", "").toUpperCase();
  const { data: updatedRequest, error } = await admin
    .from("subscription_upgrade_requests")
    .update({
      status: "VERIFICATION_PENDING",
      transaction_id: normalizedTransactionId,
      payment_submitted_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq("id", requestId)
    .select("id,plan,amount,status,transaction_note,transaction_id,payment_submitted_at,created_at")
    .single();

  if (error || !updatedRequest) {
    const duplicateTransaction = error?.code === "23505";
    return NextResponse.json(
      { error: duplicateTransaction ? "This UPI transaction ID has already been submitted." : "Unable to submit payment for verification." },
      { status: duplicateTransaction ? 409 : 400 },
    );
  }

  await writeAuditLog(admin, {
    actorId: userResult.user.id,
    restaurantId: upgradeRequest.restaurant_id,
    action: "subscription_payment_submitted",
    entity: "subscription_upgrade_requests",
    entityId: requestId,
    metadata: {
      plan: upgradeRequest.plan,
      amount: Number(upgradeRequest.amount),
      transactionId: normalizedTransactionId,
    },
  });

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
        rejection_reason: "Payment could not be verified.",
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

  const { error } = await admin.rpc("activate_subscription_payment", {
    p_request_id: requestId,
    p_payment_id: null,
    p_signature: null,
    p_verified_by: userResult.user.id,
    p_webhook_event_id: null,
  });

  if (error) {
    return NextResponse.json({ error: "Unable to activate the approved subscription." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
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
