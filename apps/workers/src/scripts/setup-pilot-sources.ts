import { sourceRepo } from "@validatehome/db";
import { createWorkerDb } from "../db.js";

interface PilotSourceConfig {
  readonly country: "US" | "UK" | "AU" | "CA";
  readonly url: string;
  readonly sourceType: "webpage" | "pdf" | "api_endpoint";
  readonly crawlFrequencyMs: number;
}

const PILOT_SOURCES: readonly PilotSourceConfig[] = [
  {
    country: "US",
    url: "https://www.energy.gov/energysaver/heat-pump-systems",
    sourceType: "webpage",
    crawlFrequencyMs: 86_400_000,
  },
  {
    country: "UK",
    url: "https://www.gov.uk/apply-boiler-upgrade-scheme",
    sourceType: "webpage",
    crawlFrequencyMs: 86_400_000,
  },
  {
    country: "AU",
    url: "https://www.energy.nsw.gov.au/nsw-plans-and-progress/regulation-and-policy",
    sourceType: "webpage",
    crawlFrequencyMs: 86_400_000,
  },
  {
    country: "CA",
    url: "https://natural-resources.canada.ca/energy-efficiency/homes",
    sourceType: "webpage",
    crawlFrequencyMs: 86_400_000,
  },
];

async function main(): Promise<void> {
  const db = createWorkerDb();
  try {
    const repo = sourceRepo(db);
    let created = 0;
    let updated = 0;

    for (const config of PILOT_SOURCES) {
      const existing = await repo.findByUrl(config.url);
      if (!existing) {
        await repo.create({
          url: config.url,
          sourceType: config.sourceType,
          crawlFrequencyMs: config.crawlFrequencyMs,
          isActive: true,
          metadata: {
            country: config.country,
            tier: "pilot",
            owner: "phase1b",
          },
        });
        created += 1;
        continue;
      }

      await repo.update(existing.id, {
        isActive: true,
        crawlFrequencyMs: config.crawlFrequencyMs,
        metadata: {
          ...(typeof existing.metadata === "object" && existing.metadata ? existing.metadata : {}),
          country: config.country,
          tier: "pilot",
          owner: "phase1b",
        },
      });
      updated += 1;
    }

    process.stdout.write(`Pilot sources ready: created=${created}, updated=${updated}\n`);
  } finally {
    await db.close();
  }
}

await main();
