import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentIntentSchema } from "@/lib/validations/orders";

const paymentRequestSchema = paymentIntentSchema.extend({
  customerName: z.string().trim().min(2).max(80),
});

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit(request, {
    keyPrefix: "payment-request",
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

  const payload = paymentRequestSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payment request.", details: payload.error.flatten() }, { status: 422 });
  }

  const supabase = createAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,restaurant_id,order_number,total,payment_status,customer_name,status")
    .eq("id", payload.data.orderId)
    .maybeSingle();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.payment_status === "PAID") {
    return NextResponse.json({ error: "This order is already paid." }, { status: 409 });
  }

  if (order.status !== "SERVED") {
    return NextResponse.json({ error: "Payment opens after the waiter marks this order served." }, { status: 409 });
  }

  const customerName = order.customer_name?.trim() || payload.data.customerName;
  const transactionNote = `FlickOrder ${order.order_number} - ${customerName}`;
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      restaurant_id: order.restaurant_id,
      order_id: order.id,
      method: payload.data.method,
      amount: Number(order.total),
      transaction_note: transactionNote,
    })
    .select("id,method,status,transaction_note")
    .single();

  if (paymentError || !payment) {
    return NextResponse.json({ error: paymentError?.message ?? "Unable to create payment request." }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ payment_status: "VERIFICATION_PENDING" })
    .eq("id", order.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({
    paymentId: payment.id,
    method: payment.method,
    status: payment.status,
    transactionNote: payment.transaction_note,
  }, { status: 201 });
}
