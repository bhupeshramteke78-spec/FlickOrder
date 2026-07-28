import { MobileMenuShell } from "@/components/customer/mobile-menu-shell";
import { CustomerMenuRealtimeRefresh } from "@/components/realtime/customer-menu-realtime-refresh";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type MenuCategory = {
  id: string;
  name: string;
};

type MenuItem = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  offerPrice: number | null;
  preparationTimeMinutes: number;
  foodType: "VEG" | "NON_VEG" | "EGG";
  isAvailable: boolean;
  isSoldOut: boolean;
  isPopular: boolean;
};

export default async function TableMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ restaurantSlug: string; tableNumber: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { restaurantSlug, tableNumber } = await params;
  const { preview } = await searchParams;
  const menu = await getRestaurantMenu(restaurantSlug);

  return (
    <>
      <CustomerMenuRealtimeRefresh restaurantId={menu.restaurantId} />
      <MobileMenuShell
        restaurantSlug={restaurantSlug}
        restaurantName={menu.restaurantName}
        upiId={menu.upiId}
        upiDisplayName={menu.upiDisplayName}
        tableNumber={tableNumber}
        categories={menu.categories}
        menuItems={menu.menuItems}
        mode={preview === "true" ? "preview" : "ordering"}
      />
    </>
  );
}

async function getRestaurantMenu(slug: string): Promise<{ restaurantId: string | null; restaurantName: string; upiId: string | null; upiDisplayName: string | null; categories: MenuCategory[]; menuItems: MenuItem[] }> {
  if (!isSupabaseConfigured()) {
    return { restaurantId: null, restaurantName: "Restaurant", upiId: null, upiDisplayName: null, categories: [], menuItems: [] };
  }

  const supabase = createAdminClient();
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id,name,verification_status,deletion_requested_at,deleted_at")
    .eq("slug", slug)
    .maybeSingle();

  if (
    restaurantError ||
    !restaurant ||
    restaurant.verification_status !== "APPROVED" ||
    restaurant.deletion_requested_at ||
    restaurant.deleted_at
  ) {
    return { restaurantId: null, restaurantName: "Restaurant", upiId: null, upiDisplayName: null, categories: [], menuItems: [] };
  }

  const [{ data: categoryRows }, { data: itemRows }] = await Promise.all([
    supabase
      .from("categories")
      .select("id,name,sort_order,is_active")
      .eq("restaurant_id", restaurant.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("menu_items")
      .select("id,category_id,name,description,image_url,price,offer_price,preparation_time_minutes,food_type,is_available,is_sold_out,is_popular,created_at")
      .eq("restaurant_id", restaurant.id)
      .order("created_at", { ascending: true }),
  ]);
  const settings = await getPublicMenuPaymentSettings(restaurant.id);

  const categoryById = new Map((categoryRows ?? []).map((category) => [category.id, category.name]));
  const categoryOrder = new Map((categoryRows ?? []).map((category, index) => [category.name, index]));

  const menuItems = (itemRows ?? []).map((item) => {
    const categoryName = categoryById.get(item.category_id) ?? inferCategoryName(item.name);

    return {
      id: item.id,
      categoryId: item.category_id,
      categoryName,
      name: item.name,
      description: item.description,
      imageUrl: item.image_url,
      price: Number(item.price),
      offerPrice: item.offer_price === null ? null : Number(item.offer_price),
      preparationTimeMinutes: item.preparation_time_minutes,
      foodType: item.food_type,
      isAvailable: item.is_available,
      isSoldOut: item.is_sold_out,
      isPopular: item.is_popular,
    };
  });

  const categories = Array.from(new Set(menuItems.map((item) => item.categoryName)))
    .sort((first, second) => {
      const firstIndex = categoryOrder.get(first) ?? Number.MAX_SAFE_INTEGER;
      const secondIndex = categoryOrder.get(second) ?? Number.MAX_SAFE_INTEGER;

      if (firstIndex !== secondIndex) {
        return firstIndex - secondIndex;
      }

      return first.localeCompare(second);
    })
    .map((name) => ({ id: slugifyCategory(name), name }));

  return {
    restaurantId: restaurant.id,
    restaurantName: sanitizeRestaurantName(restaurant.name),
    upiId: settings?.upi_id ?? null,
    upiDisplayName: settings?.upi_display_name ?? null,
    categories,
    menuItems,
  };
}

async function getPublicMenuPaymentSettings(restaurantId: string) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("restaurant_settings")
      .select("upi_id,upi_display_name")
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    return data;
  } catch {
    return null;
  }
}

function sanitizeRestaurantName(name: string) {
  return name.trim().replace(/(?:\s+|-)[a-f0-9]{8}$/i, "");
}

function inferCategoryName(itemName: string) {
  const normalized = itemName.toLowerCase();

  if (/(pizza|calzone)/.test(normalized)) {
    return "Pizza";
  }

  if (/(pasta|spaghetti|alfredo|arrabbiata|macaroni)/.test(normalized)) {
    return "Pasta";
  }

  if (/(coffee|tea|shake|juice|mojito|lassi|drink|beverage)/.test(normalized)) {
    return "Beverages";
  }

  if (/(dessert|cake|brownie|ice cream|gulab|rasmalai|sweet)/.test(normalized)) {
    return "Desserts";
  }

  if (/(starter|fries|tikka|kebab|nugget|garlic bread)/.test(normalized)) {
    return "Starters";
  }

  return "Menu";
}

function slugifyCategory(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
