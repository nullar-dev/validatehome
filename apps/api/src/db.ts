import { createDb } from "@validatehome/db";

/** Database connection string from environment or default local development */
export const connectionString =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/validatehome";

/** Database client instance for API server */
export const db = createDb(connectionString);
