import { and, desc, eq, isNull } from "drizzle-orm";
import { crawlDlq } from "../schema/crawl.js";
import type { DbClient } from "./types.js";

export type CrawlDlqEntry = typeof crawlDlq.$inferSelect;
export type NewCrawlDlqEntry = typeof crawlDlq.$inferInsert;

export function crawlDlqRepo(db: DbClient) {
  return {
    async create(data: NewCrawlDlqEntry): Promise<CrawlDlqEntry> {
      const rows = await db.insert(crawlDlq).values(data).returning();
      const created = rows[0];
      if (!created) {
        throw new Error("Failed to create DLQ entry");
      }
      return created;
    },

    async findById(id: string): Promise<CrawlDlqEntry | undefined> {
      const rows = await db.select().from(crawlDlq).where(eq(crawlDlq.id, id)).limit(1);
      return rows[0];
    },

    async findUnresolved(limit = 100): Promise<CrawlDlqEntry[]> {
      return db
        .select()
        .from(crawlDlq)
        .where(isNull(crawlDlq.resolvedAt))
        .orderBy(desc(crawlDlq.createdAt))
        .limit(limit);
    },

    async findUnresolvedBySource(sourceId: string, limit = 100): Promise<CrawlDlqEntry[]> {
      return db
        .select()
        .from(crawlDlq)
        .where(and(eq(crawlDlq.sourceId, sourceId), isNull(crawlDlq.resolvedAt)))
        .orderBy(desc(crawlDlq.createdAt))
        .limit(limit);
    },

    async markReplayed(id: string): Promise<CrawlDlqEntry> {
      const currentRows = await db.select().from(crawlDlq).where(eq(crawlDlq.id, id)).limit(1);
      const current = currentRows[0];
      if (!current) {
        throw new Error(`DLQ entry not found: ${id}`);
      }
      const rows = await db
        .update(crawlDlq)
        .set({
          replayCount: current.replayCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(crawlDlq.id, id))
        .returning();
      const updated = rows[0];
      if (!updated) {
        throw new Error(`Failed to update DLQ entry: ${id}`);
      }
      return updated;
    },

    async resolve(id: string): Promise<CrawlDlqEntry> {
      const rows = await db
        .update(crawlDlq)
        .set({
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(crawlDlq.id, id))
        .returning();
      const updated = rows[0];
      if (!updated) {
        throw new Error(`DLQ entry not found: ${id}`);
      }
      return updated;
    },
  };
}
