import type { Metadata } from "next";
import Link from "next/link";

interface Props {
  params: Promise<{ readonly country: string }>;
}

export async function generateStaticParams() {
  return [{ country: "us" }, { country: "uk" }, { country: "au" }, { country: "ca" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const countryNames: Record<string, string> = {
    us: "United States",
    uk: "United Kingdom",
    au: "Australia",
    ca: "Canada",
  };

  const name = countryNames[country] ?? country.toUpperCase();

  return {
    title: `${name} Home Energy Rebates`,
    description: `Browse available home energy upgrade rebates, incentives, and grants in ${name}.`,
    alternates: {
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

const countryData: Record<string, { name: string; flag: string; description: string }> = {
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

export default async function CountryProgramsPage({ params }: Props) {
  const { country } = await params;
  const data = countryData[country] ?? { name: country.toUpperCase(), flag: "🌍", description: "" };

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
              <span className="font-medium capitalize">{cat.replace("-", " ")}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-semibold">Active Programs</h2>
        <p className="text-muted-foreground">Loading programs from our live database...</p>
      </section>
    </main>
  );
}
