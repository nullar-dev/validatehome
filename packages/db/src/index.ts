import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as relations from "./relations.js";
import * as schema from "./schema/index.js";

export function createDb(connectionString: string) {
  const client = postgres(connectionString);
  return drizzle(client, { schema: { ...schema, ...relations } });
}

export type Database = ReturnType<typeof createDb>;

export * from "./relations.js";
export * from "./schema/index.js";
