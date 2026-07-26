import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return runMaintenance(request);
}

export async function POST(request: Request) {
  return runMaintenance(request);
}

async function runMaintenance(request: Request) {
  const expectedSecret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");

  if (expectedSecret && authorization !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized maintenance request." }, { status: 401 });
  }

  if (!expectedSecret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CRON_SECRET is required in production." }, { status: 500 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("run_subscription_lifecycle_maintenance");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, result: data });
}
