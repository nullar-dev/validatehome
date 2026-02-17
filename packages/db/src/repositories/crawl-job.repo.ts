import { desc, eq, isNull } from "drizzle-orm";
import { crawlJobs } from "../schema/crawl.js";
import type { DbClient } from "./types.js";

export type CrawlJob = typeof crawlJobs.$inferSelect;
export type NewCrawlJob = typeof crawlJobs.$inferInsert;

export function crawlJobRepo(db: DbClient) {
  return {
    async create(data: NewCrawlJob): Promise<CrawlJob> {
      const rows = await db.insert(crawlJobs).values(data).returning();
      const created = rows[0];
      if (!created) {
        throw new Error("Failed to create crawl job");
      }
      return created;
    },

    async findById(id: string): Promise<CrawlJob | undefined> {
      const rows = await db.select().from(crawlJobs).where(eq(crawlJobs.id, id)).limit(1);
      return rows[0];
    },

    async findUnresolvedFailed(limit = 100): Promise<CrawlJob[]> {
      return db
        .select()
        .from(crawlJobs)
        .where(isNull(crawlJobs.finishedAt))
        .orderBy(desc(crawlJobs.createdAt))
        .limit(limit);
    },

    async markRunning(id: string): Promise<CrawlJob> {
      const rows = await db
        .update(crawlJobs)
        .set({ status: "running", startedAt: new Date(), updatedAt: new Date() })
        .where(eq(crawlJobs.id, id))
        .returning();
      const updated = rows[0];
      if (!updated) {
        throw new Error(`Crawl job not found: ${id}`);
      }
      return updated;
    },

    async markSucceeded(
      id: string,
      reviewRequired: boolean,
      reviewReasons: readonly string[],
      metadata?: Record<string, unknown>,
    ): Promise<CrawlJob> {
      const rows = await db
        .update(crawlJobs)
        .set({
          status: "succeeded",
          reviewRequired,
          reviewReasons,
          metadata: metadata ?? null,
          finishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(crawlJobs.id, id))
        .returning();
      const updated = rows[0];
      if (!updated) {
        throw new Error(`Crawl job not found: ${id}`);
      }
      return updated;
    },

    async markFailed(
      id: string,
      errorClass: CrawlJob["errorClass"],
      errorMessage: string,
      metadata?: Record<string, unknown>,
    ): Promise<CrawlJob> {
      const rows = await db
        .update(crawlJobs)
        .set({
          status: "failed",
          errorClass,
          errorMessage,
          metadata: metadata ?? null,
          finishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(crawlJobs.id, id))
        .returning();
      const updated = rows[0];
      if (!updated) {
        throw new Error(`Crawl job not found: ${id}`);
      }
      return updated;
    },

    async markPolicyBlocked(id: string, errorMessage: string): Promise<CrawlJob> {
      const rows = await db
        .update(crawlJobs)
        .set({
          status: "policy_blocked",
          errorClass: "policy_blocked",
          errorMessage,
          finishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(crawlJobs.id, id))
        .returning();
      const updated = rows[0];
      if (!updated) {
        throw new Error(`Crawl job not found: ${id}`);
      }
      return updated;
    },
  };
}
