import { MeiliSearch } from "meilisearch";

type WaitableClient = MeiliSearch & {
  waitForTask?: (
    taskUid: number,
    options?: { timeout?: number; interval?: number },
  ) => Promise<unknown>;
  getTask?: (taskUid: number) => Promise<{ status: string }>;
};

export interface MeilisearchConfig {
  readonly host: string;
  readonly apiKey?: string;
}

export type SearchCountryCode = "US" | "UK" | "AU" | "CA" | "unknown";
export type SearchProgramStatus =
  | "open"
  | "waitlist"
  | "reserved"
  | "funded"
  | "closed"
  | "coming_soon"
  | "unknown";
export type SearchCurrencyCode = "USD" | "GBP" | "AUD" | "CAD" | "unknown";
export type SearchBenefitType =
  | "tax_credit"
  | "rebate"
  | "grant"
  | "loan"
  | "financing"
  | "unknown";

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

export interface SearchOptions {
  readonly query: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly filter?: string[];
  readonly sort?: string[];
}

export interface SearchResult {
  readonly hits: readonly ProgramDocument[];
  readonly totalHits: number;
  readonly processingTimeMs: number;
  readonly query: string;
}

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

export function createMeilisearchClient(config: MeilisearchConfig): MeiliSearch {
  return new MeiliSearch({
    host: config.host,
    apiKey: config.apiKey,
  });
}

export async function indexPrograms(
  client: MeiliSearch,
  programs: ProgramDocument[],
  indexName = "programs",
): Promise<void> {
  const index = client.index(indexName);
  const task = await index.addDocuments(programs, { primaryKey: "id" });
  await waitForTaskCompletion(client, task.taskUid);
}

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

export async function deleteProgram(
  client: MeiliSearch,
  programId: string,
  indexName = "programs",
): Promise<void> {
  const index = client.index(indexName);
  const task = await index.deleteDocument(programId);
  await waitForTaskCompletion(client, task.taskUid);
}

export async function healthCheck(client: MeiliSearch): Promise<boolean> {
  try {
    const health = await client.health();
    return health.status === "available";
  } catch {
    return false;
  }
}
