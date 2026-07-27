import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { customerRegistrationSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const rateLimited = enforceRateLimit(request, {
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
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: payload.data.email,
    password: payload.data.password,
    email_confirm: true,
    user_metadata: {
      full_name: payload.data.fullName,
      role: "CUSTOMER",
    },
  });

  if (authError || !authUser.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Unable to create the customer account." },
      { status: 400 },
    );
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

  return NextResponse.json({ ok: true }, { status: 201 });
}
