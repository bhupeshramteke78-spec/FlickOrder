import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { parseItemVariants } from "@/lib/item-variants";
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
    .select("id,name,description,price,offer_price,is_available,is_sold_out")
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

    const parsedVariants = parseItemVariants(menuItem.description);
    let unitPrice = menuItem.offer_price ?? menuItem.price;
    let nameSnapshot = menuItem.name;

    if (parsedVariants.hasPortions && item.options.length > 0) {
      const matchedPortion = parsedVariants.portions.find((p) => item.options.includes(p.name));
      if (matchedPortion) {
        unitPrice = matchedPortion.price;
        nameSnapshot = `${menuItem.name} (${matchedPortion.name})`;
      }
    }

    return {
      menu_item_id: menuItem.id,
      name_snapshot: nameSnapshot,
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
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, is_open")
    .eq("slug", input.restaurantSlug)
    .single();

  if (restaurantError || !restaurant || !restaurant.is_open) {
    throw new Error("Restaurant not found or closed.");
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

  const [{ data: settings }, validatedItems] = await Promise.all([
    supabase
      .from("restaurant_settings")
      .select("tax_rate")
      .eq("restaurant_id", restaurant.id)
      .maybeSingle(),
    buildValidatedOrderItems(supabase, restaurant.id, input.items),
  ]);

  const taxRate = Number(settings?.tax_rate ?? 0);
  const subtotal = validatedItems.reduce((acc, item) => acc + item.total, 0);
  const taxTotal = Math.round((subtotal * (taxRate / 100)) * 100) / 100;
  const total = subtotal + taxTotal;
  const orderNumber = `FO-${Date.now()}`;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      restaurant_id: restaurant.id,
      table_id: table.id,
      order_number: orderNumber,
      customer_name: input.customerName.trim(),
      guest_count: input.guestCount,
      kitchen_notes: input.kitchenNotes?.trim() || null,
      subtotal,
      discount_total: 0,
      tax_total: taxTotal,
      total,
      status: "PENDING",
      payment_status: "UNPAID",
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message ?? "Unable to create order.");
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    validatedItems.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      name_snapshot: item.name_snapshot,
      unit_price: item.unit_price,
      quantity: item.quantity,
      notes: item.notes,
      options: item.options,
      total: item.total,
    })),
  );

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  await supabase
    .from("tables")
    .update({ status: "OCCUPIED" })
    .eq("id", table.id);

  return {
    id: order.id,
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
