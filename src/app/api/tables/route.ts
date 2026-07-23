import { NextResponse } from "next/server";
import { z } from "zod";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import { hasPermission } from "@/lib/permissions";
import { getSubscriptionAccessForRestaurantId, hasPlanFeature } from "@/lib/subscription-access";
import { createClient } from "@/lib/supabase/server";

const tableSchema = z.object({
  tableNumber: z.string().min(1).max(40),
  seats: z.number().int().min(1).max(100),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const payload = tableSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid table details.", details: payload.error.flatten() }, { status: 422 });
  }

  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context) {
    return NextResponse.json({ error: "Restaurant membership not found." }, { status: 404 });
  }

  const membership = {
    restaurant_id: context.selected.restaurantId,
    role: context.selected.memberRole,
  };

  if (!hasPermission(membership.role, "manageTables")) {
    return NextResponse.json({ error: "Only owners and managers can manage tables." }, { status: 403 });
  }

  const access = await getSubscriptionAccessForRestaurantId(supabase, membership.restaurant_id);

  if (!hasPlanFeature(access, "tableManagement")) {
    return NextResponse.json({ error: access.message ?? "Basic plan or higher required to manage tables." }, { status: 403 });
  }

  const { data: table, error } = await supabase
    .from("tables")
    .upsert(
      {
        restaurant_id: membership.restaurant_id,
        table_number: payload.data.tableNumber,
        seats: payload.data.seats,
      },
      { onConflict: "restaurant_id,table_number" },
    )
    .select("id")
    .single();

  if (error || !table) {
    return NextResponse.json({ error: error?.message ?? "Unable to save table." }, { status: 400 });
  }

  return NextResponse.json({ tableId: table.id }, { status: 201 });
}
