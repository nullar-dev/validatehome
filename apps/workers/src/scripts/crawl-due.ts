import { createWorkerDb } from "../db.js";
import { executeCrawl } from "../pipeline/crawl-executor.js";
import { listDueSources } from "../pipeline/source-registry.js";

async function main(): Promise<void> {
  const db = createWorkerDb();
  try {
    const dueSources = await listDueSources(db);
    let ok = 0;
    for (const source of dueSources) {
      const result = await executeCrawl(db, { sourceId: source.id });
      if (result.success) {
        ok += 1;
      }
    }
    process.stdout.write(`Crawled ${ok}/${dueSources.length} due sources\n`);
    if (ok !== dueSources.length) {
      process.exitCode = 1;
    }
  } finally {
    await db.close();
  }
}

await main();
