import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { apiKeyMiddleware } from "./middleware/api-key-auth.js";
import { csrfMiddleware, isAllowedOrigin } from "./middleware/csrf.js";
import { errorHandler } from "./middleware/error-handler.js";
import { rateLimitMiddleware } from "./middleware/rate-limit.js";
import { traceMiddleware } from "./middleware/trace.js";
import openapiSpec from "./openapi.json" with { type: "json" };
import { calculatorRoutes } from "./routes/calculator.js";
import { diffRoutes } from "./routes/diffs.js";
import { healthRoutes } from "./routes/health.js";
import { programRoutes } from "./routes/programs.js";
import { searchRoutes } from "./routes/search.js";

const apiRoutes = new Hono()
  .use("*", csrfMiddleware)
  .use("*", apiKeyMiddleware)
  .use("*", rateLimitMiddleware({ maxRequests: 1000, windowMs: 60000 }))
  .route("/programs", programRoutes)
  .route("/diffs", diffRoutes)
  .route("/calculator", calculatorRoutes)
  .route("/search", searchRoutes);

const docsRoutes = new Hono()
  .get("/openapi.json", (c) => c.json(openapiSpec))
  .get("/", (c) =>
    c.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ValidateHome API</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@scalar/api-reference/style.css" />
          <title>ValidateHome API Reference</title>
        </head>
        <body>
          <script id="api-reference" data-url="/v1/docs/openapi.json"></script>
          <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
        </body>
      </html>
    `),
  );

export const app = new Hono()
  .use("*", traceMiddleware())
  .use("*", logger())
  .use(
    "*",
    cors({
      origin: (origin) => {
        if (!origin) {
          return "";
        }
        return isAllowedOrigin(origin) ? origin : "";
      },
    }),
  )
  .use(
    "*",
    secureHeaders({
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://validatehome.com"],
      },
    }),
  )
  .use("*", errorHandler())
  .route("/v1", apiRoutes)
  .route("/v1/docs", docsRoutes)
  .route("/", healthRoutes);

export type AppType = typeof app;
