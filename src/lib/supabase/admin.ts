import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { assertSupabaseAdminEnv } from "@/lib/supabase/env";

export function createAdminClient() {
  const { url, serviceRoleKey } = assertSupabaseAdminEnv();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
