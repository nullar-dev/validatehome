import type { Context, Next } from "hono";

/**
 * Generates a cryptographically secure trace ID.
 * Uses X-Trace-Id header if provided, otherwise generates a UUID.
 * The trace ID is set in the context and response headers for distributed tracing.
 * @returns A unique trace ID string
 */
function generateTraceId(): string {
  return `trace-${crypto.randomUUID()}`;
}

/**
 * Middleware that generates or propagates a trace ID for request tracking.
 * Uses X-Trace-Id header if provided, otherwise generates a new one.
 * The trace ID is set in the context and response headers for distributed tracing.
 * @returns Hono middleware function that sets traceId in context
 */
export function traceMiddleware() {
  return async (c: Context, next: Next) => {
    const traceId = c.req.header("X-Trace-Id") ?? generateTraceId();
    c.set("traceId", traceId);
    c.res.headers.set("X-Trace-Id", traceId);
    await next();
  };
}
