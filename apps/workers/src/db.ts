import { createDb } from "@validatehome/db";

function loadEnvIfPresent(): void {
  const loadEnvFile = process.loadEnvFile;
  if (typeof loadEnvFile !== "function") {
    return;
  }

  const tryLoad = (filePath: string): void => {
    try {
      loadEnvFile(filePath);
    } catch (error) {
      const maybeCode =
        typeof error === "object" && error && "code" in error
          ? (error.code as string | undefined)
          : undefined;
      if (maybeCode !== "ENOENT") {
        throw error;
      }
    }
  };

  tryLoad(".env");
  tryLoad("../../.env");
}

export function createWorkerDb() {
  loadEnvIfPresent();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for worker execution");
  }
  return createDb(connectionString);
}
