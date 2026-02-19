"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  jurisdiction: { name: string } | null;
}

interface Facets {
  countries: string[];
  statuses: string[];
  categories: string[];
}

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [facets, setFacets] = useState<Facets | null>(null);

  useEffect(() => {
    fetch("/api/search/facets")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setFacets(data.data);
      })
      .catch(() => {});
  }, []);

  const performSearch = useCallback(async () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (country) params.set("country", country);
    if (status) params.set("status", status);

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();
      setResults(data.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, country, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2 || country || status) {
        performSearch();
      } else if (query.length === 0 && !country && !status) {
        setResults([]);
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, country, status, performSearch]);

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search programs..."
          className="flex-1 min-w-[200px] rounded-lg border p-3"
          aria-label="Search programs"
        />
        {facets && (
          <>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="rounded-lg border p-3"
              aria-label="Filter by country"
            >
              <option value="">All Countries</option>
              {facets.countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border p-3"
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              {facets.statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && hasSearched && results.length === 0 && (
        <p className="mt-4 text-center text-muted-foreground">
          No programs found. Try adjusting your filters.
        </p>
      )}

      {results.length > 0 && (
        <ul className="mt-4 divide-y rounded-lg border bg-background">
          {results.map((result) => (
            <li key={result.id}>
              <Link href={`/programs/us/${result.slug}`} className="block p-4 hover:bg-muted">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{result.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {result.jurisdiction?.name ?? "Unknown"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      result.status === "open"
                        ? "bg-green-100 text-green-800"
                        : result.status === "waitlist"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {result.status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
