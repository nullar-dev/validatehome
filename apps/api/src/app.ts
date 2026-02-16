import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { calculatorRoutes } from "./routes/calculator.js";
import { healthRoutes } from "./routes/health.js";
import { programRoutes } from "./routes/programs.js";

export const app = new Hono()
  .use("*", logger())
  .use("*", cors())
  .use("*", secureHeaders())
  .route("/v1/programs", programRoutes)
  .route("/v1/calculator", calculatorRoutes)
  .route("/", healthRoutes);

export type AppType = typeof app;
