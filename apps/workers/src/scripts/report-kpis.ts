import { crawlJobs } from "@validatehome/db";
import { createWorkerDb } from "../db.js";

function extractQuality(job: typeof crawlJobs.$inferSelect): {
  readonly completeness: number;
  readonly confidence: number;
} {
  const quality =
    job.metadata && typeof job.metadata === "object" && "quality" in job.metadata
      ? (job.metadata.quality as Record<string, unknown>)
      : undefined;

  return {
    completeness:
      quality && typeof quality.requiredFieldCompleteness === "number"
        ? quality.requiredFieldCompleteness
        : 0,
    confidence:
      quality && typeof quality.confidenceOverall === "number" ? quality.confidenceOverall : 0,
  };
}

async function main(): Promise<void> {
  const db = createWorkerDb();
  try {
    const jobs = await db.select().from(crawlJobs);

    const succeededJobs = jobs.filter((job) => job.status === "succeeded");
    const fetchStatuses = succeededJobs.map((job) => {
      const metadata = job.metadata && typeof job.metadata === "object" ? job.metadata : undefined;
      if (metadata && "fetchStatus" in metadata && typeof metadata.fetchStatus === "number") {
        return metadata.fetchStatus;
      }
      if (metadata && "status" in metadata && typeof metadata.status === "number") {
        return metadata.status;
      }
      return undefined;
    });
    const status200 = fetchStatuses.filter((status) => status === 200).length;
    const status304 = fetchStatuses.filter((status) => status === 304).length;
    const totalFetches = fetchStatuses.filter((status) => status !== undefined).length;

    const totalJobs = succeededJobs.length;
    const completenessPass = succeededJobs.filter((job) => {
      const quality = extractQuality(job);
      return quality.completeness >= 0.95;
    }).length;
    const confidencePass = succeededJobs.filter((job) => {
      const quality = extractQuality(job);
      return quality.confidence >= 0.75;
    }).length;

    const latestBySource = new Map<string, typeof crawlJobs.$inferSelect>();
    for (const job of succeededJobs) {
      const quality = extractQuality(job);
      if (quality.completeness <= 0 && quality.confidence <= 0) {
        continue;
      }
      const existing = latestBySource.get(job.sourceId);
      if (!existing || job.createdAt > existing.createdAt) {
        latestBySource.set(job.sourceId, job);
      }
    }

    const latestPilotJobs = [...latestBySource.values()];
    const latestCompletenessPass = latestPilotJobs.filter(
      (job) => extractQuality(job).completeness >= 0.95,
    ).length;
    const latestConfidencePass = latestPilotJobs.filter(
      (job) => extractQuality(job).confidence >= 0.75,
    ).length;

    const report = {
      fetchEfficiency: {
        total: totalFetches,
        status200,
        status304,
        pct304: totalFetches > 0 ? Number((status304 / totalFetches).toFixed(4)) : 0,
      },
      quality: {
        totalJobs,
        completenessPass,
        confidencePass,
        completenessRate: totalJobs > 0 ? Number((completenessPass / totalJobs).toFixed(4)) : 0,
        confidenceRate: totalJobs > 0 ? Number((confidencePass / totalJobs).toFixed(4)) : 0,
      },
      latestPerSourceBatch: {
        totalSources: latestPilotJobs.length,
        completenessPass: latestCompletenessPass,
        confidencePass: latestConfidencePass,
        completenessRate:
          latestPilotJobs.length > 0
            ? Number((latestCompletenessPass / latestPilotJobs.length).toFixed(4))
            : 0,
        confidenceRate:
          latestPilotJobs.length > 0
            ? Number((latestConfidencePass / latestPilotJobs.length).toFixed(4))
            : 0,
      },
    };

    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } finally {
    await db.close();
  }
}

await main();
