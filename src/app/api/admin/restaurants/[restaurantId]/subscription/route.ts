import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSuperAdminContext, isSuperAdminUnlocked } from "@/lib/super-admin";

const paramsSchema = z.object({
  restaurantId: z.string().uuid(),
});

const bodySchema = z.object({
  plan: z.enum(["trial", "basic", "growth", "pro"]),
  status: z.enum(["TRIALING", "ACTIVE", "EXPIRED", "CANCELLED"]),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ restaurantId: string }> }) {
  const parsedParams = paramsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid restaurant id." }, { status: 422 });
  }

  const supabase = await createClient();
  const superAdmin = await getSuperAdminContext(supabase);

  if (!superAdmin) {
    return NextResponse.json({ error: "SUPER_ADMIN access required." }, { status: 403 });
  }

  if (!(await isSuperAdminUnlocked(superAdmin.userId))) {
    return NextResponse.json({ error: "Super admin password unlock required." }, { status: 403 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const payload = bodySchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid subscription payload." }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data: restaurant } = await admin
    .from("restaurants")
    .select("id,name")
    .eq("id", parsedParams.data.restaurantId)
    .maybeSingle();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  const now = new Date();
  const currentPeriodEndsAt =
    payload.data.status === "ACTIVE"
      ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;
  const trialEndsAt =
    payload.data.status === "TRIALING"
      ? new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const { data: subscription, error } = await admin
    .from("subscriptions")
    .update({
      plan: payload.data.plan,
      status: payload.data.status,
      trial_ends_at: trialEndsAt,
      current_period_ends_at: currentPeriodEndsAt,
    })
    .eq("restaurant_id", restaurant.id)
    .select("plan,status,trial_ends_at,current_period_ends_at,updated_at")
    .single();

  if (error || !subscription) {
    return NextResponse.json({ error: error?.message ?? "Unable to update subscription." }, { status: 400 });
  }

  await writeAuditLog(admin, {
    actorId: superAdmin.userId,
    restaurantId: restaurant.id,
    action: "subscription_status_updated",
    entity: "subscriptions",
    entityId: restaurant.id,
    metadata: {
      restaurantName: restaurant.name,
      plan: subscription.plan,
      status: subscription.status,
      trialEndsAt: subscription.trial_ends_at,
      currentPeriodEndsAt: subscription.current_period_ends_at,
    },
  });

  return NextResponse.json({ subscription });
}
