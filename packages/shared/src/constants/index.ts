import type { Country } from "../types/index.js";

export const SUPPORTED_COUNTRIES: readonly Country[] = ["US", "UK", "AU", "CA"] as const;

export const PRODUCT_CATEGORIES = [
  "heat_pump",
  "solar",
  "insulation",
  "ev_charger",
  "water_heater",
  "windows",
  "weatherization",
  "battery_storage",
] as const;

export type ProductCategorySlug = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategorySlug, string> = {
  heat_pump: "Heat Pump",
  solar: "Solar Panels",
  insulation: "Insulation",
  ev_charger: "EV Charger",
  water_heater: "Water Heater",
  windows: "Windows & Doors",
  weatherization: "Weatherization",
  battery_storage: "Battery Storage",
} as const;

export const COUNTRY_LABELS: Record<Country, string> = {
  US: "United States",
  UK: "United Kingdom",
  AU: "Australia",
  CA: "Canada",
} as const;

export const COUNTRY_LOCALE: Record<Country, string> = {
  US: "en-US",
  UK: "en-GB",
  AU: "en-AU",
  CA: "en-CA",
} as const;

export const COUNTRY_POSTAL_CODE_REGEX: Record<Country, RegExp> = {
  US: /^\d{5}(-\d{4})?$/,
  UK: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i,
  AU: /^\d{4}$/,
  CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
} as const;

export const CRAWL_DEFAULTS = {
  DAILY_INTERVAL_MS: 24 * 60 * 60 * 1000,
  WEEKLY_INTERVAL_MS: 7 * 24 * 60 * 60 * 1000,
  REQUEST_DELAY_MS: 3000,
  MAX_RETRIES: 3,
  SCREENSHOT_DIFF_THRESHOLD: 0.02,
  SIGNIFICANCE_AUTO_PROCESS: 70,
  SIGNIFICANCE_HUMAN_REVIEW: 30,
  STALENESS_MULTIPLIER: 2,
} as const;

export const API_RATE_LIMITS: Record<string, number> = {
  free: 100,
  pro: 10_000,
  enterprise: 100_000,
} as const;

export const BUDGET_ALERT_DEFAULT_THRESHOLD = 90;
