import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createOrderSchema } from "@/lib/validations/orders";
import { calculateAndCreateOrder } from "@/lib/services/orders";
import { notifyRestaurantNewOrder } from "@/lib/push-notifications";
import { getSubscriptionAccessForRestaurantSlug } from "@/lib/subscription-access";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit(request, {
    keyPrefix: "create-order",
    limit: 30,
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

  const payload = createOrderSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid order payload.", details: payload.error.flatten() }, { status: 422 });
  }

  try {
    const supabase = createAdminClient();
    const access = await getSubscriptionAccessForRestaurantSlug(supabase, payload.data.restaurantSlug);

    if (!access) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    if (!access.canUseQrOrdering) {
      return NextResponse.json({ error: access.message ?? "This restaurant is not accepting QR orders right now." }, { status: 403 });
    }

    const order = await calculateAndCreateOrder(supabase, payload.data);
    await notifyRestaurantNewOrder(supabase, order.id);

    return NextResponse.json({ orderId: order.id, orderNumber: order.order_number }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to place order." }, { status: 400 });
  }
}
