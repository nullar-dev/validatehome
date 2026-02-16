import { Hono } from "hono";

export const healthRoutes = new Hono()
  .get("/health", (c) => {
    return c.json({
      status: "ok",
      service: "validatehome-api",
      timestamp: new Date().toISOString(),
    });
  })
  .get("/", (c) => {
    return c.json({
      name: "ValidateHome API",
      version: "1.0.0",
      docs: "/v1/docs",
    });
  });
