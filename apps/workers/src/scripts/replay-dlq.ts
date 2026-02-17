import { createWorkerDb } from "../db.js";
import { replayDlqById, replayDlqBySource } from "../pipeline/replay.js";
import { assertUuid } from "../utils/validation.js";

async function main(): Promise<void> {
  const db = createWorkerDb();
  try {
    const args = process.argv.slice(2);
    const idArg = args.find((arg) => arg.startsWith("--id="));
    const sourceArg = args.find((arg) => arg.startsWith("--sourceId="));

    if (idArg) {
      const rawId = idArg.replace("--id=", "").trim();
      if (!rawId) {
        throw new Error("Usage: replay:dlq -- --id=<dlqId> OR replay:dlq -- --sourceId=<sourceId>");
      }
      const id = assertUuid(rawId, "id");
      const ok = await replayDlqById(db, id);
      process.stdout.write(`Replay by id ${id}: ${ok ? "ok" : "failed"}\n`);
      if (!ok) {
        process.exitCode = 1;
      }
      return;
    }

    if (sourceArg) {
      const rawSourceId = sourceArg.replace("--sourceId=", "").trim();
      if (!rawSourceId) {
        throw new Error("Usage: replay:dlq -- --id=<dlqId> OR replay:dlq -- --sourceId=<sourceId>");
      }
      const sourceId = assertUuid(rawSourceId, "sourceId");
      const count = await replayDlqBySource(db, sourceId);
      process.stdout.write(`Replayed ${count} DLQ entries for source ${sourceId}\n`);
      return;
    }

    throw new Error("Usage: replay:dlq -- --id=<dlqId> OR replay:dlq -- --sourceId=<sourceId>");
  } finally {
    await db.close();
  }
}

await main();
