import { serve } from "@hono/node-server";
import { createDb } from "@validatehome/db";
import { app } from "./app.js";

const connectionString = process.env.DATABASE_URL ?? "postgresql://localhost:5432/validatehome";
export const db = createDb(connectionString);

const port = Number(process.env.PORT ?? 4000);

// biome-ignore lint/suspicious/noConsole: server startup message
console.log(`ValidateHome API running on http://localhost:${port}`);

const server = serve({ fetch: app.fetch, port });

// Graceful shutdown handling
let isShuttingDown = false;

const gracefulShutdown = async (signal: string): Promise<void> => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  // biome-ignore lint/suspicious/noConsole: shutdown message
  console.log(`\n${signal} received, starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    // biome-ignore lint/suspicious/noConsole: shutdown complete
    console.log("HTTP server closed");
  });

  // Close database connections
  try {
    await db.close();
    // biome-ignore lint/suspicious/noConsole: db closed
    console.log("Database connections closed");
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: error during shutdown
    console.error("Error closing database:", error);
  }

  // Give ongoing requests time to complete (max 10 seconds)
  setTimeout(() => {
    // biome-ignore lint/suspicious/noConsole: forced shutdown
    console.log("Forcing shutdown after timeout");
    process.exit(0);
  }, 10000);

  // Exit immediately if all connections closed cleanly
  process.exit(0);
};

// Register signal handlers
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  // biome-ignore lint/suspicious/noConsole: uncaught exception
  console.error("Uncaught exception:", error);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  // biome-ignore lint/suspicious/noConsole: unhandled rejection
  console.error("Unhandled rejection:", reason);
});
