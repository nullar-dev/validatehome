import { type Benefit, createDb, type Program, programRepo } from "@validatehome/db";
import { benefits, jurisdictions } from "@validatehome/db/schema";
import {
  configureIndex,
  createMeilisearchClient,
  healthCheck,
  indexPrograms,
  type ProgramDocument,
} from "@validatehome/shared";
import { inArray } from "drizzle-orm";

const db = createDb(process.env.DATABASE_URL ?? "postgresql://localhost:5432/validatehome");

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST ?? "http://localhost:7700";
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY;

function getCurrency(country?: string): string {
  const currencyMap: Record<string, string> = {
    US: "USD",
    UK: "GBP",
    AU: "AUD",
    CA: "CAD",
  };
  return currencyMap[country ?? ""] ?? "USD";
}

function mapProgramToDocument(
  program: Program,
  jurisdictionMap: Map<string, { country: string; name: string; isoCode: string | null }>,
  benefitMap: Map<string, Benefit[]>,
): ProgramDocument {
  const jurisdiction = jurisdictionMap.get(program.jurisdictionId);
  const programBenefits = benefitMap.get(program.id) ?? [];
  const primaryBenefit = programBenefits[0];

  return {
    id: program.id,
    name: program.name,
    slug: program.slug,
    description: program.description,
    status: program.status,
    country: jurisdiction?.country ?? "unknown",
    jurisdiction: jurisdiction?.name ?? jurisdiction?.isoCode ?? "unknown",
    categories: [],
    benefitType: primaryBenefit?.type ?? "unknown",
    maxAmount: primaryBenefit ? parseFloat(primaryBenefit.maxAmount ?? "0") : null,
    currency: getCurrency(jurisdiction?.country),
    url: `https://validatehome.com/programs/${jurisdiction?.country?.toLowerCase() ?? "us"}/${program.slug}`,
    lastVerified: program.lastVerifiedAt?.toISOString() ?? null,
  };
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function syncProgramsToSearch(): Promise<{ indexed: number; errors: number }> {
  const client = createMeilisearchClient({
    host: MEILISEARCH_HOST,
    apiKey: MEILISEARCH_API_KEY,
  });

  const isHealthy = await healthCheck(client);
  if (!isHealthy) {
    return { indexed: 0, errors: 1 };
  }

  await configureIndex(client);

  const repo = programRepo(db);
  const result = await repo.findAll();
  const programs = Array.isArray(result) ? result : result.data;

  const jurisdictionRows = await db
    .select({
      id: jurisdictions.id,
      country: jurisdictions.country,
      name: jurisdictions.name,
      isoCode: jurisdictions.isoCode,
    })
    .from(jurisdictions);
  const jurisdictionMap = new Map(
    jurisdictionRows.map((row) => [
      row.id,
      { country: row.country, name: row.name, isoCode: row.isoCode },
    ]),
  );

  const programIds = programs.map((program) => program.id);
  const benefitRows = programIds.length
    ? await db
        .select({
          programId: benefits.programId,
          type: benefits.type,
          maxAmount: benefits.maxAmount,
          percentage: benefits.percentage,
          currency: benefits.currency,
          description: benefits.description,
        })
        .from(benefits)
        .where(inArray(benefits.programId, programIds))
    : [];

  const benefitMap = new Map<string, Benefit[]>();
  for (const row of benefitRows) {
    const current = benefitMap.get(row.programId) ?? [];
    current.push(row as Benefit);
    benefitMap.set(row.programId, current);
  }

  const documents: ProgramDocument[] = [];
  let errors = 0;
  for (const program of programs) {
    try {
      documents.push(mapProgramToDocument(program, jurisdictionMap, benefitMap));
    } catch (error) {
      console.error("Failed to map program for indexing", { programId: program.id, error });
      errors++;
    }
  }

  let indexed = 0;
  for (const batch of chunkArray(documents, 250)) {
    try {
      await indexPrograms(client, batch);
      indexed += batch.length;
    } catch (error) {
      console.error("Failed to index batch", { batchSize: batch.length, error });
      errors += batch.length;
    }
  }

  return { indexed, errors };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  syncProgramsToSearch()
    .then(({ errors }) => {
      process.exit(errors > 0 ? 1 : 0);
    })
    .catch(() => {
      process.exit(1);
    });
}
