import type { Context, Next } from "hono";

export function traceMiddleware() {
  return async (c: Context, next: Next) => {
    const traceId =
      c.req.header("X-Trace-Id") ||
      `trace-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    c.set("traceId", traceId);
    c.res.headers.set("X-Trace-Id", traceId);
    await next();
  };
}
