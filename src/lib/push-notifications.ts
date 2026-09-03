import webpush, { type PushSubscription } from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { formatCurrency } from "@/lib/utils";


type BookingNotification = {
  id: string;
  restaurantId: string;
  customerName: string;
  partySize: number;
  bookingDate: string;
  bookingTime: string;
};

let isConfigured = false;

function configureWebPush() {
  if (isConfigured) {
    return true;
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:bhupeshramteke78@gmail.com";

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  isConfigured = true;

  return true;
}

export function isPushConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export async function notifyRestaurantNewOrder(
  supabase: SupabaseClient<Database>,
  orderId: string,
) {
  if (!configureWebPush()) {
    return;
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id,restaurant_id,table_id,order_number,total,customer_name")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    return;
  }

  const { data: table } = order.table_id
    ? await supabase
        .from("tables")
        .select("table_number")
        .eq("id", order.table_id)
        .maybeSingle()
    : { data: null };

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth")
    .eq("restaurant_id", order.restaurant_id);

  if (!subscriptions || subscriptions.length === 0) {
    return;
  }

  const tableLabel = table?.table_number ? `Table ${table.table_number}` : "Table order";
  const orderNumber = order.order_number ? `#${order.order_number}` : "New order";
  const customerName = order.customer_name?.trim() || "Customer";
  const total = formatCurrency(Number(order.total ?? 0));
  const payload = JSON.stringify({
    title: "New FlickOrder order",
    body: `${orderNumber} - ${tableLabel} - ${customerName} - ${total}`,
    url: "/dashboard/orders",
    tag: `new-order-${order.id}`,
  });

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      const pushSubscription: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (error) {
        const statusCode = typeof error === "object" && error !== null && "statusCode" in error
          ? Number((error as { statusCode?: number }).statusCode)
          : null;

        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
        }
      }
    }),
  );
}

export async function notifyRestaurantNewBooking(
  supabase: SupabaseClient<Database>,
  booking: BookingNotification,
) {
  if (!configureWebPush()) {
    return;
  }

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth")
    .eq("restaurant_id", booking.restaurantId);

  if (!subscriptions || subscriptions.length === 0) {
    return;
  }

  const payload = JSON.stringify({
    title: "New table booking",
    body: `${booking.customerName} - ${booking.partySize} guests - ${booking.bookingDate} at ${booking.bookingTime}`,
    url: "/dashboard/bookings",
    tag: `new-booking-${booking.id}`,
  });

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      const pushSubscription: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (error) {
        const statusCode = typeof error === "object" && error !== null && "statusCode" in error
          ? Number((error as { statusCode?: number }).statusCode)
          : null;

        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
        }
      }
    }),
  );
}
