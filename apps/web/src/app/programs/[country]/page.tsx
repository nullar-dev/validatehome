import { createDb } from "@validatehome/db";
import { jurisdictions, programs } from "@validatehome/db/schema";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

interface Props {
  params: Promise<{ readonly country: string }>;
  searchParams?: Promise<{ readonly category?: string }>;
}

const COUNTRY_NAMES: Record<string, string> = {
  us: "United States",
  uk: "United Kingdom",
  au: "Australia",
  ca: "Canada",
};

export async function generateStaticParams() {
  return [{ country: "us" }, { country: "uk" }, { country: "au" }, { country: "ca" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const name = COUNTRY_NAMES[country] ?? country.toUpperCase();

  return {
    title: `${name} Home Energy Rebates`,
    description: `Browse available home energy upgrade rebates, incentives, and grants in ${name}.`,
    alternates: {
      canonical: `https://validatehome.com/programs/${country}`,
      languages: {
        "en-US": `/programs/us`,
        "en-GB": `/programs/uk`,
        "en-AU": `/programs/au`,
        "en-CA": `/programs/ca`,
        "x-default": "/programs/us",
      },
    },
  };
}

const COUNTRY_DATA: Record<string, { name: string; flag: string; description: string }> = {
  us: {
    name: "United States",
    flag: "🇺🇸",
    description: "Federal tax credits (25C, 25D, 25E), state rebates, and utility programs.",
  },
  uk: {
    name: "United Kingdom",
    flag: "🇬🇧",
    description: "Boiler Upgrade Scheme (BUS), ECO4, and Great British Insulation Scheme.",
  },
  au: {
    name: "Australia",
    flag: "🇦🇺",
    description: "Solar Credits, state battery programs, and energy efficiency rebates.",
  },
  ca: {
    name: "Canada",
    flag: "🇨🇦",
    description: "Greener Homes Grant, provincial rebates, and utility programs.",
  },
};

function isCountryCode(value: string): value is "US" | "UK" | "AU" | "CA" {
  return value === "US" || value === "UK" || value === "AU" || value === "CA";
}

export default async function CountryProgramsPage({ params, searchParams }: Props) {
  const { country } = await params;
  const query = (await searchParams) ?? {};
  const selectedCategory = query.category?.toLowerCase();
  const data = COUNTRY_DATA[country] ?? {
    name: country.toUpperCase(),
    flag: "🌍",
    description: "",
  };

  const dbUrl = process.env.DATABASE_URL;
  const programList: Array<{ id: string; name: string; slug: string; status: string }> = [];

  if (dbUrl) {
    const db = createDb(dbUrl);
    try {
      const countryCode = country.toUpperCase();
      if (isCountryCode(countryCode)) {
        const rows = await db
          .select({
            id: programs.id,
            name: programs.name,
            slug: programs.slug,
            status: programs.status,
          })
          .from(programs)
          .innerJoin(jurisdictions, eq(programs.jurisdictionId, jurisdictions.id))
          .where(eq(jurisdictions.country, countryCode))
          .limit(50);
        programList.push(...rows);
      }
    } finally {
      await db.close();
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8">
        <Link href="/programs" className="text-sm text-muted-foreground hover:underline">
          ← All Countries
        </Link>
      </div>

      <header className="mb-12">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{data.flag}</span>
          <h1 className="text-4xl font-bold">{data.name} Rebates & Incentives</h1>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">{data.description}</p>
      </header>

      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">Categories</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {["heat-pump", "solar", "insulation", "battery", "ev-charger"].map((cat) => (
            <Link
              key={cat}
              href={`/programs/${country}?category=${cat}`}
              className="rounded-lg border p-4 text-center transition-colors hover:bg-accent"
            >
              <span className="font-medium capitalize">{cat.replaceAll("-", " ")}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-semibold">Active Programs</h2>
        {programList.length === 0 ? (
          <p className="text-muted-foreground">No active programs found for this country.</p>
        ) : (
          <ul className="space-y-3">
            {programList
              .filter((program) => {
                if (!selectedCategory) {
                  return true;
                }
                return program.slug.includes(selectedCategory.replaceAll("-", "_"));
              })
              .map((program) => (
                <li key={program.id} className="rounded-lg border p-4">
                  <Link
                    href={`/programs/${country}/${program.slug}`}
                    className="font-medium hover:underline"
                  >
                    {program.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">Status: {program.status}</p>
                </li>
              ))}
          </ul>
        )}
      </section>
    </main>
  );
}
