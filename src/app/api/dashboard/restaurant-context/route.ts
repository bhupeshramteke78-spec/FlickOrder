import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { DASHBOARD_RESTAURANT_COOKIE } from "@/lib/dashboard-restaurant";
import { createClient } from "@/lib/supabase/server";

const selectRestaurantSchema = z.object({
  restaurantId: z.string().uuid(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = selectRestaurantSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Valid restaurantId is required." }, { status: 422 });
  }

  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();

  if (!userResult.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("restaurant_members")
    .select("restaurant_id")
    .eq("profile_id", userResult.user.id)
    .eq("restaurant_id", parsed.data.restaurantId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Restaurant membership not found." }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.set(DASHBOARD_RESTAURANT_COOKIE, parsed.data.restaurantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ restaurantId: parsed.data.restaurantId });
}
