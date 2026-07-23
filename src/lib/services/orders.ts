import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/database.types";
import type { AddOrderItemsInput, CreateOrderInput } from "@/lib/validations/orders";

type OrderInputItem = CreateOrderInput["items"][number];

async function buildValidatedOrderItems(
  supabase: SupabaseClient<Database>,
  restaurantId: string,
  inputItems: OrderInputItem[],
) {
  const itemIds = inputItems.map((item) => item.menuItemId);
  const { data: menuItems, error: menuError } = await supabase
    .from("menu_items")
    .select("id,name,price,offer_price,is_available,is_sold_out")
    .eq("restaurant_id", restaurantId)
    .in("id", itemIds);

  if (menuError || !menuItems) {
    throw new Error("Unable to validate menu items.");
  }

  const menuById = new Map(menuItems.map((item) => [item.id, item]));

  return inputItems.map((item) => {
    const menuItem = menuById.get(item.menuItemId);

    if (!menuItem || !menuItem.is_available || menuItem.is_sold_out) {
      throw new Error("One or more items are unavailable.");
    }

    const unitPrice = menuItem.offer_price ?? menuItem.price;

    return {
      menu_item_id: menuItem.id,
      name_snapshot: menuItem.name,
      unit_price: unitPrice,
      quantity: item.quantity,
      notes: item.notes ?? null,
      options: item.options,
      total: unitPrice * item.quantity,
    };
  });
}

export async function calculateAndCreateOrder(
  supabase: SupabaseClient<Database>,
  input: CreateOrderInput,
) {
  const { data, error } = await supabase.rpc("create_qr_order_transaction", {
    p_restaurant_slug: input.restaurantSlug,
    p_table_number: input.tableNumber,
    p_customer_name: input.customerName,
    p_guest_count: input.guestCount,
    p_kitchen_notes: input.kitchenNotes ?? null,
    p_items: input.items.map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      notes: item.notes ?? null,
      options: item.options,
    })) satisfies Json,
  });

  const order = data?.[0];

  if (error || !order) {
    throw new Error(error?.message ?? "Unable to create order.");
  }

  return {
    id: order.order_id,
    order_number: order.order_number,
  };
}

export async function appendItemsToUnpaidOrder(
  supabase: SupabaseClient<Database>,
  orderId: string,
  input: AddOrderItemsInput,
) {
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", input.restaurantSlug)
    .single();

  if (restaurantError || !restaurant) {
    throw new Error("Restaurant not found.");
  }

  const { data: table, error: tableError } = await supabase
    .from("tables")
    .select("id")
    .eq("restaurant_id", restaurant.id)
    .eq("table_number", input.tableNumber)
    .single();

  if (tableError || !table) {
    throw new Error("Table not found.");
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,restaurant_id,table_id,payment_status,discount_total")
    .eq("id", orderId)
    .eq("restaurant_id", restaurant.id)
    .eq("table_id", table.id)
    .maybeSingle();

  if (orderError || !order) {
    throw new Error("Order not found.");
  }

  if (order.payment_status !== "UNPAID") {
    throw new Error("Add more items is available only before payment starts.");
  }

  const orderItems = await buildValidatedOrderItems(supabase, restaurant.id, input.items);

  const { error: itemsError } = await supabase.from("order_items").insert(
    orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    })),
  );

  if (itemsError) {
    throw new Error("Unable to add items to order.");
  }

  const { data: allItems, error: allItemsError } = await supabase
    .from("order_items")
    .select("total")
    .eq("order_id", order.id);

  if (allItemsError || !allItems) {
    throw new Error("Unable to recalculate order total.");
  }

  const subtotal = allItems.reduce((sum, item) => sum + Number(item.total), 0);
  const discountTotal = Number(order.discount_total ?? 0);
  const { data: settings } = await supabase
    .from("restaurant_settings")
    .select("tax_rate")
    .eq("restaurant_id", restaurant.id)
    .single();
  const taxTotal = subtotal * ((settings?.tax_rate ?? 0) / 100);
  const total = subtotal - discountTotal + taxTotal;

  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update({
      subtotal,
      discount_total: discountTotal,
      tax_total: taxTotal,
      total,
    })
    .eq("id", order.id)
    .select("id,order_number,status,payment_status,total")
    .single();

  if (updateError || !updatedOrder) {
    throw new Error("Unable to update order total.");
  }

  return updatedOrder;
}
