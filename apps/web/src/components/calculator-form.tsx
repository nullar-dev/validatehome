"use client";

import { useState } from "react";

interface CalculatorFormProps {
  category: string;
}

interface CalculationResult {
  stickerPrice: number;
  netCost: number;
  totalSavings: number;
  appliedIncentives: Array<{
    name: string;
    amount: number;
    type: string;
  }>;
}

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  UK: "United Kingdom",
  AU: "Australia",
  CA: "Canada",
};

export function CalculatorForm({ category }: CalculatorFormProps) {
  const [country, setCountry] = useState("US");
  const [stickerPrice, setStickerPrice] = useState("");
  const [income, setIncome] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          stickerPrice: Number(stickerPrice),
          householdIncome: income ? Number(income) : undefined,
          category,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Calculation failed");
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="country" className="mb-2 block text-sm font-medium">
            Country
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          >
            {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="stickerPrice" className="mb-2 block text-sm font-medium">
            Sticker Price ($)
          </label>
          <input
            type="number"
            id="stickerPrice"
            value={stickerPrice}
            onChange={(e) => setStickerPrice(e.target.value)}
            placeholder="e.g., 15000"
            required
            min={1}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="income" className="mb-2 block text-sm font-medium">
            Annual Household Income ($) <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            type="number"
            id="income"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder="e.g., 75000"
            min={0}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Income may affect eligibility for certain programs
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !stickerPrice}
          className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Calculating..." : "Calculate Net Cost"}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-md bg-red-50 p-4 text-red-800">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-md bg-green-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-green-900">Your Estimated Savings</h3>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-green-700">Sticker Price</p>
              <p className="text-2xl font-bold text-green-900">
                ${result.stickerPrice.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-green-700">Net Cost</p>
              <p className="text-2xl font-bold text-green-900">
                ${result.netCost.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-green-700">Total Savings</p>
            <p className="text-xl font-semibold text-green-800">
              ${result.totalSavings.toLocaleString()} (
              {Math.round((result.totalSavings / result.stickerPrice) * 100)}%)
            </p>
          </div>

          {result.appliedIncentives.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-green-700">Applied Incentives</p>
              <ul className="space-y-2">
                {result.appliedIncentives.map((incentive, idx) => (
                  <li
                    key={`incentive-${idx}-${incentive.name}`}
                    className="flex justify-between rounded bg-white p-2 text-sm"
                  >
                    <span>{incentive.name}</span>
                    <span className="font-medium text-green-800">
                      -${incentive.amount.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
