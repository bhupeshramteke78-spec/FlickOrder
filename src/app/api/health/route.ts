import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const requiredEnvironment = [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "CRON_SECRET",
    "SUPER_ADMIN_EMAIL",
    "SUPER_ADMIN_ACCESS_PASSWORD",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
    "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
    "VAPID_PRIVATE_KEY",
    "VAPID_SUBJECT",
  ] as const;
  const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]?.trim());

  if (missingEnvironment.length > 0) {
    return NextResponse.json(
      { status: "degraded", checks: { environment: false, database: null } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("restaurants").select("id", { count: "exact", head: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { status: "ok", checks: { environment: true, database: true } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "degraded", checks: { environment: true, database: false } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
