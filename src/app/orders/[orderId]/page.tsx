import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FlickOrderLogo } from "@/components/brand/flickorder-logo";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { OrderDetail, OrderStatusTracker } from "@/components/customer/order-status-tracker";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrderDetails(orderId);

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-zinc-950">
      <header className="border-b border-zinc-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-zinc-900">
            <FlickOrderLogo className="h-8 w-8 rounded-lg shadow-sm" priority />
            <span className="text-lg">FlickOrder</span>
          </Link>
          <div className="flex items-center gap-3">
            {order?.restaurantSlug && order?.tableNumber ? (
              <Link
                href={`/menu/${order.restaurantSlug}/table/${order.tableNumber}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to menu
              </Link>
            ) : (
              <Link
                href="/explore"
                className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition"
              >
                Explore Restaurants
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <OrderStatusTracker initialOrder={order} />
      </section>

      <MarketingFooter />
    </main>
  );
}

async function getOrderDetails(orderId: string): Promise<OrderDetail | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = createAdminClient();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id,order_number,status,payment_status,subtotal,discount_total,tax_total,total,customer_name,created_at,restaurant_id,table_id")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return null;
    }

    const [itemsResult, restaurantResult, settingsResult, tableResult] = await Promise.all([
      supabase
        .from("order_items")
        .select("id,name_snapshot,unit_price,quantity,notes,options,total")
        .eq("order_id", order.id),
      supabase
        .from("restaurants")
        .select("name,slug")
        .eq("id", order.restaurant_id)
        .maybeSingle(),
      supabase
        .from("restaurant_settings")
        .select("upi_id,upi_display_name")
        .eq("restaurant_id", order.restaurant_id)
        .maybeSingle(),
      supabase
        .from("tables")
        .select("table_number")
        .eq("id", order.table_id)
        .maybeSingle(),
    ]);

    return {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      customerName: order.customer_name,
      subtotal: Number(order.subtotal ?? order.total),
      discountTotal: Number(order.discount_total ?? 0),
      taxTotal: Number(order.tax_total ?? 0),
      total: Number(order.total),
      createdAt: order.created_at,
      restaurantName: restaurantResult.data?.name ?? "Restaurant",
      restaurantSlug: restaurantResult.data?.slug ?? "",
      tableNumber: tableResult.data?.table_number ?? "1",
      upiId: settingsResult.data?.upi_id ?? null,
      upiDisplayName: settingsResult.data?.upi_display_name ?? null,
      items: (itemsResult.data ?? []).map((item) => ({
        id: item.id,
        name: item.name_snapshot,
        unitPrice: Number(item.unit_price),
        quantity: item.quantity,
        notes: item.notes,
        options: item.options,
        total: Number(item.total),
      })),
    };
  } catch {
    return null;
  }
}
