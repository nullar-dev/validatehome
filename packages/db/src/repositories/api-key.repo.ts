import { eq } from "drizzle-orm";
import { apiKeys } from "../schema/api-key.js";
import type { DbClient } from "./types.js";

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;

export function apiKeyRepo(db: DbClient) {
  return {
    async findByHash(keyHash: string): Promise<ApiKey | undefined> {
      const rows = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash)).limit(1);
      return rows[0];
    },

    async create(data: NewApiKey): Promise<ApiKey> {
      const rows = await db.insert(apiKeys).values(data).returning();
      const created = rows[0];
      if (!created) {
        throw new Error("Failed to create API key");
      }
      return created;
    },

    async deactivate(id: string): Promise<ApiKey> {
      const rows = await db
        .update(apiKeys)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(apiKeys.id, id))
        .returning();
      const updated = rows[0];
      if (!updated) {
        throw new Error(`API key not found: ${id}`);
      }
      return updated;
    },

    async touchLastUsed(id: string): Promise<void> {
      await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, id));
    },
  };
}
