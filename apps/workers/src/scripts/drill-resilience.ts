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

    const originalUrl = source.url;
    let replayOk = false;
    let beforeCount = 0;
    let afterCount = 0;
    let noDuplicateIngestion = false;
    let uniqueIngestionKeysCount = 0;

    try {
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
      replayOk = await replayDlqById(db, dlqEntry.id);
      if (!replayOk) {
        throw new Error("Replay failed for drill source");
      }

      const before = await snapshotRepository.findBySource(source.id);
      const firstReplayRun = await executeCrawl(db, { sourceId: source.id });
      if (!firstReplayRun.success) {
        throw new Error("Expected successful crawl after replay (1)");
      }
      const secondReplayRun = await executeCrawl(db, { sourceId: source.id });
      if (!secondReplayRun.success) {
        throw new Error("Expected successful crawl after replay (2)");
      }
      const after = await snapshotRepository.findBySource(source.id);

      beforeCount = before.length;
      afterCount = after.length;
      const uniqueIngestionKeys = new Set(
        after.map((snapshot) => snapshot.ingestionKey).filter(Boolean),
      );
      uniqueIngestionKeysCount = uniqueIngestionKeys.size;
      noDuplicateIngestion =
        uniqueIngestionKeys.size === after.filter((snapshot) => snapshot.ingestionKey).length;
    } finally {
      await sourceRepository.update(source.id, { url: originalUrl });
    }

    process.stdout.write(
      `${JSON.stringify(
        {
          sourceId: source.id,
          replayResolved: replayOk,
          snapshotsBefore: beforeCount,
          snapshotsAfter: afterCount,
          uniqueIngestionKeys: uniqueIngestionKeysCount,
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
