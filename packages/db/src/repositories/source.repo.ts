import { and, eq, sql } from "drizzle-orm";
import { sources } from "../schema/crawl.js";
import type { DbClient } from "./types.js";

export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type UpdateSource = Partial<Omit<NewSource, "id">>;

export function sourceRepo(db: DbClient) {
  return {
    async findAll(): Promise<Source[]> {
      return db.select().from(sources).orderBy(sources.url);
    },

    async findActive(): Promise<Source[]> {
      return db.select().from(sources).where(eq(sources.isActive, true)).orderBy(sources.url);
    },

    async findDueForCrawl(): Promise<Source[]> {
      return db
        .select()
        .from(sources)
        .where(
          and(
            eq(sources.isActive, true),
            sql`(${sources.lastCrawlAt} IS NULL OR ${sources.lastCrawlAt} + (${sources.crawlFrequencyMs} * interval '1 millisecond') < now())`,
          ),
        );
    },

    async findById(id: string): Promise<Source | undefined> {
      const rows = await db.select().from(sources).where(eq(sources.id, id)).limit(1);
      return rows[0];
    },

    async findByUrl(url: string): Promise<Source | undefined> {
      const rows = await db.select().from(sources).where(eq(sources.url, url)).limit(1);
      return rows[0];
    },

    async create(data: NewSource): Promise<Source> {
      const rows = await db.insert(sources).values(data).returning();
      const created = rows[0];
      if (!created) {
        throw new Error("Failed to create source");
      }
      return created;
    },

    async update(id: string, data: UpdateSource): Promise<Source> {
      const rows = await db
        .update(sources)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(sources.id, id))
        .returning();
      const updated = rows[0];
      if (!updated) {
        throw new Error(`Source not found: ${id}`);
      }
      return updated;
    },

    async markCrawled(id: string, etag?: string, lastModified?: string): Promise<Source> {
      const rows = await db
        .update(sources)
        .set({
          lastCrawlAt: new Date(),
          etag: etag ?? null,
          lastModifiedHeader: lastModified ?? null,
          updatedAt: new Date(),
        })
        .where(eq(sources.id, id))
        .returning();
      const updated = rows[0];
      if (!updated) {
        throw new Error(`Source not found: ${id}`);
      }
      return updated;
    },

    async deactivate(id: string): Promise<Source> {
      const rows = await db
        .update(sources)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(sources.id, id))
        .returning();
      const updated = rows[0];
      if (!updated) {
        throw new Error(`Source not found: ${id}`);
      }
      return updated;
    },

    async touch(id: string): Promise<Source> {
      const rows = await db
        .update(sources)
        .set({ updatedAt: new Date() })
        .where(eq(sources.id, id))
        .returning();
      const updated = rows[0];
      if (!updated) {
        throw new Error(`Source not found: ${id}`);
      }
      return updated;
    },
  };
}
