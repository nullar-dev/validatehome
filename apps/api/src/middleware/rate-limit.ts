import { createTooManyRequestsProblem } from "@validatehome/shared";
import type { Context } from "hono";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitRecord>();
const WINDOW_MS = 60 * 1000;

function cleanup(): void {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (record.resetTime < now) {
      store.delete(key);
    }
  }
}

setInterval(cleanup, WINDOW_MS);

export interface RateLimitConfig {
  windowMs?: number;
  maxRequests?: number;
}

export function rateLimitMiddleware(config: RateLimitConfig = {}) {
  const windowMs = config.windowMs ?? WINDOW_MS;
  const maxRequests = config.maxRequests ?? 100;

  return async (c: Context, next: () => Promise<void>): Promise<void> => {
    const apiKey = c.get("apiKey");
    const key =
      apiKey?.id ?? c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "anonymous";

    const now = Date.now();
    const existing = store.get(key);

    if (!existing || existing.resetTime < now) {
      store.set(key, { count: 1, resetTime: now + windowMs });
    } else {
      existing.count++;
    }

    const record = store.get(key);
    if (!record) {
      return;
    }
    const remaining = Math.max(0, maxRequests - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

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
