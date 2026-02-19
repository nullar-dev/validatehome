import type { Metadata } from "next";
import Link from "next/link";

interface Props {
  params: Promise<{ readonly country: string; readonly geo: string }>;
}

const geoData: Record<string, Record<string, { name: string; type: string }>> = {
  us: {
    ca: { name: "California", type: "state" },
    ny: { name: "New York", type: "state" },
    tx: { name: "Texas", type: "state" },
    fl: { name: "Florida", type: "state" },
    ma: { name: "Massachusetts", type: "state" },
  },
  uk: {
    london: { name: "London", type: "region" },
    "greater-london": { name: "Greater London", type: "region" },
    scotland: { name: "Scotland", type: "nation" },
    wales: { name: "Wales", type: "nation" },
  },
  au: {
    nsw: { name: "New South Wales", type: "state" },
    vic: { name: "Victoria", type: "state" },
    qld: { name: "Queensland", type: "state" },
    wa: { name: "Western Australia", type: "state" },
    sa: { name: "South Australia", type: "state" },
  },
  ca: {
    on: { name: "Ontario", type: "province" },
    bc: { name: "British Columbia", type: "province" },
    qc: { name: "Quebec", type: "province" },
    ab: { name: "Alberta", type: "province" },
    ns: { name: "Nova Scotia", type: "province" },
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
  const countryCode = country.toLowerCase();
  const geoCode = geo.toLowerCase();
  const countryName = countryNames[countryCode] ?? countryCode;
  const geoInfo = geoData[countryCode]?.[geoCode];
  const geoName = geoInfo?.name ?? geo;
  const canonicalPath = `/local/${countryCode}/${geoCode}`;

  return {
    title: `${geoName} Energy Rebates & Incentives - ${countryName}`,
    description: `Find ${geoName} home energy rebates, incentives, and grants in ${countryName}. Heat pumps, solar, and more.`,
    alternates: {
      canonical: canonicalPath,
      languages: {
        "x-default": canonicalPath,
      },
    },
  };
}

export default async function LocalPage({ params }: Props) {
  const { country, geo } = await params;
  const countryCode = country.toLowerCase();
  const geoCode = geo.toLowerCase();
  const countryName = countryNames[countryCode] ?? countryCode;
  const geoInfo = geoData[countryCode]?.[geoCode];
  const geoName = geoInfo?.name ?? geo;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <nav className="mb-8 flex gap-2 text-sm">
        <Link href="/programs" className="text-muted-foreground hover:underline">
          Programs
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href={`/programs/${countryCode}`} className="text-muted-foreground hover:underline">
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
              href={`/programs/${countryCode}?category=${cat}`}
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
          href={`/calculator/heat_pump?geo=${geoCode}`}
          className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Calculate Savings
        </Link>
      </section>
    </main>
  );
}
