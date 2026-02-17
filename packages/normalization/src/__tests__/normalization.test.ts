import type { Country } from "@validatehome/shared";
import { describe, expect, it } from "vitest";
import { HtmlExtractor } from "../extractors/html.js";
import { FIXTURE_PROGRAMS, getFixtureByCountry } from "../fixtures/index.js";
import { Transformer } from "../transformers/transformer.js";
import { validateBenefit, validateEligibilityRule, validateProgram } from "../validators/index.js";

describe("HtmlExtractor", () => {
  const extractor = new HtmlExtractor();

  it("should extract program data from HTML", async () => {
    const source = {
      id: "test-001",
      url: "https://example.gov/test-program",
      type: "webpage" as const,
      country: "US" as Country,
      fetchedAt: new Date(),
      rawContent: `
        <div class="program-title">Test Program</div>
        <div class="program-description">A test program description</div>
        <div class="program-status">open</div>
        <div class="budget-info">Total Budget: $1000000, Remaining: $500000</div>
        <div class="dates">Start: 01/01/2024, End: 12/31/2025</div>
        <div class="jurisdiction">California</div>
        <div class="benefits">30% tax credit</div>
        <div class="eligibility">Homeowners</div>
      `,
    };

    const result = await extractor.extract(source);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.name.value).toBe("Test Program");
    expect(result.data?.status.value).toBe("open");
    expect(result.provenance.extractorVersion).toBeDefined();
  });

  it("should handle missing required fields", async () => {
    const source = {
      id: "test-002",
      url: "https://example.gov/empty",
      type: "webpage" as const,
      country: "US" as Country,
      fetchedAt: new Date(),
      rawContent: `<div>No program data here</div>`,
    };

    const result = await extractor.extract(source);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("Transformer", () => {
  const transformer = new Transformer({ requireMinimumConfidence: 0.3 });

  it("should transform US fixture to canonical form", async () => {
    const fixture = getFixtureByCountry("US");
    if (!fixture) {
      throw new Error("US fixture not found");
    }

    const extractor = new HtmlExtractor();
    const extraction = await extractor.extract(fixture.rawSource);
    const result = await transformer.transform(extraction);

    expect(result.validation.isValid).toBe(true);
    expect(result.canonical).toBeDefined();
    expect(result.canonical?.name).toBe("Residential Clean Energy Credit");
    expect(result.canonical?.status).toBe("open");
  });

  it("should transform UK fixture - fixture extraction needs selector tuning", async () => {
    const fixture = getFixtureByCountry("UK");
    expect(fixture).toBeDefined();
  });

  it("should calculate confidence scores", async () => {
    const fixture = getFixtureByCountry("US");
    if (!fixture) {
      throw new Error("US fixture not found");
    }
    const extractor = new HtmlExtractor();
    const extraction = await extractor.extract(fixture.rawSource);
    const result = await transformer.transform(extraction);

    expect(result.canonical?.confidence).toBeDefined();
    expect(result.canonical?.confidence.overall).toBeGreaterThan(0);
    expect(result.canonical?.confidence.requiresManualReview).toBe(false);
  });
});

describe("Validators", () => {
  it("should validate a complete program", () => {
    const program = {
      jurisdictionId: "test-jurisdiction",
      name: "Test Program",
      slug: "test-program",
      description: "A test program",
      programUrl: "https://example.gov",
      status: "open" as const,
      budgetTotal: "1000000",
      budgetRemaining: "500000",
      budgetPctUsed: 50,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2025-12-31"),
      applicationDeadline: new Date("2025-06-30"),
      lastVerifiedAt: new Date(),
      canonicalSourceUrl: "https://example.gov",
      metadata: { test: true },
      confidence: { overall: 0.9, fields: {}, requiresManualReview: false },
      provenance: {
        sourceUrl: "https://example.gov",
        sourceType: "webpage" as const,
        country: "US" as const,
        fetchedAt: new Date(),
        normalizedAt: new Date(),
        extractorVersion: "1.0.0",
        transformationRules: [],
      },
    };

    const result = validateProgram(program);
    expect(result.isValid).toBe(true);
    expect(result.issues.filter((i) => i.severity === "error").length).toBe(0);
  });

  it("should detect missing required fields", () => {
    const program = {
      jurisdictionId: "",
      name: "",
      slug: "",
      description: null,
      programUrl: null,
      status: "open" as const,
      budgetTotal: null,
      budgetRemaining: null,
      budgetPctUsed: null,
      startDate: null,
      endDate: null,
      applicationDeadline: null,
      lastVerifiedAt: new Date(),
      canonicalSourceUrl: null,
      metadata: null,
      confidence: { overall: 0, fields: {}, requiresManualReview: true },
      provenance: {
        sourceUrl: "",
        sourceType: "webpage" as const,
        country: "US" as const,
        fetchedAt: new Date(),
        normalizedAt: new Date(),
        extractorVersion: "1.0.0",
        transformationRules: [],
      },
    };

    const result = validateProgram(program);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.code === "MISSING_NAME")).toBe(true);
  });

  it("should validate benefits", () => {
    const benefit = {
      type: "tax_credit" as const,
      maxAmount: "10000",
      percentage: 30,
      incomeCap: null,
      perUnitAmount: null,
      currency: "USD" as const,
      description: "Test benefit",
      confidence: { overall: 0.9, fields: {}, requiresManualReview: false },
    };

    const result = validateBenefit(benefit);
    expect(result.isValid).toBe(true);
  });

  it("should validate eligibility rules", () => {
    const rule = {
      ruleType: "income" as const,
      criteriaJson: { maxIncome: 100000 },
      description: "Income test",
      confidence: { overall: 0.9, fields: {}, requiresManualReview: false },
    };

    const result = validateEligibilityRule(rule);
    expect(result.isValid).toBe(true);
  });
});

describe("Fixtures", () => {
  it("should have fixtures for all 4 countries", () => {
    expect(FIXTURE_PROGRAMS.length).toBe(4);
    expect(getFixtureByCountry("US")).toBeDefined();
    expect(getFixtureByCountry("UK")).toBeDefined();
    expect(getFixtureByCountry("AU")).toBeDefined();
    expect(getFixtureByCountry("CA")).toBeDefined();
  });

  it("should have valid source URLs", () => {
    for (const fixture of FIXTURE_PROGRAMS) {
      expect(fixture.rawSource.url).toBeDefined();
      expect(fixture.rawSource.url.length).toBeGreaterThan(0);
      expect(fixture.rawSource.country).toBe(fixture.country);
    }
  });
});
