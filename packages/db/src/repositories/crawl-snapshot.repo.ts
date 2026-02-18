import { and, desc, eq } from "drizzle-orm";
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

    async createIdempotent(data: NewCrawlSnapshot): Promise<CrawlSnapshot> {
      if (!data.ingestionKey) {
        return this.create(data);
      }
      const rows = await db
        .insert(crawlSnapshots)
        .values(data)
        .onConflictDoNothing({ target: crawlSnapshots.ingestionKey })
        .returning();
      const created = rows[0];
      if (created) {
        return created;
      }

      const existingRows = await db
        .select()
        .from(crawlSnapshots)
        .where(eq(crawlSnapshots.ingestionKey, data.ingestionKey))
        .limit(1);
      const existing = existingRows[0];
      if (!existing) {
        throw new Error("Failed to create or fetch idempotent crawl snapshot");
      }
      return existing;
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

    async findBySourceAndHash(
      sourceId: string,
      contentHash: string,
    ): Promise<CrawlSnapshot | undefined> {
      const rows = await db
        .select()
        .from(crawlSnapshots)
        .where(
          and(eq(crawlSnapshots.sourceId, sourceId), eq(crawlSnapshots.contentHash, contentHash)),
        )
        .orderBy(desc(crawlSnapshots.crawledAt))
        .limit(1);
      return rows[0];
    },
  };
}
