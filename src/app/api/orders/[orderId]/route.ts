import { NextResponse } from "next/server";
import { z } from "zod";
import { appendItemsToUnpaidOrder } from "@/lib/services/orders";
import { hasPermission } from "@/lib/permissions";
import { getSubscriptionAccessForRestaurantId, getSubscriptionAccessForRestaurantSlug, hasPlanFeature } from "@/lib/subscription-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { addOrderItemsSchema } from "@/lib/validations/orders";

const paramsSchema = z.object({
  orderId: z.string().uuid(),
});
const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"]).optional(),
  paymentStatus: z.enum(["PAID"]).optional(),
}).refine((input) => input.status || input.paymentStatus, {
  message: "Order status or payment status is required.",
});
const addOrderItemsPayloadSchema = addOrderItemsSchema.extend({
  action: z.literal("ADD_ITEMS"),
});

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const parsedParams = paramsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid order id." }, { status: 422 });
  }

  const supabase = createAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,order_number,status,payment_status,total,created_at")
    .eq("id", parsedParams.data.orderId)
    .maybeSingle();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("id,method,status,amount,transaction_note,created_at")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    order: {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      total: Number(order.total),
      createdAt: order.created_at,
    },
    payment: payment
      ? {
          id: payment.id,
          method: payment.method,
          status: payment.status,
          amount: Number(payment.amount),
          transactionNote: payment.transaction_note,
          createdAt: payment.created_at,
        }
      : null,
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const parsedParams = paramsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid order id." }, { status: 422 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const addItemsPayload = addOrderItemsPayloadSchema.safeParse(body);

  if (addItemsPayload.success) {
    try {
      const supabase = createAdminClient();
      const access = await getSubscriptionAccessForRestaurantSlug(supabase, addItemsPayload.data.restaurantSlug);

      if (!access) {
        return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
      }

      if (!access.canUseQrOrdering) {
        return NextResponse.json({ error: access.message ?? "This restaurant is not accepting QR orders right now." }, { status: 403 });
      }

      const order = await appendItemsToUnpaidOrder(supabase, parsedParams.data.orderId, addItemsPayload.data);

      return NextResponse.json({
        order: {
          id: order.id,
          orderNumber: order.order_number,
          status: order.status,
          paymentStatus: order.payment_status,
          total: Number(order.total),
        },
      });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to add items to order." }, { status: 400 });
    }
  }

  const payload = updateOrderStatusSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid order status." }, { status: 422 });
  }

  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();

  if (!userResult.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("restaurant_id,table_id,order_number,total,status")
    .eq("id", parsedParams.data.orderId)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from("restaurant_members")
    .select("role")
    .eq("restaurant_id", order.restaurant_id)
    .eq("profile_id", userResult.user.id)
    .maybeSingle();

  if (!membership || !hasPermission(membership.role, "viewOrders")) {
    return NextResponse.json({ error: "You do not have access to update this order." }, { status: 403 });
  }

  const access = await getSubscriptionAccessForRestaurantId(supabase, order.restaurant_id);

  if (!hasPlanFeature(access, "liveOrders")) {
    return NextResponse.json({ error: access.message ?? "Basic plan or higher required to update orders." }, { status: 403 });
  }

  if (payload.data.paymentStatus === "PAID") {
    if (!hasPermission(membership.role, "confirmPayments")) {
      return NextResponse.json({ error: "You do not have access to accept payments." }, { status: 403 });
    }

    if (order.status !== "SERVED") {
      return NextResponse.json({ error: "Payment can be accepted only after the order is served." }, { status: 409 });
    }

    const admin = createAdminClient();
    const { data: existingPayment } = await admin
      .from("payments")
      .select("id")
      .eq("order_id", parsedParams.data.orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingPayment) {
      const { error: paymentError } = await admin
        .from("payments")
        .update({ status: "PAID", confirmed_by: userResult.user.id })
        .eq("id", existingPayment.id);

      if (paymentError) {
        return NextResponse.json({ error: paymentError.message }, { status: 400 });
      }
    } else {
      const { error: paymentError } = await admin.from("payments").insert({
        restaurant_id: order.restaurant_id,
        order_id: parsedParams.data.orderId,
        method: "CASH",
        status: "PAID",
        amount: Number(order.total),
        transaction_note: `Payment accepted for ${order.order_number}`,
        confirmed_by: userResult.user.id,
      });

      if (paymentError) {
        return NextResponse.json({ error: paymentError.message }, { status: 400 });
      }
    }

    const { error: orderPaymentError } = await admin
      .from("orders")
      .update({ payment_status: "PAID", status: "COMPLETED" })
      .eq("id", parsedParams.data.orderId);

    if (orderPaymentError) {
      return NextResponse.json({ error: orderPaymentError.message }, { status: 400 });
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

  const transitionError = validateOrderTransition({
    currentStatus: order.status,
    nextStatus: payload.data.status,
    role: membership.role,
  });

  if (transitionError) {
    return NextResponse.json({ error: transitionError }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("orders")
    .update({ status: payload.data.status })
    .eq("id", parsedParams.data.orderId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

function validateOrderTransition({
  currentStatus,
  nextStatus,
  role,
}: {
  currentStatus: string;
  nextStatus?: string;
  role: string;
}) {
  if (!nextStatus) {
    return null;
  }

  if (nextStatus === "CANCELLED") {
    return hasPermission(role, "acceptOrders") ? null : "Only admin can cancel orders.";
  }

  const expectedTransitions: Record<string, { from: string; permission: Parameters<typeof hasPermission>[1]; error: string }> = {
    ACCEPTED: {
      from: "PENDING",
      permission: "acceptOrders",
      error: "Only admin can accept pending orders.",
    },
    PREPARING: {
      from: "ACCEPTED",
      permission: "prepareOrders",
      error: "Only kitchen can start accepted orders.",
    },
    READY: {
      from: "PREPARING",
      permission: "prepareOrders",
      error: "Only kitchen can mark an order prepared.",
    },
    SERVED: {
      from: "READY",
      permission: "serveOrders",
      error: "Only waiter can mark prepared orders as served.",
    },
  };

  const transition = expectedTransitions[nextStatus];

  if (!transition) {
    return "This order status change is not allowed from the dashboard.";
  }

  if (!hasPermission(role, transition.permission)) {
    return transition.error;
  }

  if (currentStatus !== transition.from) {
    return `Order must be ${formatApiStatus(transition.from)} before moving to ${formatApiStatus(nextStatus)}.`;
  }

  return null;
}

function formatApiStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}
