import { desc, eq } from "drizzle-orm";
import { crawlSnapshots } from "../schema/crawl.js";
import type { DbClient } from "./types.js";

export type CrawlSnapshot = typeof crawlSnapshots.$inferSelect;
export type NewCrawlSnapshot = typeof crawlSnapshots.$inferInsert;

export function crawlSnapshotRepo(db: DbClient) {
  return {
    async create(data: NewCrawlSnapshot): Promise<CrawlSnapshot> {
      const rows = await db.insert(crawlSnapshots).values(data).returning();
      const created = rows[0];
      if (!created) {
        throw new Error("Failed to create crawl snapshot");
      }
      return created;
    },

    async findLatestBySource(sourceId: string): Promise<CrawlSnapshot | undefined> {
      const rows = await db
        .select()
        .from(crawlSnapshots)
        .where(eq(crawlSnapshots.sourceId, sourceId))
        .orderBy(desc(crawlSnapshots.crawledAt))
        .limit(1);
      return rows[0];
    },

    async findById(id: string): Promise<CrawlSnapshot | undefined> {
      const rows = await db.select().from(crawlSnapshots).where(eq(crawlSnapshots.id, id)).limit(1);
      return rows[0];
    },

    async findBySource(sourceId: string): Promise<CrawlSnapshot[]> {
      return db
        .select()
        .from(crawlSnapshots)
        .where(eq(crawlSnapshots.sourceId, sourceId))
        .orderBy(desc(crawlSnapshots.crawledAt));
    },
  };
}
