export function getSupabaseBrowserEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function isSupabaseConfigured() {
  const env = getSupabaseBrowserEnv();
  return Boolean(env.url && env.anonKey);
}

export function assertSupabaseBrowserEnv() {
  const env = getSupabaseBrowserEnv();

  if (!env.url || !env.anonKey) {
    throw new Error("Supabase browser environment variables are not configured.");
  }

  return { url: env.url, anonKey: env.anonKey };
}

export function assertSupabaseAdminEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin environment variables are not configured.");
  }

  return { url, serviceRoleKey };
}
