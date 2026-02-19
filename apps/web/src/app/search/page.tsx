import type { Metadata } from "next";
import Link from "next/link";
import { SearchBox } from "../../components/search/search-box";

export const metadata: Metadata = {
  title: "Search Programs",
  description: "Search for home energy rebate and incentive programs",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SearchPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Search Programs</h1>
        <p className="mt-2 text-muted-foreground">
          Find rebate and incentive programs by name, description, or location.
        </p>
      </header>

      <SearchBox />

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-semibold">Browse by Country</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { code: "us", name: "United States" },
            { code: "uk", name: "United Kingdom" },
            { code: "au", name: "Australia" },
            { code: "ca", name: "Canada" },
          ].map((country) => (
            <Link
              key={country.code}
              href={`/programs/${country.code}`}
              className="rounded-lg border p-4 text-center hover:bg-muted"
            >
              {country.name}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
