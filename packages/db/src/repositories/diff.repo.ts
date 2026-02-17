import { desc, eq } from "drizzle-orm";
import { diffs } from "../schema/crawl.js";
import type { DbClient } from "./types.js";

export type Diff = typeof diffs.$inferSelect;
export type NewDiff = typeof diffs.$inferInsert;

export function diffRepo(db: DbClient) {
  return {
    async create(data: NewDiff): Promise<Diff> {
      const rows = await db.insert(diffs).values(data).returning();
      const created = rows[0];
      if (!created) {
        throw new Error("Failed to create diff");
      }
      return created;
    },

    async createMany(data: readonly NewDiff[]): Promise<Diff[]> {
      if (data.length === 0) {
        return [];
      }
      return db
        .insert(diffs)
        .values([...data])
        .returning();
    },

    async findUnreviewed(options?: { limit?: number; offset?: number }): Promise<Diff[]> {
      const limit = options?.limit ?? 100;
      const offset = options?.offset ?? 0;
      return db
        .select()
        .from(diffs)
        .where(eq(diffs.reviewed, false))
        .orderBy(desc(diffs.significanceScore))
        .limit(limit)
        .offset(offset);
    },

    async findBySource(
      sourceId: string,
      options?: { limit?: number; offset?: number },
    ): Promise<Diff[]> {
      const limit = options?.limit ?? 100;
      const offset = options?.offset ?? 0;
      return db
        .select()
        .from(diffs)
        .where(eq(diffs.sourceId, sourceId))
        .orderBy(desc(diffs.createdAt))
        .limit(limit)
        .offset(offset);
    },

    async markReviewed(id: string, reviewedBy: string): Promise<Diff> {
      const rows = await db
        .update(diffs)
        .set({ reviewed: true, reviewedBy, reviewedAt: new Date() })
        .where(eq(diffs.id, id))
        .returning();
      const updated = rows[0];
      if (!updated) {
        throw new Error(`Diff not found: ${id}`);
      }
      return updated;
    },

    async findById(id: string): Promise<Diff | undefined> {
      const rows = await db.select().from(diffs).where(eq(diffs.id, id)).limit(1);
      return rows[0];
    },
  };
}
