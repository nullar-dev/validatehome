import { crawlDlqRepo, type Database } from "@validatehome/db";
import { executeCrawl } from "./crawl-executor.js";

export async function replayDlqById(db: Database, dlqId: string): Promise<boolean> {
  const repo = crawlDlqRepo(db);
  const entry = await repo.findById(dlqId);
  if (!entry) {
    throw new Error(`DLQ entry not found: ${dlqId}`);
  }

  await repo.markReplayed(dlqId);
  const result = await executeCrawl(db, { sourceId: entry.sourceId });
  if (result.success) {
    await repo.resolve(dlqId);
    return true;
  }
  return false;
}

export async function replayDlqBySource(
  db: Database,
  sourceId: string,
  limit = 20,
): Promise<number> {
  const repo = crawlDlqRepo(db);
  const entries = await repo.findUnresolvedBySource(sourceId, limit);
  let succeeded = 0;

  for (const entry of entries) {
    const ok = await replayDlqById(db, entry.id);
    if (ok) {
      succeeded += 1;
    }
  }
  return succeeded;
}
