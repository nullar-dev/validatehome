import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Home Energy Rebates by Country",
    description:
      "Browse available home energy upgrade rebates, incentives, and grants across the US, UK, Australia, and Canada.",
    alternates: {
      canonical: "https://validatehome.com/programs",
      languages: {
        "en-US": "https://validatehome.com/programs/us",
        "en-GB": "https://validatehome.com/programs/uk",
        "en-AU": "https://validatehome.com/programs/au",
        "en-CA": "https://validatehome.com/programs/ca",
        "x-default": "https://validatehome.com/programs",
      },
    },
  };
}

export default function ProgramsPage() {
  const countries = [
    { code: "us", name: "United States", flag: "🇺🇸", programs: "IRS 25C, 25D, State Rebates" },
    { code: "uk", name: "United Kingdom", flag: "🇬🇧", programs: "BUS, ECO4, GBIS" },
    { code: "au", name: "Australia", flag: "🇦🇺", programs: "Solar Credits, State Programs" },
    { code: "ca", name: "Canada", flag: "🇨🇦", programs: "Greener Homes, Provincial" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold">Home Energy Rebates & Incentives</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Find and stack available rebates for heat pumps, solar, insulation, and more.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">Select Your Country</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {countries.map((country) => (
            <Link
              key={country.code}
              href={`/programs/${country.code}`}
              className="group rounded-xl border p-6 transition-shadow hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{country.flag}</span>
                <div>
                  <h3 className="text-xl font-semibold">{country.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{country.programs}</p>
                </div>
              </div>
              <div className="mt-4 text-sm font-medium text-primary group-hover:underline">
                Browse Programs →
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-muted p-8">
        <h2 className="mb-4 text-2xl font-semibold">Net-Cost Calculator</h2>
        <p className="mb-6 text-muted-foreground">
          Calculate your actual out-of-pocket cost after stacking all available incentives.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/calculator/heat_pump"
            className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Heat Pump Savings
          </Link>
          <Link
            href="/calculator/solar"
            className="rounded-lg border px-6 py-3 font-semibold hover:bg-accent"
          >
            Solar Savings
          </Link>
        </div>
      </section>
    </main>
  );
}
