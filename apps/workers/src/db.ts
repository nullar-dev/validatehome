import { createDb } from "@validatehome/db";

function loadEnvIfPresent(): void {
  const loadEnvFile = process.loadEnvFile;
  if (typeof loadEnvFile !== "function") {
    return;
  }
  try {
    loadEnvFile(".env");
  } catch {
    // noop
  }
  try {
    loadEnvFile("../../.env");
  } catch {
    // noop
  }
}

export function createWorkerDb() {
  loadEnvIfPresent();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for worker execution");
  }
  return createDb(connectionString);
}
