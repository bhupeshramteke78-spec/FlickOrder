import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RateLimitOptions = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export async function enforceRateLimit(request: Request, options: RateLimitOptions) {
  const key = `${options.keyPrefix}:${getClientIdentifier(request)}`;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("consume_api_rate_limit", {
      p_key: key,
      p_limit: options.limit,
      p_window_seconds: Math.max(1, Math.ceil(options.windowMs / 1000)),
    });

    if (error) {
      throw error;
    }

    const result = data?.[0];

    if (!result || result.allowed) {
      return null;
    }

    return tooManyRequests(result.retry_after_seconds);
  } catch {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Request protection is temporarily unavailable. Please try again shortly." },
        { status: 503, headers: { "Retry-After": "30" } },
      );
    }

    return enforceLocalRateLimit(key, options);
  }
}

function enforceLocalRateLimit(key: string, options: RateLimitOptions) {
  const now = Date.now();
  const existingBucket = buckets.get(key);
  const bucket = existingBucket && existingBucket.resetAt > now
    ? existingBucket
    : { count: 0, resetAt: now + options.windowMs };

  bucket.count += 1;
  buckets.set(key, bucket);
  pruneExpiredBuckets(now);

  if (bucket.count <= options.limit) {
    return null;
  }

  return tooManyRequests(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)));
}

function getClientIdentifier(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();

  return forwardedFor || realIp || cloudflareIp || "local";
}

function pruneExpiredBuckets(now: number) {
  if (buckets.size < 1000) {
    return;
  }

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function tooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, retryAfterSeconds)),
      },
    },
  );
}
