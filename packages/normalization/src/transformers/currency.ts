import type { Currency } from "@validatehome/shared";

export interface ExchangeRate {
  readonly fromCurrency: Currency;
  readonly toCurrency: Currency;
  readonly rate: number;
  readonly date: Date;
  readonly source: string;
}

export interface LiveRateCache {
  rates: Record<Currency, number>;
  lastUpdated: Date;
  expiresAt: Date;
}

export interface CurrencyConversionResult {
  readonly originalAmount: string;
  readonly originalCurrency: Currency;
  readonly convertedAmount: string;
  readonly toCurrency: Currency;
  readonly rate: number;
  readonly date: Date;
  readonly isHistorical: boolean;
  readonly auditTrail: CurrencyConversionAuditEntry[];
}

export interface CurrencyConversionAuditEntry {
  readonly timestamp: Date;
  readonly fromCurrency: Currency;
  readonly toCurrency: Currency;
  readonly amount: string;
  readonly rate: number;
  readonly source: string;
}

export interface HistoricalRate {
  readonly date: Date;
  readonly rates: Record<Currency, number>;
}

const STATIC_RATES: Record<Currency, number> = {
  USD: 1,
  GBP: 0.79,
  AUD: 1.53,
  CAD: 1.36,
};

const HISTORICAL_RATES: HistoricalRate[] = [
  {
    date: new Date("2024-01-01"),
    rates: { USD: 1, GBP: 0.79, AUD: 1.52, CAD: 1.35 },
  },
  {
    date: new Date("2024-06-01"),
    rates: { USD: 1, GBP: 0.78, AUD: 1.5, CAD: 1.35 },
  },
  {
    date: new Date("2024-12-01"),
    rates: { USD: 1, GBP: 0.77, AUD: 1.51, CAD: 1.34 },
  },
  {
    date: new Date("2025-01-01"),
    rates: { USD: 1, GBP: 0.78, AUD: 1.52, CAD: 1.35 },
  },
  {
    date: new Date("2025-06-01"),
    rates: { USD: 1, GBP: 0.8, AUD: 1.54, CAD: 1.37 },
  },
];

export class CurrencyConverter {
  private readonly useStaticRates: boolean;
  private readonly customRates: Map<string, number> = new Map();
  private readonly auditLog: CurrencyConversionAuditEntry[] = [];

  constructor(options: { useStaticRates?: boolean } = {}) {
    this.useStaticRates = options.useStaticRates ?? true;
  }

  setCustomRate(from: Currency, to: Currency, rate: number): void {
    const key = `${from}-${to}`;
    this.customRates.set(key, rate);
    this.customRates.set(`${to}-${from}`, 1 / rate);
  }

  getAuditLog(): readonly CurrencyConversionAuditEntry[] {
    return [...this.auditLog];
  }

  clearAuditLog(): void {
    this.auditLog.length = 0;
  }

  convert(
    amount: string,
    fromCurrency: Currency,
    toCurrency: Currency,
    options: {
      date?: Date;
      recordAudit?: boolean;
    } = {},
  ): CurrencyConversionResult {
    const { date = new Date(), recordAudit = true } = options;

    if (fromCurrency === toCurrency) {
      return {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount: amount,
        toCurrency,
        rate: 1,
        date,
        isHistorical: false,
        auditTrail: [],
      };
    }

    const rate = this.getRate(fromCurrency, toCurrency, date);
    const numericAmount = Number.parseFloat(amount);
    if (!Number.isFinite(numericAmount)) {
      throw new TypeError(`Invalid amount: ${amount}`);
    }
    const convertedAmount = (numericAmount * rate).toFixed(2);

    const auditEntry: CurrencyConversionAuditEntry = {
      timestamp: new Date(),
      fromCurrency,
      toCurrency,
      amount,
      rate,
      source: this.useStaticRates ? "static-rates" : "historical-rates",
    };

    if (recordAudit) {
      this.auditLog.push(auditEntry);
    }

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount,
      toCurrency,
      rate,
      date,
      isHistorical: !this.useStaticRates,
      auditTrail: recordAudit ? [auditEntry] : [],
    };
  }

  getRate(fromCurrency: Currency, toCurrency: Currency, date: Date = new Date()): number {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const customKey = `${fromCurrency}-${toCurrency}`;
    const customRate = this.customRates.get(customKey);
    if (customRate !== undefined) {
      return customRate;
    }

    if (this.useStaticRates) {
      const fromRate = STATIC_RATES[fromCurrency];
      const toRate = STATIC_RATES[toCurrency];
      return toRate / fromRate;
    }

    const historicalRate = this.getHistoricalRate(fromCurrency, toCurrency, date);
    if (historicalRate) {
      return historicalRate;
    }

    const fromRate = STATIC_RATES[fromCurrency];
    const toRate = STATIC_RATES[toCurrency];
    return toRate / fromRate;
  }

  private getHistoricalRate(
    fromCurrency: Currency,
    toCurrency: Currency,
    date: Date,
  ): number | null {
    const sortedRates = [...HISTORICAL_RATES].sort(
      (a, b) =>
        Math.abs(a.date.getTime() - date.getTime()) - Math.abs(b.date.getTime() - date.getTime()),
    );

    for (const historical of sortedRates) {
      if (historical.rates[fromCurrency] && historical.rates[toCurrency]) {
        return historical.rates[toCurrency] / historical.rates[fromCurrency];
      }
    }

    return null;
  }

  getAvailableCurrencies(): readonly Currency[] {
    return Object.keys(STATIC_RATES) as readonly Currency[];
  }

  getStaticRate(fromCurrency: Currency, toCurrency: Currency): number {
    if (fromCurrency === toCurrency) {
      return 1;
    }
    const fromRate = STATIC_RATES[fromCurrency];
    const toRate = STATIC_RATES[toCurrency];
    return toRate / fromRate;
  }

  getHistoricalRatesForDate(date: Date): HistoricalRate | null {
    const exactMatch = HISTORICAL_RATES.find((r) => r.date.toDateString() === date.toDateString());
    if (exactMatch) {
      return exactMatch;
    }

    const sorted = [...HISTORICAL_RATES].sort((a, b) => a.date.getTime() - b.date.getTime());

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      if (current && next && date > current.date && date < next.date) {
        return current;
      }
    }

    const lastEntry = sorted[sorted.length - 1];
    return lastEntry ?? null;
  }
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const liveRateCache: { data: LiveRateCache | null } = {
  data: null,
};

function getLiveRatesSync(): LiveRateCache {
  if (liveRateCache.data && liveRateCache.data.expiresAt > new Date()) {
    return liveRateCache.data;
  }

  const now = new Date();
  const cache: LiveRateCache = {
    rates: STATIC_RATES,
    lastUpdated: now,
    expiresAt: new Date(now.getTime() + CACHE_TTL_MS),
  };

  liveRateCache.data = cache;
  return cache;
}

export async function getLiveRate(fromCurrency: Currency, toCurrency: Currency): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  const cache = getLiveRatesSync();
  const fromRate = cache.rates[fromCurrency];
  const toRate = cache.rates[toCurrency];

  if (fromRate && toRate) {
    return toRate / fromRate;
  }

  return new CurrencyConverter().getStaticRate(fromCurrency, toCurrency);
}

export function getLiveRates(): LiveRateCache {
  return getLiveRatesSync();
}

export function isCacheValid(): boolean {
  return liveRateCache.data !== null && liveRateCache.data.expiresAt > new Date();
}

export function invalidateCache(): void {
  liveRateCache.data = null;
}

export const defaultCurrencyConverter = new CurrencyConverter({ useStaticRates: true });
