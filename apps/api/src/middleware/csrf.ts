import type { Context, Next } from "hono";

const DEFAULT_ALLOWED_ORIGINS = "https://validatehome.com,https://www.validatehome.com";
const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS ?? DEFAULT_ALLOWED_ORIGINS)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const LOOPBACK_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

export async function csrfMiddleware(c: Context, next: Next): Promise<Response | undefined> {
  const method = c.req.method.toUpperCase();

  if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    await next();
    return;
  }

  const origin = c.req.header("origin");
  const referer = c.req.header("referer");

  let requestOrigin: string | null = origin ?? null;
  if (!requestOrigin && referer) {
    try {
      requestOrigin = new URL(referer).origin;
    } catch {
      requestOrigin = null;
    }
  }

  if (!requestOrigin) {
    return c.json(
      {
        type: "https://validatehome.com/errors/csrf",
        title: "CSRF Validation Failed",
        status: 403,
        detail: "Origin or Referer header required for mutating requests",
      },
      403,
    );
  }

  const isAllowedLoopback =
    process.env.NODE_ENV !== "production" && LOOPBACK_ORIGIN_PATTERN.test(requestOrigin);

  if (!ALLOWED_ORIGINS.has(requestOrigin) && !isAllowedLoopback) {
    return c.json(
      {
        type: "https://validatehome.com/errors/csrf",
        title: "CSRF Validation Failed",
        status: 403,
        detail: "Request origin not allowed",
      },
      403,
    );
  }

  await next();
}
