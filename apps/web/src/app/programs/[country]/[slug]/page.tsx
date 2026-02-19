import { createDb } from "@validatehome/db";
import { benefits, jurisdictions, programs } from "@validatehome/db/schema";
import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation.js";

interface Props {
  params: Promise<{ readonly country: string; readonly slug: string }>;
}

export async function generateStaticParams() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return [];
  }

  const db = createDb(dbUrl);
  try {
    const allPrograms = await db
      .select({
        slug: programs.slug,
        jurisdiction: jurisdictions.country,
      })
      .from(programs)
      .innerJoin(jurisdictions, eq(programs.jurisdictionId, jurisdictions.id))
      .limit(100);

    return allPrograms.map((p: { slug: string | null; jurisdiction: string | null }) => ({
      country: p.jurisdiction?.toLowerCase() ?? "us",
      slug: p.slug ?? "",
    }));
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: static params best-effort logging
    console.error("Failed to generate static params for program pages", error);
    return [];
  } finally {
    await db.close();
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, slug } = await params;

  return {
    title: `${slug.replace(/-/g, " ")} - ${country.toUpperCase()} Rebate`,
    description: `Details about the ${slug.replace(/-/g, " ")} program in ${country.toUpperCase()}.`,
    alternates: {
      canonical: `https://validatehome.com/programs/${country}/${slug}`,
      languages: {
        "x-default": `https://validatehome.com/programs/${country}/${slug}`,
      },
    },
    openGraph: {
      title: `${slug.replace(/-/g, " ")} - ${country.toUpperCase()} Rebate`,
      description: `Details about the ${slug.replace(/-/g, " ")} program in ${country.toUpperCase()}.`,
      type: "website",
      url: `https://validatehome.com/programs/${country}/${slug}`,
    },
  };
}

const COUNTRY_NAMES: Record<string, string> = {
  us: "United States",
  uk: "United Kingdom",
  au: "Australia",
  ca: "Canada",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: "bg-green-100", text: "text-green-800" },
  waitlist: { bg: "bg-yellow-100", text: "text-yellow-800" },
  reserved: { bg: "bg-blue-100", text: "text-blue-800" },
  funded: { bg: "bg-purple-100", text: "text-purple-800" },
  closed: { bg: "bg-red-100", text: "text-red-800" },
  coming_soon: { bg: "bg-gray-100", text: "text-gray-800" },
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  waitlist: "Waitlist",
  reserved: "Reserved",
  funded: "Fully Funded",
  closed: "Closed",
  coming_soon: "Coming Soon",
};

type ProgramBenefit = {
  id: string;
  type: string;
  percentage: number | null;
  maxAmount: string | null;
  description: string | null;
};

const BENEFIT_TYPE_LABELS: Record<string, string> = {
  tax_credit: "Tax Credit",
  rebate: "Rebate",
  grant: "Grant",
};

function formatBenefitLabel(benefit: ProgramBenefit): string {
  const typeLabel = BENEFIT_TYPE_LABELS[benefit.type] ?? "Benefit";
  const percentageLabel = benefit.percentage !== null ? ` - ${benefit.percentage}%` : "";
  const maxAmountLabel =
    benefit.maxAmount !== null ? ` up to $${Number(benefit.maxAmount).toLocaleString()}` : "";
  return `${typeLabel}${percentageLabel}${maxAmountLabel}`;
}

function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/<\/script/gi, "<\\/script");
}

function createProgramJsonLd(params: {
  name: string;
  description: string | null;
  countryName: string;
  country: string;
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "GovernmentService",
    name: params.name,
    description:
      params.description ?? `Home energy upgrade incentive program in ${params.countryName}`,
    provider: {
      "@type": "GovernmentOrganization",
      name: "ValidateHome",
      url: "https://validatehome.com",
    },
    serviceType: "Rebate",
    areaServed: {
      "@type": "Country",
      name: params.countryName,
    },
    url: `https://validatehome.com/programs/${params.country}/${params.slug}`,
  };
}

function isCountryCode(value: string): value is "US" | "UK" | "AU" | "CA" {
  return value === "US" || value === "UK" || value === "AU" || value === "CA";
}

