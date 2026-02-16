import { Hono } from "hono";
import { serve } from "inngest/hono";
import { crawlSource } from "./functions/crawl-source.js";
import { inngest } from "./inngest.js";

export const functions = [crawlSource];

// The worker server exposes the Inngest endpoint
const app = new Hono();

app.on(
  ["GET", "PUT", "POST"],
  "/api/inngest",
  serve({ client: inngest, functions }) as unknown as Parameters<typeof app.on>[2],
);

export { app };
