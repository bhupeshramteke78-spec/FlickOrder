import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit-log";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  restaurantName: z.string().min(2).max(120),
  reason: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const payload = requestSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid deletion request details." }, { status: 422 });
  }

  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!userResult.user || !context) {
    return NextResponse.json({ error: "Restaurant owner session required." }, { status: 401 });
  }

  if (context.selected.memberRole !== "OWNER") {
    return NextResponse.json({ error: "Only the restaurant owner can request account deletion." }, { status: 403 });
  }

  if (payload.data.restaurantName.trim() !== context.selected.restaurantName) {
    return NextResponse.json({ error: "Type the restaurant name exactly to request deletion." }, { status: 422 });
  }

  const admin = createAdminClient();
  const requestedAt = new Date().toISOString();
  const { data: restaurant, error } = await admin
    .from("restaurants")
    .update({
      deletion_requested_at: requestedAt,
      deletion_requested_by: userResult.user.id,
      deletion_reason: payload.data.reason?.trim() || null,
      is_open: false,
    })
    .eq("id", context.selected.restaurantId)
    .is("deleted_at", null)
    .select("id,name,deletion_requested_at,deletion_reason")
    .single();

  if (error || !restaurant) {
    return NextResponse.json({ error: error?.message ?? "Unable to request restaurant deletion." }, { status: 400 });
  }

  await admin
    .from("restaurant_settings")
    .update({ qr_ordering_enabled: false })
    .eq("restaurant_id", restaurant.id);

  await writeAuditLog(admin, {
    actorId: userResult.user.id,
    restaurantId: restaurant.id,
    action: "restaurant_deletion_requested",
    entity: "restaurants",
    entityId: restaurant.id,
    metadata: {
      restaurantName: restaurant.name,
      reason: restaurant.deletion_reason,
      requestedAt: restaurant.deletion_requested_at,
    },
  });

  return NextResponse.json({ restaurant });
}
