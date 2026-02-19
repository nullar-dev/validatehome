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
  apiKey?: string;
}

export interface ProgramDocument {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly status: string;
  readonly country: string;
  readonly jurisdiction: string;
  readonly categories: readonly string[];
  readonly benefitType: string;
  readonly maxAmount: number | null;
  readonly currency: string;
  readonly url: string;
  readonly lastVerified: string | null;
}

export interface SearchOptions {
  readonly query: string;
  limit?: number;
  offset?: number;
  filter?: string[];
  sort?: string[];
}

export interface SearchResult {
  hits: ProgramDocument[];
  totalHits: number;
  processingTimeMs: number;
  query: string;
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
