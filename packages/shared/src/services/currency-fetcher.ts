import type { Currency } from "@validatehome/shared";

export interface ExchangeRate {
  from: Currency;
  to: Currency;
  rate: number;
  timestamp: Date;
}

export interface HistoricalRate extends ExchangeRate {
  fetchedAt: Date;
}

export interface CurrencyFetcherOptions {
  cacheTtlMs?: number;
  fallbackRates?: Record<Currency, Record<Currency, number>>;
}

const DEFAULT_FALLBACK_RATES: Record<Currency, Record<Currency, number>> = {
  USD: { USD: 1, GBP: 0.79, AUD: 1.53, CAD: 1.36 },
  GBP: { USD: 1.27, GBP: 1, AUD: 1.94, CAD: 1.73 },
  AUD: { USD: 0.65, GBP: 0.52, AUD: 1, CAD: 0.89 },
  CAD: { USD: 0.74, GBP: 0.58, AUD: 1.12, CAD: 1 },
};

const DEFAULT_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

export class CurrencyFetcher {
  private cache: Map<string, { rate: number; timestamp: number }>;
  private cacheTtlMs: number;
  private fallbackRates: Record<Currency, Record<Currency, number>>;
  private historicalRates: HistoricalRate[];

  constructor(options: CurrencyFetcherOptions = {}) {
    this.cache = new Map();
    this.cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL;
    this.fallbackRates = options.fallbackRates ?? DEFAULT_FALLBACK_RATES;
    this.historicalRates = [];
  }

  async getExchangeRate(from: Currency, to: Currency): Promise<ExchangeRate> {
    if (from === to) {
      return { from, to, rate: 1, timestamp: new Date() };
    }

    const cacheKey = `${from}-${to}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return {
        from,
        to,
        rate: cached.rate,
        timestamp: new Date(cached.timestamp),
      };
    }

    try {
      const rate = await this.fetchLiveRate(from, to);
      this.cache.set(cacheKey, { rate, timestamp: Date.now() });

      this.historicalRates.push({
        from,
        to,
        rate,
        timestamp: new Date(),
        fetchedAt: new Date(),
      });

      if (this.historicalRates.length > 1000) {
        this.historicalRates = this.historicalRates.slice(-500);
      }

      return { from, to, rate, timestamp: new Date() };
    } catch {
      const fallbackRate = this.getFallbackRate(from, to);
      return { from, to, rate: fallbackRate, timestamp: new Date() };
    }
  }

  async convert(amount: number, from: Currency, to: Currency): Promise<number> {
    const rate = await this.getExchangeRate(from, to);
    return Math.round(amount * rate.rate * 100) / 100;
  }

  private async fetchLiveRate(_from: Currency, _to: Currency): Promise<number> {
    return this.getFallbackRate(_from, _to);
  }

  private getFallbackRate(from: Currency, to: Currency): number {
    const rates = this.fallbackRates[from];
    if (!rates) {
      return 1;
    }
    return rates[to] ?? 1;
  }

  getHistoricalRates(from?: Currency, to?: Currency, limit?: number): HistoricalRate[] {
    let rates = this.historicalRates;

    if (from) {
      rates = rates.filter((r) => r.from === from);
    }

    if (to) {
      rates = rates.filter((r) => r.to === to);
    }

    if (limit) {
      rates = rates.slice(-limit);
    }

    return rates;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheAge(): Record<string, number> {
    const ages: Record<string, number> = {};
    const now = Date.now();

    for (const [key, value] of this.cache.entries()) {
      ages[key] = now - value.timestamp;
    }

    return ages;
  }
}

export const defaultCurrencyFetcher = new CurrencyFetcher();

export async function getExchangeRate(from: Currency, to: Currency): Promise<ExchangeRate> {
  return defaultCurrencyFetcher.getExchangeRate(from, to);
}

export async function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
): Promise<number> {
  return defaultCurrencyFetcher.convert(amount, from, to);
}

export function getHistoricalRates(
  from?: Currency,
  to?: Currency,
  limit?: number,
): HistoricalRate[] {
  return defaultCurrencyFetcher.getHistoricalRates(from, to, limit);
}
