import { NextResponse } from "next/server";
import { z } from "zod";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import { hasPermission } from "@/lib/permissions";
import { isPushConfigured } from "@/lib/push-notifications";
import { createClient } from "@/lib/supabase/server";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(10),
    auth: z.string().min(10),
  }),
});

export async function GET() {
  return NextResponse.json({
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null,
    configured: isPushConfigured(),
  });
}

export async function POST(request: Request) {
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Device notifications are not configured." }, { status: 503 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const payload = subscriptionSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid push subscription.", details: payload.error.flatten() }, { status: 422 });
  }

  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context) {
    return NextResponse.json({ error: "Restaurant membership not found." }, { status: 404 });
  }

  if (!hasPermission(context.selected.memberRole, "viewOrders")) {
    return NextResponse.json({ error: "Only order users can enable device alerts." }, { status: 403 });
  }

  const subscription = payload.data;
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({
      restaurant_id: context.selected.restaurantId,
      profile_id: context.userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: request.headers.get("user-agent"),
    }, {
      onConflict: "endpoint",
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const payload = z.object({ endpoint: z.string().url() }).safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid push subscription.", details: payload.error.flatten() }, { status: 422 });
  }

  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();

  if (!userResult.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("profile_id", userResult.user.id)
    .eq("endpoint", payload.data.endpoint);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
