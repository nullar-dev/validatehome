import type { Context, Next } from "hono";

const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:3001",
  "https://validatehome.com",
  "https://www.validatehome.com",
]);

export async function csrfMiddleware(c: Context, next: Next): Promise<Response | undefined> {
  const method = c.req.method.toUpperCase();

  if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    await next();
    return;
  }

  const origin = c.req.header("origin");
  const referer = c.req.header("referer");

  const requestOrigin = origin ?? (referer ? new URL(referer).origin : null);

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

  if (!ALLOWED_ORIGINS.has(requestOrigin)) {
    return c.json(
      {
        type: "https://validatehome.com/errors/csrf",
        title: "CSRF Validation Failed",
        status: 403,
        detail: `Origin ${requestOrigin} not allowed`,
      },
      403,
    );
  }

  await next();
}
