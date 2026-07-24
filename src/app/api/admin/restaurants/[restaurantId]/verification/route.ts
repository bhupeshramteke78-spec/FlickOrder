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
  status: z.enum(["APPROVED", "REJECTED", "MORE_INFO_REQUIRED"]),
  note: z.string().max(500).optional(),
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
    return NextResponse.json({ error: "Invalid verification payload." }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data: restaurant } = await admin
    .from("restaurants")
    .select("id,name,verification_status")
    .eq("id", parsedParams.data.restaurantId)
    .maybeSingle();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  const { data: updatedRestaurant, error } = await admin
    .from("restaurants")
    .update({
      verification_status: payload.data.status,
      verification_note: payload.data.note?.trim() || null,
      verified_at: new Date().toISOString(),
      verified_by: superAdmin.userId,
    })
    .eq("id", restaurant.id)
    .select("id,name,verification_status,verification_note,verified_at")
    .single();

  if (error || !updatedRestaurant) {
    return NextResponse.json({ error: error?.message ?? "Unable to update restaurant verification." }, { status: 400 });
  }

  await writeAuditLog(admin, {
    actorId: superAdmin.userId,
    restaurantId: restaurant.id,
    action: "restaurant_verification_updated",
    entity: "restaurants",
    entityId: restaurant.id,
    metadata: {
      restaurantName: restaurant.name,
      previousStatus: restaurant.verification_status,
      status: updatedRestaurant.verification_status,
      note: updatedRestaurant.verification_note,
    },
  });

  return NextResponse.json({ restaurant: updatedRestaurant });
}
