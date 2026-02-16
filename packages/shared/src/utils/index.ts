import { COUNTRY_LOCALE, COUNTRY_POSTAL_CODE_REGEX } from "../constants/index.js";
import { COUNTRY_CURRENCY, type Country, type Currency } from "../types/index.js";

export function formatCurrency(amount: number, currency: Currency, country: Country): string {
  const locale = COUNTRY_LOCALE[country];
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getCurrencyForCountry(country: Country): Currency {
  return COUNTRY_CURRENCY[country];
}

export function isValidPostalCode(code: string, country: Country): boolean {
  const regex = COUNTRY_POSTAL_CODE_REGEX[country];
  return regex.test(code.trim());
}

export function normalizePostalCode(code: string, country: Country): string {
  const trimmed = code.trim().toUpperCase();
  if (country === "UK") {
    const clean = trimmed.replace(/\s+/g, "");
    if (clean.length > 3) {
      return `${clean.slice(0, -3)} ${clean.slice(-3)}`;
    }
    return clean;
  }
  if (country === "CA") {
    const clean = trimmed.replace(/\s+/g, "");
    if (clean.length === 6) {
      return `${clean.slice(0, 3)} ${clean.slice(3)}`;
    }
    return clean;
  }
  return trimmed;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function calculateSavingsPercentage(stickerPrice: number, netCost: number): number {
  if (stickerPrice <= 0) return 0;
  return Math.round(((stickerPrice - netCost) / stickerPrice) * 100);
}
