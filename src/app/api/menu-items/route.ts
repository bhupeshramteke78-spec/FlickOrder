import { NextResponse } from "next/server";
import { z } from "zod";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import { hasPermission } from "@/lib/permissions";
import { getSubscriptionAccessForRestaurantId, hasPlanFeature } from "@/lib/subscription-access";
import { createClient } from "@/lib/supabase/server";

const createMenuItemSchema = z.object({
  name: z.string().min(2).max(140),
  category: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  price: z.number().min(0),
  offerPrice: z.number().min(0).optional().nullable(),
  preparationTimeMinutes: z.number().int().min(1).max(240),
  foodType: z.enum(["VEG", "NON_VEG", "EGG"]),
  isAvailable: z.boolean().default(true),
  isPopular: z.boolean().default(false),
});

const updateMenuItemSchema = createMenuItemSchema.extend({
  id: z.string().uuid(),
});

const toggleAvailabilitySchema = z.object({
  id: z.string().uuid(),
  isAvailable: z.boolean(),
});

async function getEditableMembership() {
  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context) {
    return { supabase, error: NextResponse.json({ error: "Restaurant membership not found." }, { status: 404 }) };
  }

  const membership = {
    restaurant_id: context.selected.restaurantId,
    role: context.selected.memberRole,
  };

  if (!hasPermission(membership.role, "manageMenu")) {
    return { supabase, error: NextResponse.json({ error: "Only owners and managers can manage menu items." }, { status: 403 }) };
  }

  const access = await getSubscriptionAccessForRestaurantId(supabase, membership.restaurant_id);

  if (!hasPlanFeature(access, "menuManagement")) {
    return { supabase, error: NextResponse.json({ error: access.message ?? "Basic plan or higher required to manage menu items." }, { status: 403 }) };
  }

  return { supabase, membership, error: null };
}

async function getOrCreateCategory(supabase: Awaited<ReturnType<typeof createClient>>, restaurantId: string, name: string) {
  const { data: existingCategory, error: categoryLookupError } = await supabase
    .from("categories")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("name", name)
    .maybeSingle();

  if (categoryLookupError) {
    throw new Error(categoryLookupError.message);
  }

  if (existingCategory?.id) {
    return existingCategory.id;
  }

  const { data: newCategory, error: categoryCreateError } = await supabase
    .from("categories")
    .insert({
      restaurant_id: restaurantId,
      name,
    })
    .select("id")
    .single();

  if (categoryCreateError || !newCategory) {
    throw new Error(categoryCreateError?.message ?? "Unable to create category.");
  }

  return newCategory.id;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const payload = createMenuItemSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid menu item details.", details: payload.error.flatten() }, { status: 422 });
  }

  const input = payload.data;

  if (input.offerPrice !== null && input.offerPrice !== undefined && input.offerPrice > input.price) {
    return NextResponse.json({ error: "Offer price cannot be greater than price." }, { status: 422 });
  }

  const { supabase, membership, error } = await getEditableMembership();

  if (error || !membership) {
    return error;
  }

  let categoryId: string;

  try {
    categoryId = await getOrCreateCategory(supabase, membership.restaurant_id, input.category);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create category." }, { status: 400 });
  }

  const { data: menuItem, error: menuItemError } = await supabase
    .from("menu_items")
    .insert({
      restaurant_id: membership.restaurant_id,
      category_id: categoryId,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      offer_price: input.offerPrice ?? null,
      preparation_time_minutes: input.preparationTimeMinutes,
      food_type: input.foodType,
      is_available: input.isAvailable,
      is_popular: input.isPopular,
    })
    .select("id")
    .single();

  if (menuItemError || !menuItem) {
    return NextResponse.json({ error: menuItemError?.message ?? "Unable to create menu item." }, { status: 400 });
  }

  return NextResponse.json({ menuItemId: menuItem.id }, { status: 201 });
}

export async function PATCH(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const { supabase, membership, error } = await getEditableMembership();

  if (error || !membership) {
    return error;
  }

  const togglePayload = toggleAvailabilitySchema.safeParse(body);

  if (togglePayload.success && Object.keys(body as Record<string, unknown>).length === 2) {
    const { error: toggleError } = await supabase
      .from("menu_items")
      .update({ is_available: togglePayload.data.isAvailable })
      .eq("id", togglePayload.data.id)
      .eq("restaurant_id", membership.restaurant_id);

    if (toggleError) {
      return NextResponse.json({ error: toggleError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  const payload = updateMenuItemSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid menu item details.", details: payload.error.flatten() }, { status: 422 });
  }

  const input = payload.data;

  if (input.offerPrice !== null && input.offerPrice !== undefined && input.offerPrice > input.price) {
    return NextResponse.json({ error: "Offer price cannot be greater than price." }, { status: 422 });
  }

  let categoryId: string;

  try {
    categoryId = await getOrCreateCategory(supabase, membership.restaurant_id, input.category);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create category." }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("menu_items")
    .update({
      category_id: categoryId,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      offer_price: input.offerPrice ?? null,
      preparation_time_minutes: input.preparationTimeMinutes,
      food_type: input.foodType,
      is_available: input.isAvailable,
      is_popular: input.isPopular,
    })
    .eq("id", input.id)
    .eq("restaurant_id", membership.restaurant_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