async function getProgramPageData(
  db: ReturnType<typeof createDb>,
  countryCode: "US" | "UK" | "AU" | "CA",
  slug: string,
) {
  const [programResult] = await db
    .select({ program: programs })
    .from(programs)
    .innerJoin(jurisdictions, eq(programs.jurisdictionId, jurisdictions.id))
    .where(and(eq(programs.slug, slug), eq(jurisdictions.country, countryCode)))
    .limit(1);

  if (!programResult?.program) {
    return null;
  }

  const programBenefits = await db
    .select({
      id: benefits.id,
      type: benefits.type,
      percentage: benefits.percentage,
      maxAmount: benefits.maxAmount,
      description: benefits.description,
    })
    .from(benefits)
    .where(eq(benefits.programId, programResult.program.id));

  return { program: programResult.program, programBenefits };
}

export default async function ProgramPage({ params }: Props) {
  const { country, slug } = await params;
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    notFound();
  }

  const db = createDb(dbUrl);

  try {
    const countryCode = country.toUpperCase();
    if (!isCountryCode(countryCode)) {
      notFound();
    }

    const pageData = await getProgramPageData(db, countryCode, slug);
    if (!pageData) {
      notFound();
    }

    const { program, programBenefits } = pageData;
    const countryName = COUNTRY_NAMES[country] ?? country.toUpperCase();

    const statusKey = program.status ?? "open";
    const statusStyle = STATUS_COLORS[statusKey] ?? { bg: "bg-green-100", text: "text-green-800" };
    const statusLabel = STATUS_LABELS[statusKey] ?? "Unknown";

    const budgetRemaining =
      typeof program.budgetRemaining === "string" ? Number(program.budgetRemaining) : null;
    const budgetTotal =
      typeof program.budgetTotal === "string" ? Number(program.budgetTotal) : null;

    const lastVerified = program.lastVerifiedAt
      ? program.lastVerifiedAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Recently";

    const jsonLd = createProgramJsonLd({
      name: program.name,
      description: program.description,
      countryName,
      country,
      slug,
    });

    return (
      <>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
        <main className="mx-auto max-w-4xl px-4 py-12">
          <nav className="mb-8 flex gap-2 text-sm">
            <a href="/programs" className="text-muted-foreground hover:underline">
              Programs
            </a>
            <span className="text-muted-foreground">/</span>
            <a href={`/programs/${country}`} className="text-muted-foreground hover:underline">
              {countryName}
            </a>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground">{slug}</span>
          </nav>

          <article>
            <header className="mb-8">
              <h1 className="text-4xl font-bold capitalize">{program.name}</h1>
              <p className="mt-2 text-lg text-muted-foreground">{program.description}</p>
            </header>

            <section className="mb-8 rounded-lg border p-6">
              <h2 className="mb-4 text-xl font-semibold">Program Status</h2>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}
                >
                  {statusLabel}
                </span>
                <span className="text-sm text-muted-foreground">Last verified: {lastVerified}</span>
              </div>
              {budgetTotal !== null && budgetRemaining !== null && (
                <div className="mt-4">
                  <div className="mb-1 text-sm font-medium">
                    Budget: ${budgetRemaining.toLocaleString()} remaining of $
                    {budgetTotal.toLocaleString()}
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-green-600"
                      style={{ width: `${Math.min(100, 100 - (program.budgetPctUsed ?? 0))}%` }}
                    />
                  </div>
                </div>
              )}
            </section>

            <section className="mb-8 rounded-lg border p-6">
              <h2 className="mb-4 text-xl font-semibold">Benefits</h2>
              {programBenefits.length > 0 ? (
                <ul className="space-y-3">
                  {programBenefits.map((benefit) => {
                    const b: ProgramBenefit = benefit;
                    return (
                      <li key={b.id} className="rounded-md bg-muted p-3">
                        <div className="font-medium">{formatBenefitLabel(b)}</div>
                        <div className="mt-1 text-sm text-muted-foreground">{b.description}</div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-muted-foreground">No benefits information available.</p>
              )}
            </section>

            <section className="mb-8 rounded-lg border p-6">
              <h2 className="mb-4 text-xl font-semibold">Eligibility</h2>
              <p className="text-muted-foreground">
                Visit the official program website for detailed eligibility requirements.
              </p>
            </section>

            <section className="rounded-lg bg-muted p-6">
              <h2 className="mb-4 text-xl font-semibold">How to Apply</h2>
              {program.programUrl ? (
                <a
                  href={program.programUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Visit the official program website to apply
                </a>
              ) : (
                <p className="text-muted-foreground">Application details coming soon.</p>
              )}
            </section>
          </article>
        </main>
      </>
    );
  } finally {
    await db.close();
  }
}
