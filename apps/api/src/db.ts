import { createDb } from "@validatehome/db";

export const connectionString =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/validatehome";

export const db = createDb(connectionString);
