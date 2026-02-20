import { createMeilisearchClient, healthCheck } from "@validatehome/shared";

/** MeiliSearch host URL from environment or default localhost */
const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST ?? "http://localhost:7700";
/** MeiliSearch API key from environment */
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY;

/**
 * Checks the health of the MeiliSearch instance and exits with appropriate status code.
 * @returns Promise that resolves when health check is complete
 */
async function checkHealth(): Promise<void> {
  const client = createMeilisearchClient({
    host: MEILISEARCH_HOST,
    apiKey: MEILISEARCH_API_KEY,
  });

  const isHealthy = await healthCheck(client);

  if (isHealthy) {
    console.log("Search health check passed");
    return;
  } else {
    console.error("Search health check failed");
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  checkHealth().catch((error) => {
    console.error("Search health script error", error);
    process.exit(1);
  });
}
