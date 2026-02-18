import { crawlDlqRepo, type Database } from "@validatehome/db";
import { executeCrawl } from "./crawl-executor.js";

// Replay helpers are CLI-initiated operational tools for manual DLQ recovery.
// They call executeCrawl directly and use bounded concurrency for predictable recovery.
const REPLAY_CONCURRENCY = 4;

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

  for (let offset = 0; offset < entries.length; offset += REPLAY_CONCURRENCY) {
    const batch = entries.slice(offset, offset + REPLAY_CONCURRENCY);
    const batchResults = await Promise.all(batch.map((entry) => replayDlqById(db, entry.id)));
    succeeded += batchResults.filter(Boolean).length;
  }
  return succeeded;
}
