import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAndCreateStaffSession } from "@/lib/staff-auth";

const staffAuthSchema = z.object({
  action: z.enum(["LOGIN", "LOGOUT"]).default("LOGIN"),
  slug: z.string().min(1),
  role: z.enum(["chef", "waiter"]),
  pin: z.string().min(4).max(6).optional(),
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
    cookieStore.delete(cookieName);
    return NextResponse.json({ ok: true });
  }

  if (!payload.data.pin) {
    return NextResponse.json({ error: "Staff PIN is required." }, { status: 400 });
  }

  const session = await verifyAndCreateStaffSession(payload.data.slug, payload.data.role, payload.data.pin);

  if (!session) {
    return NextResponse.json({ error: "Incorrect staff PIN for this restaurant." }, { status: 401 });
  }

  const encoded = Buffer.from(JSON.stringify(session)).toString("base64");

  cookieStore.set(cookieName, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return NextResponse.json({ ok: true, session });
}
