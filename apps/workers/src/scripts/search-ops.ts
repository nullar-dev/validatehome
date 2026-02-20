import { createDb } from "@validatehome/db";
import { programs } from "@validatehome/db/schema";
import {
  configureIndex,
  createMeilisearchClient,
  indexPrograms,
  healthCheck as meiliHealthCheck,
  type ProgramDocument,
} from "@validatehome/shared";

/** MeiliSearch host URL from environment or default localhost */
const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST ?? "http://localhost:7700";
/** MeiliSearch API key from environment */
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY ?? "";
/** Database URL from environment */
const DATABASE_URL = process.env.DATABASE_URL;

/** Name of the search index */
const INDEX_NAME = "programs";

/**
 * Performs a full reindex of all programs from the database to MeiliSearch.
 * Drops existing index and recreates with current data.
 * @returns Promise that resolves when reindex is complete
 */
async function fullReindex() {
  if (!DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const client = createMeilisearchClient({
    host: MEILISEARCH_HOST,
    apiKey: MEILISEARCH_API_KEY,
  });
  const db = createDb(DATABASE_URL);

  try {
    // eslint-disable-next-line no-console
    console.log("Starting full reindex...");

    const allPrograms = await db.select().from(programs);
    // eslint-disable-next-line no-console
    console.log(`Found ${allPrograms.length} programs`);

    await configureIndex(client, INDEX_NAME);

    const documents: ProgramDocument[] = allPrograms.map((program) => ({
      id: program.id,
      name: program.name,
      slug: program.slug,
      description: program.description ?? "",
      status: program.status,
      country: "unknown",
      jurisdiction: "",
      categories: [],
      benefitType: "unknown",
      maxAmount: program.budgetTotal ? Number(program.budgetTotal) : null,
      currency: "USD",
      url: program.programUrl ?? "",
      lastVerified: program.lastVerifiedAt?.toISOString() ?? null,
    }));

    await indexPrograms(client, documents, INDEX_NAME);
    // eslint-disable-next-line no-console
    console.log("Full reindex complete!");
  } finally {
    await db.close();
  }
}

async function healthCheck() {
  const client = createMeilisearchClient({
    host: MEILISEARCH_HOST,
    apiKey: MEILISEARCH_API_KEY,
  });

  try {
    const isHealthy = await meiliHealthCheck(client);
    if (!isHealthy) {
      // eslint-disable-next-line no-console
      console.error("Meilisearch health check failed");
      process.exit(1);
    }

    // eslint-disable-next-line no-console
    console.log("Meilisearch is healthy");

    const index = client.index(INDEX_NAME);
    const stats = await index.getStats();
    // eslint-disable-next-line no-console
    console.log(`Index stats: ${stats.numberOfDocuments} documents`);

    if (DATABASE_URL) {
      const db = createDb(DATABASE_URL);
      try {
        const dbPrograms = await db.select().from(programs);
        const indexCount = stats.numberOfDocuments;
        const dbCount = dbPrograms.length;

        if (indexCount !== dbCount) {
          // eslint-disable-next-line no-console
          console.warn(`Index count mismatch: index=${indexCount}, db=${dbCount}`);
        } else {
          // eslint-disable-next-line no-console
          console.log(`Index count matches: ${indexCount} documents`);
        }
      } finally {
        await db.close();
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Health check failed:", error);
    process.exit(1);
  }
}

const command = process.argv[2];

if (command === "reindex") {
  fullReindex().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
} else if (command === "health") {
  healthCheck().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
} else {
  // eslint-disable-next-line no-console
  console.log("Usage:");
  // eslint-disable-next-line no-console
  console.log("  search-ops reindex  - Perform a full reindex");
  // eslint-disable-next-line no-console
  console.log("  search-ops health   - Check search index health");
  process.exit(1);
}
