import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSubscriptionAccessForRestaurantSlug } from "@/lib/subscription-access";
import { serviceRequestSchema } from "@/lib/validations/orders";

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit(request, {
    keyPrefix: "service-request",
    limit: 20,
    windowMs: 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const payload = serviceRequestSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid service request." }, { status: 422 });
  }

  const supabase = createAdminClient();
  const access = await getSubscriptionAccessForRestaurantSlug(supabase, payload.data.restaurantSlug);

  if (!access) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  if (!access.canUseQrOrdering) {
    return NextResponse.json({ error: access.message ?? "This restaurant is not accepting service requests right now." }, { status: 403 });
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", payload.data.restaurantSlug)
    .single();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  const { data: table } = await supabase
    .from("tables")
    .select("id")
    .eq("restaurant_id", restaurant.id)
    .eq("table_number", payload.data.tableNumber)
    .single();

  if (!table) {
    return NextResponse.json({ error: "Table not found." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("service_requests")
    .insert({
      restaurant_id: restaurant.id,
      table_id: table.id,
      order_id: payload.data.orderId ?? null,
      type: payload.data.type,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Unable to create service request." }, { status: 400 });
  }

  return NextResponse.json({ requestId: data.id }, { status: 201 });
}
