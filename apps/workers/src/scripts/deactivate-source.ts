import { sourceRepo } from "@validatehome/db";
import { createWorkerDb } from "../db.js";
import { assertUuid } from "../utils/validation.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const rawSourceId = args[0];
  if (!rawSourceId) {
    throw new Error("Usage: deactivate-source -- <sourceId>");
  }
  const sourceId = assertUuid(rawSourceId, "sourceId");

  const db = createWorkerDb();
  try {
    const repo = sourceRepo(db);
    await repo.deactivate(sourceId);
    process.stdout.write(`Deactivated source ${sourceId}\n`);
  } finally {
    await db.close();
  }
}

await main();
