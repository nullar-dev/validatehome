import { crawlDlqRepo, crawlSnapshotRepo, sourceRepo } from "@validatehome/db";
import { createWorkerDb } from "../db.js";
import { executeCrawl } from "../pipeline/crawl-executor.js";
import { replayDlqById } from "../pipeline/replay.js";

async function ensureDrillSourceId(db: ReturnType<typeof createWorkerDb>): Promise<string> {
  const repo = sourceRepo(db);
  const validUrl = "https://www.energy.gov/energysaver/heat-pump-systems";
  const existing = await repo.findByUrl(validUrl);
  if (existing) {
    await repo.update(existing.id, {
      isActive: true,
      metadata: {
        ...(typeof existing.metadata === "object" && existing.metadata ? existing.metadata : {}),
        country: "US",
        tier: "drill",
      },
    });
    return existing.id;
  }

  const created = await repo.create({
    url: validUrl,
    sourceType: "webpage",
    crawlFrequencyMs: 60_000,
    isActive: true,
    metadata: { country: "US", tier: "drill" },
  });
  return created.id;
}

async function main(): Promise<void> {
  const db = createWorkerDb();
  try {
    const sourceRepository = sourceRepo(db);
    const dlqRepository = crawlDlqRepo(db);
    const snapshotRepository = crawlSnapshotRepo(db);

    const sourceId = await ensureDrillSourceId(db);
    const source = await sourceRepository.findById(sourceId);
    if (!source) {
      throw new Error("Drill source missing");
    }

    await sourceRepository.update(source.id, { url: "https://localhost:3000/drill" });
    const failedRun = await executeCrawl(db, { sourceId: source.id });
    if (failedRun.success) {
      throw new Error("Expected failure during blocked-host drill");
    }

    const dlqEntries = await dlqRepository.findUnresolvedBySource(source.id, 1);
    const dlqEntry = dlqEntries[0];
    if (!dlqEntry) {
      throw new Error("Expected unresolved DLQ entry after failed drill run");
    }

    await sourceRepository.update(source.id, {
      url: "https://www.energy.gov/energysaver/heat-pump-systems",
    });
    const replayOk = await replayDlqById(db, dlqEntry.id);
    if (!replayOk) {
      throw new Error("Replay failed for drill source");
    }

    const before = await snapshotRepository.findBySource(source.id);
    await executeCrawl(db, { sourceId: source.id });
    await executeCrawl(db, { sourceId: source.id });
    const after = await snapshotRepository.findBySource(source.id);

    const beforeCount = before.length;
    const afterCount = after.length;
    const uniqueIngestionKeys = new Set(
      after.map((snapshot) => snapshot.ingestionKey).filter(Boolean),
    );
    const noDuplicateIngestion =
      uniqueIngestionKeys.size === after.filter((s) => s.ingestionKey).length;

    process.stdout.write(
      `${JSON.stringify(
        {
          sourceId: source.id,
          replayResolved: replayOk,
          snapshotsBefore: beforeCount,
          snapshotsAfter: afterCount,
          uniqueIngestionKeys: uniqueIngestionKeys.size,
          noDuplicateIngestion,
        },
        null,
        2,
      )}\n`,
    );

    if (!noDuplicateIngestion) {
      throw new Error("Idempotency drill detected duplicate ingestion keys");
    }
  } finally {
    await db.close();
  }
}

await main();
