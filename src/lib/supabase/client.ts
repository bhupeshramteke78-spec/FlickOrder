"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { assertSupabaseBrowserEnv } from "@/lib/supabase/env";

export function createClient() {
  const { url, anonKey } = assertSupabaseBrowserEnv();
  return createBrowserClient<Database>(url, anonKey);
}
