import type { SupabaseClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

export const SUPER_ADMIN_UNLOCK_COOKIE = "flickorder_super_admin_unlock";
const unlockMaxAgeSeconds = 30 * 60;

export type SuperAdminContext =
  | {
      userId: string;
      fullName: string;
    }
  | null;

export async function getSuperAdminContext(supabase: SupabaseClient<Database>): Promise<SuperAdminContext> {
  const { data: userResult } = await supabase.auth.getUser();

  if (!userResult.user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,role")
    .eq("id", userResult.user.id)
    .maybeSingle();

  if (profile?.role !== "SUPER_ADMIN") {
    return null;
  }

  return {
    userId: userResult.user.id,
    fullName: profile.full_name,
  };
}

export function getSuperAdminPassword() {
  return process.env.SUPER_ADMIN_ACCESS_PASSWORD?.trim() ?? null;
}

export function getSuperAdminUnlockMaxAgeSeconds() {
  return unlockMaxAgeSeconds;
}

export function createSuperAdminUnlockToken(userId: string) {
  const password = getSuperAdminPassword();

  if (!password) {
    return null;
  }

  const expiresAt = Date.now() + unlockMaxAgeSeconds * 1000;
  const payload = `${userId}.${expiresAt}`;
  const signature = signPayload(payload, password);

  return `${payload}.${signature}`;
}

export function verifySuperAdminUnlockToken(token: string | undefined, userId: string) {
  const password = getSuperAdminPassword();

  if (!password || !token) {
    return false;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return false;
  }

  const [tokenUserId, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);

  if (tokenUserId !== userId || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return false;
  }

  const payload = `${tokenUserId}.${expiresAtRaw}`;
  const expectedSignature = signPayload(payload, password);

  return safeCompare(signature, expectedSignature);
}

export async function isSuperAdminUnlocked(userId: string) {
  const cookieStore = await cookies();
  const unlockToken = cookieStore.get(SUPER_ADMIN_UNLOCK_COOKIE)?.value;

  return verifySuperAdminUnlockToken(unlockToken, userId);
}

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function safeCompare(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  return firstBuffer.length === secondBuffer.length && timingSafeEqual(firstBuffer, secondBuffer);
}
