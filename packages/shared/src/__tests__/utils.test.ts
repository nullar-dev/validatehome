import { describe, expect, it } from "vitest";
import {
  calculateSavingsPercentage,
  clamp,
  formatCurrency,
  getCurrencyForCountry,
  isValidPostalCode,
  normalizePostalCode,
  slugify,
} from "../utils/index.js";

describe("isValidPostalCode", () => {
  it("validates US ZIP codes", () => {
    expect(isValidPostalCode("90210", "US")).toBe(true);
    expect(isValidPostalCode("90210-1234", "US")).toBe(true);
    expect(isValidPostalCode("9021", "US")).toBe(false);
    expect(isValidPostalCode("ABCDE", "US")).toBe(false);
  });

  it("validates UK postcodes", () => {
    expect(isValidPostalCode("SW1A 1AA", "UK")).toBe(true);
    expect(isValidPostalCode("EC1A 1BB", "UK")).toBe(true);
    expect(isValidPostalCode("M1 1AE", "UK")).toBe(true);
    expect(isValidPostalCode("12345", "UK")).toBe(false);
  });

  it("validates AU postcodes", () => {
    expect(isValidPostalCode("2000", "AU")).toBe(true);
    expect(isValidPostalCode("200", "AU")).toBe(false);
    expect(isValidPostalCode("20000", "AU")).toBe(false);
  });

  it("validates CA postal codes", () => {
    expect(isValidPostalCode("K1A 0B1", "CA")).toBe(true);
    expect(isValidPostalCode("K1A0B1", "CA")).toBe(true);
    expect(isValidPostalCode("12345", "CA")).toBe(false);
  });
});

describe("normalizePostalCode", () => {
  it("normalizes UK postcodes with consistent spacing and handles short codes", () => {
    expect(normalizePostalCode("sw1a1aa", "UK")).toBe("SW1A 1AA");
    expect(normalizePostalCode("SW1A  1AA", "UK")).toBe("SW1A 1AA");
    expect(normalizePostalCode("M1", "UK")).toBe("M1");
    expect(normalizePostalCode("  e1  ", "UK")).toBe("E1");
  });

  it("normalizes CA postal codes with consistent spacing and handles non-standard lengths", () => {
    expect(normalizePostalCode("k1a0b1", "CA")).toBe("K1A 0B1");
    expect(normalizePostalCode("K1A  0B1", "CA")).toBe("K1A 0B1");
    expect(normalizePostalCode("K1A", "CA")).toBe("K1A");
    expect(normalizePostalCode("K1A0B", "CA")).toBe("K1A0B");
  });

  it("trims and uppercases US ZIP codes", () => {
    expect(normalizePostalCode("  90210  ", "US")).toBe("90210");
  });
});

describe("slugify", () => {
  it("converts text to URL-friendly slug", () => {
    expect(slugify("IRS 25C Tax Credit")).toBe("irs-25c-tax-credit");
    expect(slugify("Hello  World")).toBe("hello-world");
    expect(slugify("Special!@#Characters")).toBe("specialcharacters");
  });
});

describe("clamp", () => {
  it("clamps values within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("calculateSavingsPercentage", () => {
  it("calculates correct percentage", () => {
    expect(calculateSavingsPercentage(10000, 7000)).toBe(30);
    expect(calculateSavingsPercentage(12000, 4200)).toBe(65);
  });

  it("handles zero sticker price", () => {
    expect(calculateSavingsPercentage(0, 0)).toBe(0);
  });

  it("handles full savings", () => {
    expect(calculateSavingsPercentage(10000, 0)).toBe(100);
  });
});

describe("getCurrencyForCountry", () => {
  it("returns correct currency", () => {
    expect(getCurrencyForCountry("US")).toBe("USD");
    expect(getCurrencyForCountry("UK")).toBe("GBP");
    expect(getCurrencyForCountry("AU")).toBe("AUD");
    expect(getCurrencyForCountry("CA")).toBe("CAD");
  });
});

describe("formatCurrency", () => {
  it("formats USD amounts", () => {
    const result = formatCurrency(12000, "USD", "US");
    expect(result).toContain("12,000");
  });

  it("formats GBP amounts", () => {
    const result = formatCurrency(5000, "GBP", "UK");
    expect(result).toContain("5,000");
  });
});
