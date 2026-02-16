import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ValidateHome - Live Home Upgrade Rebates & Incentives",
  description:
    "Find and stack home energy rebates. Real-time program status for US, UK, Australia, and Canada.",
};

const COUNTRIES = [
  { code: "us", name: "United States", flag: "US", programs: "IRS 25C, IRA HOMES, State Rebates" },
  { code: "uk", name: "United Kingdom", flag: "UK", programs: "BUS, ECO4, GBIS" },
  { code: "au", name: "Australia", flag: "AU", programs: "Federal & State Energy Programs" },
  { code: "ca", name: "Canada", flag: "CA", programs: "NRCan, Provincial Programs" },
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          Home Upgrade Rebates, <span className="text-primary">Verified in Real-Time</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Stop guessing. See live program status, check eligibility, and calculate your actual net
          cost after stacking all available incentives.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/calculator/heat_pump"
            className="rounded-lg bg-primary px-6 py-3 text-lg font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Calculate Savings
          </Link>
          <Link
            href="/programs/us"
            className="rounded-lg border px-6 py-3 text-lg font-semibold hover:bg-accent"
          >
            Browse Programs
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-center text-3xl font-bold">Supported Countries</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {COUNTRIES.map((country) => (
            <Link
              key={country.code}
              href={`/programs/${country.code}`}
              className="rounded-xl border p-6 transition-shadow hover:shadow-lg"
            >
              <div className="text-2xl font-bold">{country.flag}</div>
              <h3 className="mt-2 text-xl font-semibold">{country.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{country.programs}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
