import { createTooManyRequestsProblem } from "@validatehome/shared";
import { sql } from "drizzle-orm";
import type { Context } from "hono";
import { db } from "../db.js";

/** Record containing rate limit count and reset timestamp */
interface RateLimitRecord {
  count: number;
  resetTime: Date;
}

/** Default rate limit window in milliseconds (1 minute) */
const WINDOW_MS = 60 * 1000;

const initRateLimitStore = db.execute(sql`
  create table if not exists api_rate_limits (
    bucket_key text primary key,
    count integer not null,
    reset_time timestamptz not null
  )
`);

/** Configuration options for rate limiting */
export interface RateLimitConfig {
  /** Time window in milliseconds (default: 60000) */
  windowMs?: number;
  /** Maximum requests allowed in the window (default: 100) */
  maxRequests?: number;
}

/**
 * Increments the rate limit counter for a given key and returns the current record.
 * Uses database for persistence to work across multiple instances.
 * @param key - The rate limit bucket key (typically API key or IP)
 * @param windowMs - The time window in milliseconds
 * @returns The current rate limit record with count and reset time
 */
async function incrementRateLimit(key: string, windowMs: number): Promise<RateLimitRecord> {
  await initRateLimitStore;

  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  const rows = (await db.execute(sql`
    insert into api_rate_limits (bucket_key, count, reset_time)
    values (${key}, 1, ${resetAt})
    on conflict (bucket_key)
    do update set
      count = case
        when api_rate_limits.reset_time < ${now} then 1
        else api_rate_limits.count + 1
      end,
      reset_time = case
        when api_rate_limits.reset_time < ${now} then ${resetAt}
        else api_rate_limits.reset_time
      end
    returning count, reset_time as "resetTime"
  `)) as Array<{ count: number; resetTime: string | Date }>;

  const row = rows[0];
  if (!row) {
    return { count: 1, resetTime: resetAt };
  }
  return { count: Number(row.count), resetTime: new Date(row.resetTime) };
}

export function rateLimitMiddleware(config: RateLimitConfig = {}) {
  const windowMs = config.windowMs ?? WINDOW_MS;
  const maxRequests = config.maxRequests ?? 100;

  return async (c: Context, next: () => Promise<void>): Promise<void> => {
    const apiKey = c.get("apiKey") as { id?: string } | undefined;
    const key =
      apiKey?.id ?? c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "anonymous";

    const record = await incrementRateLimit(key, windowMs);
    const now = Date.now();
    const remaining = Math.max(0, maxRequests - record.count);
    const resetSeconds = Math.max(1, Math.ceil((record.resetTime.getTime() - now) / 1000));

    c.res.headers.set("x-rate-limit-limit", String(maxRequests));
    c.res.headers.set("x-rate-limit-remaining", String(remaining));
    c.res.headers.set("x-rate-limit-reset", String(resetSeconds));

    if (record.count > maxRequests) {
      const problem = createTooManyRequestsProblem(
        `Rate limit exceeded. Try again in ${resetSeconds} seconds.`,
      );
      c.status(429);
      c.json(problem);
      return;
    }

    await next();
  };
}
