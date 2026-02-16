import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as relations from "./relations.js";
import * as schema from "./schema/index.js";

export function createDb(connectionString: string) {
  const client = postgres(connectionString);
  const db = drizzle(client, { schema: { ...schema, ...relations } });
  return Object.assign(db, {
    close: async (): Promise<void> => {
      await client.end();
    },
  });
}

export type Database = ReturnType<typeof createDb>;

export * from "./relations.js";
export * from "./repositories/index.js";
export * from "./schema/index.js";
