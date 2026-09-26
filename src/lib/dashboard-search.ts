import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import type { FoodType, OrderStatus, PaymentStatus } from "@/lib/database.types";
import { getOrderCustomerName } from "@/lib/orders-types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type SearchedDishOrder = {
  orderId: string;
  orderNumber: string;
  tableNumber: string;
  customerName: string;
  quantity: number;
  unitPrice: number;
  itemTotal: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
};

export type SearchedDishResult = {
  id: string;
  name: string;
  categoryName: string;
  foodType: FoodType;
  price: number;
  offerPrice: number | null;
  description: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  isSoldOut: boolean;
  isPopular: boolean;
  preparationTimeMinutes: number;
  stats: {
    totalQuantityOrdered: number;
    totalRevenue: number;
    uniqueOrdersCount: number;
  };
  orders: SearchedDishOrder[];
};

export type SearchedDirectOrderResult = {
  id: string;
  orderNumber: string;
  tableNumber: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  guestCount: number;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
};

export type DashboardSearchResults = {
  query: string;
  dishes: SearchedDishResult[];
  orders: SearchedDirectOrderResult[];
};

export async function getDashboardSearchResults(rawQuery: string): Promise<DashboardSearchResults> {
  const query = (rawQuery || "").trim();
  if (!query || !isSupabaseConfigured()) {
    return { query, dishes: [], orders: [] };
  }

  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context?.selected?.restaurantId) {
    return { query, dishes: [], orders: [] };
  }

  const restaurantId = context.selected.restaurantId;
  const normalizedQuery = query.toLowerCase();

  // 1. Fetch menu items & categories for this restaurant
  const [{ data: menuItems }, { data: categories }, { data: allOrders }] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id,name,description,price,offer_price,preparation_time_minutes,food_type,is_available,is_sold_out,is_popular,category_id,image_url")
      .eq("restaurant_id", restaurantId),
    supabase
      .from("categories")
      .select("id,name")
      .eq("restaurant_id", restaurantId),
    supabase
      .from("orders")
      .select("id,order_number,table_id,status,payment_status,total,guest_count,customer_name,kitchen_notes,created_at")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const categoryNameById = new Map<string, string>(
    (categories ?? []).map((cat) => [cat.id, cat.name]),
  );

  const orderById = new Map<string, (typeof allOrders extends (infer T)[] | null ? T : never)>();
  const orderIds: string[] = [];
  const tableIds: string[] = [];

  for (const order of allOrders ?? []) {
    orderById.set(order.id, order);
    orderIds.push(order.id);
    if (order.table_id) {
      tableIds.push(order.table_id);
    }
  }

  // 2. Fetch tables and order items
  const [{ data: tables }, { data: orderItems }] = await Promise.all([
    tableIds.length > 0
      ? supabase
          .from("tables")
          .select("id,table_number")
          .in("id", Array.from(new Set(tableIds)))
      : Promise.resolve({ data: [] }),
    orderIds.length > 0
      ? supabase
          .from("order_items")
          .select("id,order_id,menu_item_id,name_snapshot,unit_price,quantity,total")
          .in("order_id", orderIds)
      : Promise.resolve({ data: [] }),
  ]);

  const tableNumberById = new Map<string, string>(
    (tables ?? []).map((t) => [t.id, t.table_number]),
  );

  // 3. Find matching dishes
  const matchedMenuItems = (menuItems ?? []).filter((item) => {
    const nameMatch = item.name.toLowerCase().includes(normalizedQuery);
    const descMatch = item.description?.toLowerCase().includes(normalizedQuery);
    const catName = categoryNameById.get(item.category_id)?.toLowerCase() || "";
    const catMatch = catName.includes(normalizedQuery);
    return nameMatch || descMatch || catMatch;
  });

  // Map order items by dish name and menu_item_id
  const dishResults: SearchedDishResult[] = matchedMenuItems.map((dish) => {
    const dishNormalizedName = dish.name.toLowerCase().trim();
    const matchingOrderItems = (orderItems ?? []).filter((oi) => {
      if (oi.menu_item_id === dish.id) return true;
      if (oi.name_snapshot && oi.name_snapshot.toLowerCase().trim() === dishNormalizedName) return true;
      return false;
    });

    let totalQuantity = 0;
    let totalRevenue = 0;
    const uniqueOrdersSet = new Set<string>();
    const dishOrders: SearchedDishOrder[] = [];

    for (const oi of matchingOrderItems) {
      const order = orderById.get(oi.order_id);
      if (!order) continue;

      const qty = oi.quantity || 1;
      const unitPrice = Number(oi.unit_price || dish.offer_price || dish.price || 0);
      const itemTotal = Number(oi.total ?? unitPrice * qty);

      totalQuantity += qty;
      totalRevenue += itemTotal;
      uniqueOrdersSet.add(order.id);

      const tableNum = order.table_id ? (tableNumberById.get(order.table_id) ?? "Table") : "Table";
      const custName = getOrderCustomerName({
        customerName: order.customer_name,
        kitchenNotes: order.kitchen_notes,
      });

      dishOrders.push({
        orderId: order.id,
        orderNumber: order.order_number,
        tableNumber: tableNum,
        customerName: custName,
        quantity: qty,
        unitPrice,
        itemTotal,
        orderStatus: order.status,
        paymentStatus: order.payment_status,
        createdAt: order.created_at,
      });
    }

    return {
      id: dish.id,
      name: dish.name,
      categoryName: categoryNameById.get(dish.category_id) || "General",
      foodType: dish.food_type,
      price: dish.price,
      offerPrice: dish.offer_price,
      description: dish.description,
      imageUrl: dish.image_url,
      isAvailable: dish.is_available,
      isSoldOut: dish.is_sold_out,
      isPopular: dish.is_popular,
      preparationTimeMinutes: dish.preparation_time_minutes,
      stats: {
        totalQuantityOrdered: totalQuantity,
        totalRevenue,
        uniqueOrdersCount: uniqueOrdersSet.size,
      },
      orders: dishOrders,
    };
  });

  // 4. Also check if query matches order number, customer name, or table number directly
  const matchedDirectOrders: SearchedDirectOrderResult[] = [];
  for (const order of allOrders ?? []) {
    const custName = getOrderCustomerName({
      customerName: order.customer_name,
      kitchenNotes: order.kitchen_notes,
    });
    const tableNum = order.table_id ? (tableNumberById.get(order.table_id) ?? "") : "";
    const orderNum = order.order_number || "";

    const isOrderMatch =
      orderNum.toLowerCase().includes(normalizedQuery) ||
      custName.toLowerCase().includes(normalizedQuery) ||
      (tableNum && `table ${tableNum}`.toLowerCase().includes(normalizedQuery)) ||
      (tableNum && tableNum.toLowerCase() === normalizedQuery);

    if (isOrderMatch) {
      const itemsInOrder = (orderItems ?? [])
        .filter((oi) => oi.order_id === order.id)
        .map((oi) => ({
          name: oi.name_snapshot,
          quantity: oi.quantity,
          unitPrice: Number(oi.unit_price || 0),
          total: Number(oi.total ?? Number(oi.unit_price || 0) * oi.quantity),
        }));

      matchedDirectOrders.push({
        id: order.id,
        orderNumber: order.order_number,
        tableNumber: tableNum || "Table",
        customerName: custName,
        total: order.total,
        status: order.status,
        paymentStatus: order.payment_status,
        guestCount: order.guest_count,
        createdAt: order.created_at,
        items: itemsInOrder,
      });
    }
  }

  return {
    query,
    dishes: dishResults,
    orders: matchedDirectOrders,
  };
}
