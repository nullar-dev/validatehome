import type { Context, Next } from "hono";

/**
 * Middleware that generates or propagates a trace ID for request tracking.
 * Uses X-Trace-Id header if provided, otherwise generates a new one.
 * The trace ID is set in the context and response headers for distributed tracing.
 * @returns Hono middleware function that sets traceId in context
 */
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
