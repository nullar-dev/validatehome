import type { Database } from "@validatehome/db";
import { type Source, sourceRepo } from "@validatehome/db";

export async function listDueSources(db: Database): Promise<Source[]> {
  const repo = sourceRepo(db);
  return repo.findDueForCrawl();
}

export async function getSourceOrThrow(db: Database, sourceId: string): Promise<Source> {
  const repo = sourceRepo(db);
  const source = await repo.findById(sourceId);
  if (!source) {
    throw new Error(`Source not found: ${sourceId}`);
  }
  return source;
}
