import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSelectedDashboardRestaurant } from "@/lib/dashboard-restaurant";
import { hasPermission } from "@/lib/permissions";
import { saveRestaurantStaffPins, verifyAndCreateStaffSession } from "@/lib/staff-auth";
import { createClient } from "@/lib/supabase/server";

const staffAuthSchema = z.object({
  action: z.enum(["LOGIN", "LOGOUT"]).default("LOGIN"),
  slug: z.string().min(1),
  role: z.enum(["chef", "waiter"]),
  pin: z.string().min(4).max(6).optional(),
});

const updatePinsSchema = z.object({
  kitchenPin: z.string().regex(/^\d{4,6}$/, "Kitchen PIN must be 4 to 6 numeric digits."),
  waiterPin: z.string().regex(/^\d{4,6}$/, "Waiter PIN must be 4 to 6 numeric digits."),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const payload = staffAuthSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid staff credentials.", details: payload.error.flatten() }, { status: 422 });
  }

  const cookieStore = await cookies();
  const cookieName = `flickorder_staff_${payload.data.role}`;

  if (payload.data.action === "LOGOUT") {
    cookieStore.set(cookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    cookieStore.delete(cookieName);
    return NextResponse.json({ ok: true });
  }

  if (!payload.data.pin) {
    return NextResponse.json({ error: "Staff PIN is required." }, { status: 400 });
  }

  const session = await verifyAndCreateStaffSession(payload.data.slug, payload.data.role, payload.data.pin);

  if (!session) {
    return NextResponse.json({ error: "Incorrect staff PIN. Please try again." }, { status: 401 });
  }

  const encoded = Buffer.from(JSON.stringify(session)).toString("base64");

  // Set tab-session cookie (destroyed as soon as browser/tab closes)
  cookieStore.set(cookieName, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.json({ ok: true, session });
}

export async function PATCH(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const payload = updatePinsSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "PINs must be 4 to 6 numeric digits." }, { status: 422 });
  }

  const supabase = await createClient();
  const context = await getSelectedDashboardRestaurant(supabase);

  if (!context || !hasPermission(context.selected.memberRole, "manageSettings")) {
    return NextResponse.json({ error: "Only owners and managers can update staff PINs." }, { status: 403 });
  }

  const success = await saveRestaurantStaffPins(supabase, context.selected.restaurantId, payload.data);

  if (!success) {
    return NextResponse.json({ error: "Failed to update staff PINs." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
