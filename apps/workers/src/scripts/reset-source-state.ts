import { sourceRepo } from "@validatehome/db";
import { createWorkerDb } from "../db.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const sourceId = args[0];
  if (!sourceId) {
    throw new Error("Usage: reset-source-state -- <sourceId>");
  }

  const db = createWorkerDb();
  try {
    const repo = sourceRepo(db);
    const source = await repo.findById(sourceId);
    if (!source) {
      throw new Error(`Source not found: ${sourceId}`);
    }
    await repo.update(sourceId, {
      etag: null,
      lastModifiedHeader: null,
      lastCrawlAt: null,
    });
    process.stdout.write(`Reset state for source ${sourceId}\n`);
  } finally {
    await db.close();
  }
}

await main();
