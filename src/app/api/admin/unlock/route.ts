import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import {
  createSuperAdminUnlockToken,
  getSuperAdminContext,
  getSuperAdminPassword,
  getSuperAdminUnlockMaxAgeSeconds,
  SUPER_ADMIN_UNLOCK_COOKIE,
} from "@/lib/super-admin";

const unlockSchema = z.object({
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const rateLimited = enforceRateLimit(request, {
    keyPrefix: "super-admin-unlock",
    limit: 5,
    windowMs: 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const supabase = await createClient();
  const superAdmin = await getSuperAdminContext(supabase);

  if (!superAdmin) {
    return NextResponse.json({ error: "SUPER_ADMIN access required." }, { status: 403 });
  }

  const configuredPassword = getSuperAdminPassword();

  if (!configuredPassword) {
    return NextResponse.json({ error: "Super admin password is not configured." }, { status: 503 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const payload = unlockSchema.safeParse(body);

  if (!payload.success || payload.data.password !== configuredPassword) {
    return NextResponse.json({ error: "Invalid super admin password." }, { status: 401 });
  }

  const token = createSuperAdminUnlockToken(superAdmin.userId);

  if (!token) {
    return NextResponse.json({ error: "Unable to create admin unlock token." }, { status: 500 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SUPER_ADMIN_UNLOCK_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getSuperAdminUnlockMaxAgeSeconds(),
  });

  return NextResponse.json({ ok: true });
}
