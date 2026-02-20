import { MeiliSearch } from "meilisearch";

/** Extended MeiliSearch client type that supports task waiting */
type WaitableClient = MeiliSearch & {
  waitForTask?: (
    taskUid: number,
    options?: { timeout?: number; interval?: number },
  ) => Promise<unknown>;
  getTask?: (taskUid: number) => Promise<{ status: string }>;
};

/** Configuration for connecting to MeiliSearch */
export interface MeilisearchConfig {
  /** The host URL of the MeiliSearch instance */
  readonly host: string;
  /** Optional API key for authentication */
  readonly apiKey?: string;
}

/** Country codes supported in search */
export type SearchCountryCode = "US" | "UK" | "AU" | "CA" | "unknown";
/** Program status values in search index */
export type SearchProgramStatus =
  | "open"
  | "waitlist"
  | "reserved"
  | "funded"
  | "closed"
  | "coming_soon"
  | "unknown";
/** Currency codes in search results */
export type SearchCurrencyCode = "USD" | "GBP" | "AUD" | "CAD" | "unknown";
/** Benefit types in search results */
export type SearchBenefitType =
  | "tax_credit"
  | "rebate"
  | "grant"
  | "loan"
  | "financing"
  | "unknown";

/** Document structure for programs in MeiliSearch index */
export interface ProgramDocument {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly status: SearchProgramStatus;
  readonly country: SearchCountryCode;
  readonly jurisdiction: string;
  readonly categories: readonly string[];
  readonly benefitType: SearchBenefitType;
  readonly maxAmount: number | null;
  readonly currency: SearchCurrencyCode;
  readonly url: string;
  readonly lastVerified: string | null;
}

/** Options for searching programs */
export interface SearchOptions {
  readonly query: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly filter?: string[];
  readonly sort?: string[];
}

/** Result of a search query */
export interface SearchResult {
  readonly hits: readonly ProgramDocument[];
  readonly totalHits: number;
  readonly processingTimeMs: number;
  readonly query: string;
}

/**
 * Waits for a MeiliSearch task to complete or reach a terminal state.
 * @param client - The MeiliSearch client
 * @param taskUid - The task UID to wait for
 * @throws Error if task does not reach terminal state within timeout
 */
async function waitForTaskCompletion(client: MeiliSearch, taskUid: number): Promise<void> {
  const waitable = client as WaitableClient;

  if (waitable.waitForTask) {
    await waitable.waitForTask(taskUid, { timeout: 10_000, interval: 100 });
    return;
  }

  if (!waitable.getTask) {
    return;
  }

  const task = await waitable.getTask(taskUid);
  if (!["succeeded", "failed", "canceled"].includes(task.status)) {
    throw new Error(`Search task ${taskUid} did not reach terminal state`);
  }
}

/**
 * Creates a configured MeiliSearch client.
 * @param config - The MeiliSearch configuration
 * @returns A configured MeiliSearch client instance
 */
export function createMeilisearchClient(config: MeilisearchConfig): MeiliSearch {
  return new MeiliSearch({
    host: config.host,
    apiKey: config.apiKey,
  });
}

/**
 * Indexes program documents into MeiliSearch.
 * @param client - The MeiliSearch client
 * @param programs - Array of program documents to index
 * @param indexName - The name of the index (default: "programs")
 * @returns Promise that resolves when indexing is complete
 */
export async function indexPrograms(
  client: MeiliSearch,
  programs: ProgramDocument[],
  indexName = "programs",
): Promise<void> {
  const index = client.index(indexName);
  const task = await index.addDocuments(programs, { primaryKey: "id" });
  await waitForTaskCompletion(client, task.taskUid);
}

/**
 * Searches for programs in MeiliSearch.
 * @param client - The MeiliSearch client
 * @param options - Search options including query, pagination, filters, and sorting
 * @param indexName - The name of the index (default: "programs")
 * @returns Search result with hits, total count, and metadata
 */
export async function searchPrograms(
  client: MeiliSearch,
  options: SearchOptions,
  indexName = "programs",
): Promise<SearchResult> {
  const index = client.index(indexName);

  const results = await index.search<ProgramDocument>(options.query, {
    limit: options.limit ?? 20,
    offset: options.offset ?? 0,
    filter: options.filter,
    sort: options.sort,
  });

  return {
    hits: results.hits,
    totalHits: results.estimatedTotalHits ?? results.hits.length,
    processingTimeMs: results.processingTimeMs,
    query: results.query,
  };
}

/**
 * Configures MeiliSearch index settings for program search.
 * @param client - The MeiliSearch client
 * @param indexName - The name of the index (default: "programs")
 * @returns Promise that resolves when configuration is complete
 */
export async function configureIndex(client: MeiliSearch, indexName = "programs"): Promise<void> {
  const index = client.index(indexName);

  const task = await index.updateSettings({
    searchableAttributes: ["name", "description", "jurisdiction", "categories"],
    filterableAttributes: ["status", "country", "jurisdiction", "categories", "benefitType"],
    sortableAttributes: ["name", "lastVerified", "maxAmount"],
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: {
        oneTypo: 4,
        twoTypos: 8,
      },
    },
  });
  await waitForTaskCompletion(client, task.taskUid);
}

/**
 * Deletes a program document from the MeiliSearch index.
 * @param client - The MeiliSearch client
 * @param programId - The ID of the program to delete
 * @param indexName - The name of the index (default: "programs")
 * @returns Promise that resolves when deletion is complete
 */
/**
 * Deletes a program document from the MeiliSearch index.
 * @param client - The MeiliSearch client
 * @param programId - The ID of the program to delete
 * @param indexName - The name of the index (default: "programs")
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteProgram(
  client: MeiliSearch,
  _programId: string,
  indexName = "programs",
): Promise<void> {
  const index = client.index(indexName);
  const task = await index.deleteDocument(_programId);
  await waitForTaskCompletion(client, task.taskUid);
}

/**
 * Checks the health of the MeiliSearch instance.
 * @param client - The MeiliSearch client
 * @returns True if the service is available and healthy, false otherwise
 */
export async function healthCheck(client: MeiliSearch): Promise<boolean> {
  try {
    const health = await client.health();
    return health.status === "available";
  } catch {
    return false;
  }
}
