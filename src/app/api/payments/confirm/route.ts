import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/permissions";
import { getSubscriptionAccessForRestaurantId, hasPlanFeature } from "@/lib/subscription-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { confirmPaymentSchema } from "@/lib/validations/orders";

export async function POST(request: Request) {
  const payload = confirmPaymentSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payment payload." }, { status: 422 });
  }

  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();

  if (!user.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("restaurant_id,order_id")
    .eq("id", payload.data.paymentId)
    .eq("order_id", payload.data.orderId)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from("restaurant_members")
    .select("role")
    .eq("restaurant_id", payment.restaurant_id)
    .eq("profile_id", user.user.id)
    .maybeSingle();

  if (!membership || !hasPermission(membership.role, "confirmPayments")) {
    return NextResponse.json({ error: "You do not have access to confirm this payment." }, { status: 403 });
  }

  const access = await getSubscriptionAccessForRestaurantId(supabase, payment.restaurant_id);

  if (!hasPlanFeature(access, "liveOrders")) {
    return NextResponse.json({ error: access.message ?? "Basic plan or higher required to confirm payments." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("table_id,restaurant_id")
    .eq("id", payment.order_id)
    .eq("restaurant_id", payment.restaurant_id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const { error: paymentError } = await admin
    .from("payments")
    .update({ status: "PAID", confirmed_by: user.user.id })
    .eq("id", payload.data.paymentId)
    .eq("order_id", payload.data.orderId);

  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 400 });
  }

  const { error: orderError } = await admin
    .from("orders")
    .update({ payment_status: "PAID", status: "COMPLETED" })
    .eq("id", payload.data.orderId);

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 400 });
  }

  const { error: tableError } = await admin
    .from("tables")
    .update({ status: "AVAILABLE" })
    .eq("id", order.table_id)
    .eq("restaurant_id", order.restaurant_id);

  if (tableError) {
    return NextResponse.json({ error: tableError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
