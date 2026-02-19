import { MeiliSearch } from "meilisearch";

export interface MeilisearchConfig {
  host: string;
  apiKey?: string;
}

export interface ProgramDocument {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  country: string;
  jurisdiction: string;
  categories: string[];
  benefitType: string;
  maxAmount: number | null;
  currency: string;
  url: string;
  lastVerified: string | null;
}

export interface SearchOptions {
  query: string;
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

  await index.addDocuments(programs, { primaryKey: "id" });
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

  await index.updateSettings({
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
}

export async function deleteProgram(
  client: MeiliSearch,
  programId: string,
  indexName = "programs",
): Promise<void> {
  const index = client.index(indexName);
  await index.deleteDocument(programId);
}

export async function healthCheck(client: MeiliSearch): Promise<boolean> {
  try {
    const health = await client.health();
    return health.status === "available";
  } catch {
    return false;
  }
}
