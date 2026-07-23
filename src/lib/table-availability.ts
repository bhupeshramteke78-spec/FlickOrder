import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type RestaurantAvailability = {
  totalTables: number;
  availableTables: number;
  availableSeats: number;
  isFull: boolean;
  label: string;
};

const activeOrderStatuses = ["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED"] as const;

export async function getRestaurantAvailabilityMap(
  supabase: SupabaseClient<Database>,
  restaurantIds: string[],
): Promise<Map<string, RestaurantAvailability>> {
  if (restaurantIds.length === 0) {
    return new Map();
  }

  const [{ data: tables }, { data: activeOrders }] = await Promise.all([
    supabase
      .from("tables")
      .select("id,restaurant_id,seats,status")
      .in("restaurant_id", restaurantIds),
    supabase
      .from("orders")
      .select("restaurant_id,table_id,status,payment_status")
      .in("restaurant_id", restaurantIds)
      .in("status", [...activeOrderStatuses])
      .neq("payment_status", "PAID"),
  ]);

  const activeTableIds = new Set((activeOrders ?? []).map((order) => order.table_id));
  const tablesByRestaurant = new Map<string, NonNullable<typeof tables>>();

  for (const table of tables ?? []) {
    const list = tablesByRestaurant.get(table.restaurant_id) ?? [];
    list.push(table);
    tablesByRestaurant.set(table.restaurant_id, list);
  }

  return new Map(
    restaurantIds.map((restaurantId) => {
      const restaurantTables = tablesByRestaurant.get(restaurantId) ?? [];
      const availableTables = restaurantTables.filter((table) => table.status === "AVAILABLE" && !activeTableIds.has(table.id));
      const availableSeats = availableTables.reduce((sum, table) => sum + table.seats, 0);

      return [
        restaurantId,
        {
          totalTables: restaurantTables.length,
          availableTables: availableTables.length,
          availableSeats,
          isFull: restaurantTables.length > 0 && availableTables.length === 0,
          label: formatAvailabilityLabel(restaurantTables.length, availableTables.length, availableSeats),
        },
      ];
    }),
  );
}

export function emptyAvailability(): RestaurantAvailability {
  return {
    totalTables: 0,
    availableTables: 0,
    availableSeats: 0,
    isFull: false,
    label: "Seating updates soon",
  };
}

function formatAvailabilityLabel(totalTables: number, availableTables: number, availableSeats: number) {
  if (totalTables === 0) {
    return "Seating updates soon";
  }

  if (availableTables === 0) {
    return "Currently full";
  }

  return `${availableTables} ${availableTables === 1 ? "table" : "tables"} available · ${availableSeats} seats`;
}
