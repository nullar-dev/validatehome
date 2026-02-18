import { createWorkerDb } from "../db.js";
import { executeCrawl } from "../pipeline/crawl-executor.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const sourceId = args[0];
  if (!sourceId) {
    throw new Error("Usage: pnpm --filter @validatehome/workers crawl:source -- <sourceId>");
  }

  const db = createWorkerDb();
  try {
    const result = await executeCrawl(db, { sourceId });
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (!result.success) {
      process.exitCode = 1;
    }
  } finally {
    await db.close();
  }
}

await main();
