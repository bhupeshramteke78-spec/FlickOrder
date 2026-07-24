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
  action: z.enum(["APPROVE", "CANCEL"]),
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
    return NextResponse.json({ error: "Invalid deletion action." }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data: restaurant } = await admin
    .from("restaurants")
    .select("id,name,deletion_requested_at,deletion_reason,deleted_at")
    .eq("id", parsedParams.data.restaurantId)
    .maybeSingle();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  if (!restaurant.deletion_requested_at) {
    return NextResponse.json({ error: "This restaurant has not requested deletion." }, { status: 400 });
  }

  const update =
    payload.data.action === "APPROVE"
      ? {
          deleted_at: new Date().toISOString(),
          deleted_by: superAdmin.userId,
          is_open: false,
        }
      : {
          deletion_requested_at: null,
          deletion_requested_by: null,
          deletion_reason: null,
          deleted_at: null,
          deleted_by: null,
        };

  const { data: updatedRestaurant, error } = await admin
    .from("restaurants")
    .update(update)
    .eq("id", restaurant.id)
    .select("id,name,deletion_requested_at,deletion_reason,deleted_at")
    .single();

  if (error || !updatedRestaurant) {
    return NextResponse.json({ error: error?.message ?? "Unable to update deletion request." }, { status: 400 });
  }

  if (payload.data.action === "APPROVE") {
    await Promise.all([
      admin.from("restaurant_settings").update({ qr_ordering_enabled: false }).eq("restaurant_id", restaurant.id),
      admin.from("subscriptions").update({ status: "CANCELLED" }).eq("restaurant_id", restaurant.id),
    ]);
  }

  await writeAuditLog(admin, {
    actorId: superAdmin.userId,
    restaurantId: restaurant.id,
    action: payload.data.action === "APPROVE" ? "restaurant_deletion_approved" : "restaurant_deletion_cancelled",
    entity: "restaurants",
    entityId: restaurant.id,
    metadata: {
      restaurantName: restaurant.name,
      reason: restaurant.deletion_reason,
      requestedAt: restaurant.deletion_requested_at,
      deletedAt: updatedRestaurant.deleted_at,
    },
  });

  return NextResponse.json({ restaurant: updatedRestaurant });
}
