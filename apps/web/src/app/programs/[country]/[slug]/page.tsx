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
  } catch {
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
        "en-US": `https://validatehome.com/programs/us/${slug}`,
        "en-GB": `https://validatehome.com/programs/uk/${slug}`,
        "en-AU": `https://validatehome.com/programs/au/${slug}`,
        "en-CA": `https://validatehome.com/programs/ca/${slug}`,
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

const countryNames: Record<string, string> = {
  us: "United States",
  uk: "United Kingdom",
  au: "Australia",
  ca: "Canada",
};

const statusColors: Record<string, { bg: string; text: string }> = {
  open: { bg: "bg-green-100", text: "text-green-800" },
  waitlist: { bg: "bg-yellow-100", text: "text-yellow-800" },
  reserved: { bg: "bg-blue-100", text: "text-blue-800" },
  funded: { bg: "bg-purple-100", text: "text-purple-800" },
  closed: { bg: "bg-red-100", text: "text-red-800" },
  coming_soon: { bg: "bg-gray-100", text: "text-gray-800" },
};

const statusLabels: Record<string, string> = {
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

const benefitTypeLabels: Record<string, string> = {
  tax_credit: "Tax Credit",
  rebate: "Rebate",
  grant: "Grant",
};

function formatBenefitLabel(benefit: ProgramBenefit): string {
  const typeLabel = benefitTypeLabels[benefit.type] ?? "Benefit";
  const percentageLabel = benefit.percentage !== null ? ` - ${benefit.percentage}%` : "";
  const maxAmountLabel =
    benefit.maxAmount !== null ? ` up to $${Number(benefit.maxAmount).toLocaleString()}` : "";
  return `${typeLabel}${percentageLabel}${maxAmountLabel}`;
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

    const [programResult] = await db
      .select({ program: programs })
      .from(programs)
      .innerJoin(jurisdictions, eq(programs.jurisdictionId, jurisdictions.id))
      .where(
        and(
          eq(programs.slug, slug),
          eq(jurisdictions.country, countryCode as "US" | "UK" | "AU" | "CA"),
        ),
      )
      .limit(1);

    if (!programResult?.program) {
      notFound();
    }

    const program = programResult.program;
    const countryName = countryNames[country] ?? country.toUpperCase();

    const programBenefits = await db
      .select()
      .from(benefits)
      .where(eq(benefits.programId, program.id));

    const statusKey = program.status ?? "open";
    const statusStyle = statusColors[statusKey] ?? { bg: "bg-green-100", text: "text-green-800" };
    const statusLabel = statusLabels[statusKey] ?? "Unknown";

    const lastVerified = program.lastVerifiedAt
      ? program.lastVerifiedAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Recently";

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "GovernmentService",
      name: program.name,
      description: program.description ?? `Home energy upgrade incentive program in ${countryName}`,
      provider: {
        "@type": "GovernmentOrganization",
        name: "ValidateHome",
        url: "https://validatehome.com",
      },
      serviceType: "Rebate",
      areaServed: {
        "@type": "Country",
        name: countryName,
      },
      url: `https://validatehome.com/programs/${country}/${slug}`,
    };

    return (
      <>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
              {program.budgetTotal && (
                <div className="mt-4">
                  <div className="mb-1 text-sm font-medium">
                    Budget: ${Number(program.budgetRemaining).toLocaleString()} remaining of $
                    {Number(program.budgetTotal).toLocaleString()}
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
                    const b = benefit as ProgramBenefit;
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
