import type { Metadata } from "next";
import Link from "next/link";

interface Props {
  params: Promise<{ readonly country: string; readonly geo: string }>;
}

const geoData: Record<string, Record<string, { name: string; type: string }>> = {
  us: {
    CA: { name: "California", type: "state" },
    NY: { name: "New York", type: "state" },
    TX: { name: "Texas", type: "state" },
    FL: { name: "Florida", type: "state" },
    MA: { name: "Massachusetts", type: "state" },
  },
  uk: {
    London: { name: "London", type: "region" },
    "Greater-London": { name: "Greater London", type: "region" },
    Scotland: { name: "Scotland", type: "nation" },
    Wales: { name: "Wales", type: "nation" },
  },
  au: {
    NSW: { name: "New South Wales", type: "state" },
    VIC: { name: "Victoria", type: "state" },
    QLD: { name: "Queensland", type: "state" },
    WA: { name: "Western Australia", type: "state" },
    SA: { name: "South Australia", type: "state" },
  },
  ca: {
    ON: { name: "Ontario", type: "province" },
    BC: { name: "British Columbia", type: "province" },
    QC: { name: "Quebec", type: "province" },
    AB: { name: "Alberta", type: "province" },
    NS: { name: "Nova Scotia", type: "province" },
  },
};

const countryNames: Record<string, string> = {
  us: "United States",
  uk: "United Kingdom",
  au: "Australia",
  ca: "Canada",
};

export async function generateStaticParams() {
  const params: { country: string; geo: string }[] = [];
  for (const country of Object.keys(geoData)) {
    const countryGeo = geoData[country];
    if (countryGeo) {
      for (const geo of Object.keys(countryGeo)) {
        params.push({ country, geo: geo.toLowerCase() });
      }
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, geo } = await params;
  const countryName = countryNames[country] ?? country;
  const geoInfo = geoData[country]?.[geo.toUpperCase()];
  const geoName = geoInfo?.name ?? geo;

  return {
    title: `${geoName} Energy Rebates & Incentives - ${countryName}`,
    description: `Find ${geoName} home energy rebates, incentives, and grants in ${countryName}. Heat pumps, solar, and more.`,
    alternates: {
      languages: {
        "en-US": `/local/us/${geo.toLowerCase()}`,
        "en-GB": `/local/uk/${geo.toLowerCase()}`,
        "en-AU": `/local/au/${geo.toLowerCase()}`,
        "en-CA": `/local/ca/${geo.toLowerCase()}`,
        "x-default": `/local/us/${geo.toLowerCase()}`,
      },
    },
  };
}

export default async function LocalPage({ params }: Props) {
  const { country, geo } = await params;
  const countryName = countryNames[country] ?? country;
  const geoInfo = geoData[country]?.[geo.toUpperCase()];
  const geoName = geoInfo?.name ?? geo;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <nav className="mb-8 flex gap-2 text-sm">
        <Link href="/programs" className="text-muted-foreground hover:underline">
          Programs
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href={`/programs/${country}`} className="text-muted-foreground hover:underline">
          {countryName}
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground">{geoName}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-4xl font-bold">{geoName} Energy Rebates & Incentives</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Available home energy upgrade programs in {geoName}, {countryName}.
        </p>
      </header>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Categories</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {["heat-pump", "solar", "insulation", "battery", "ev-charger"].map((cat) => (
            <Link
              key={cat}
              href={`/programs/${country}?category=${cat}`}
              className="rounded-lg border p-4 text-center hover:bg-muted"
            >
              <span className="font-medium capitalize">{cat.replace("-", " ")}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-muted p-8">
        <h2 className="mb-4 text-2xl font-semibold">Calculate Your Savings</h2>
        <p className="mb-6 text-muted-foreground">
          Use our calculator to find out your net cost after applying all available incentives.
        </p>
        <Link
          href={`/calculator/heat_pump?geo=${geo}`}
          className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Calculate Savings
        </Link>
      </section>
    </main>
  );
}
