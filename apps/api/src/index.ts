import { serve } from "@hono/node-server";
import { app } from "./app.js";

const port = Number(process.env.PORT ?? 4000);

// biome-ignore lint/suspicious/noConsole: server startup message
console.log(`ValidateHome API running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
