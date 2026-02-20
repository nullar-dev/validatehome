import type { Metadata } from "next";
import { CalculatorForm } from "@/components/calculator-form";

interface Props {
  params: Promise<{ readonly category: string }>;
}

export async function generateStaticParams() {
  return [{ category: "heat_pump" }, { category: "solar" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const categoryName = category === "heat_pump" ? "Heat Pump" : "Solar Panel";

  return {
    title: `${categoryName} Cost Calculator - ValidateHome`,
    description: `Calculate the net cost of ${categoryName.toLowerCase()} installations after applying available incentives and rebates.`,
    openGraph: {
      title: `${categoryName} Cost Calculator - ValidateHome`,
      description: `Calculate the net cost of ${categoryName.toLowerCase()} installations after applying available incentives and rebates.`,
      type: "website",
      url: `https://validatehome.com/calculator/${category}`,
    },
  };
}

const categoryInfo: Record<string, { title: string; description: string; icon: string }> = {
  heat_pump: {
    title: "Heat Pump Cost Calculator",
    description:
      "Calculate the net cost of heat pump installation after applying federal tax credits, state rebates, and utility incentives.",
    icon: "thermometer",
  },
  solar: {
    title: "Solar Panel Cost Calculator",
    description:
      "Calculate the net cost of solar panel installation after applying federal tax credits, state rebates, and utility incentives.",
    icon: "sun",
  },
};

const defaultCategoryInfo = {
  title: "Cost Calculator",
  description: "Calculate the net cost after applying available incentives.",
  icon: "calculator",
};

function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/<\/script/gi, "<\\/script");
}

export default async function CalculatorPage({ params }: Props) {
  const { category } = await params;
  const info = categoryInfo[category] ?? defaultCategoryInfo;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Calculator",
    name: info.title,
    description: info.description,
    provider: {
      "@type": "Organization",
      name: "ValidateHome",
      url: "https://validatehome.com",
    },
  };

  return (
    <>
      <script type="application/ld+json">{safeJsonLd(jsonLd)}</script>
      <main className="mx-auto max-w-4xl px-4 py-12">
        <nav className="mb-8 flex gap-2 text-sm">
          <a href="/" className="text-muted-foreground hover:underline">
            Home
          </a>
          <span className="text-muted-foreground">/</span>
          <a href="/calculator" className="text-muted-foreground hover:underline">
            Calculator
          </a>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground">{category}</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-4xl font-bold">{info.title}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{info.description}</p>
        </header>

        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">Calculate Your Savings</h2>
          <p className="text-muted-foreground mb-6">
            Enter your details below to calculate the net cost after applying available incentives.
          </p>

          <CalculatorForm category={category} />
        </div>
      </main>
    </>
  );
}
