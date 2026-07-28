import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSupabaseBrowserEnv } from "@/lib/supabase/env";
import { customerRegistrationSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const rateLimited = await enforceRateLimit(request, {
    keyPrefix: "register-customer",
    limit: 5,
    windowMs: 60 * 60_000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const payload = customerRegistrationSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json(
      { error: "Check your account details and try again.", details: payload.error.flatten() },
      { status: 422 },
    );
  }

  const admin = createAdminClient();
  const { url, anonKey } = assertSupabaseBrowserEnv();
  const authClient = createSupabaseClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(request.url).origin;
  const nextPath = payload.data.redirectTo ?? "/customer/bookings";
  const { data: authUser, error: authError } = await authClient.auth.signUp({
    email: payload.data.email,
    password: payload.data.password,
    options: {
      emailRedirectTo: `${siteUrl.replace(/\/$/, "")}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      data: {
        full_name: payload.data.fullName,
        role: "CUSTOMER",
      },
    },
  });

  if (authError || !authUser.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Unable to create the customer account." },
      { status: 400 },
    );
  }

  if (authUser.user.identities?.length === 0) {
    return NextResponse.json({ error: "An account already exists for this email. Sign in instead." }, { status: 409 });
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: authUser.user.id,
    full_name: payload.data.fullName,
    phone: payload.data.phone,
    role: "CUSTOMER",
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: "Unable to finish creating the customer account." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, requiresEmailConfirmation: !authUser.session }, { status: 201 });
}
