import {
  type Benefit,
  benefitRepo,
  createDb,
  type Jurisdiction,
  jurisdictionRepo,
  type Program,
  programRepo,
} from "@validatehome/db";
import {
  configureIndex,
  createMeilisearchClient,
  healthCheck,
  indexPrograms,
  type ProgramDocument,
} from "@validatehome/shared";

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

async function mapProgramToDocument(program: Program): Promise<ProgramDocument | null> {
  const jurisdictionRepoFn = jurisdictionRepo(db);
  const jurisdiction = (await jurisdictionRepoFn.findById(program.jurisdictionId)) as
    | Jurisdiction
    | undefined;

  const benefitRepoFn = benefitRepo(db);
  const benefits = (await benefitRepoFn.findByProgram(program.id)) as Benefit[];
  const primaryBenefit = benefits[0];

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

  let indexed = 0;
  let errors = 0;

  for (const program of programs) {
    try {
      const doc = await mapProgramToDocument(program);
      if (doc) {
        await indexPrograms(client, [doc]);
        indexed++;
      }
    } catch (_error) {
      errors++;
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
