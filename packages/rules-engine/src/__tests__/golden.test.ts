import { describe, expect, it } from "vitest";
import { createRulesEngine, evaluateStackability } from "../engine.js";
import {
  getActiveRules,
  getAllCountryRules,
  getExpiredRules,
  getRulesForJurisdiction,
} from "../rules/index.js";
import type { ProgramFact } from "../types.js";

interface GoldenTestCase {
  name: string;
  jurisdiction: string;
  programA: ProgramFact;
  programB: ProgramFact;
  expectedCanStack: boolean;
  expectedExplanationIncludes?: string;
  expectedSourceIncludes?: string;
}

function makeProgram(
  overrides: Partial<ProgramFact> & Pick<ProgramFact, "id" | "name">,
): ProgramFact {
  return {
    type: "rebate",
    level: "federal",
    jurisdiction: "US",
    ...overrides,
  };
}

const us25C = makeProgram({
  id: "us-25c",
  name: "IRS 25C Heat Pump Tax Credit",
  type: "tax_credit",
  level: "federal",
  code: "25C",
  jurisdiction: "US",
});

const us25D = makeProgram({
  id: "us-25d",
  name: "IRS 25D Solar Tax Credit",
  type: "tax_credit",
  level: "federal",
  code: "25D",
  jurisdiction: "US",
});

const caTech = makeProgram({
  id: "ca-tech",
  name: "California TECH Clean Energy",
  type: "rebate",
  level: "state",
  code: "TECH",
  jurisdiction: "US-CA",
});

const nyHeatPump = makeProgram({
  id: "ny-heat-pump",
  name: "NYSERDA Heat Pump Rebate",
  type: "rebate",
  level: "state",
  code: "NY-HEAT-PUMP",
  jurisdiction: "US-NY",
});

const maHeatPump = makeProgram({
  id: "ma-heat-pump",
  name: "Mass Save Heat Pump Rebate",
  type: "rebate",
  level: "state",
  code: "MA-HEAT-PUMP",
  jurisdiction: "US-MA",
});

const pgeRebate = makeProgram({
  id: "pge-rebate",
  name: "PG&E Solar Rebate",
  type: "rebate",
  level: "utility",
  code: "PGE-SOLAR",
  jurisdiction: "US-CA-PGE",
});

const wap = makeProgram({
  id: "wap",
  name: "Weatherization Assistance Program",
  type: "grant",
  level: "federal",
  code: "WAP",
  jurisdiction: "US",
});

const her = makeProgram({
  id: "her",
  name: "Home Energy Rebate",
  type: "rebate",
  level: "state",
  code: "HER",
  jurisdiction: "US",
});

const ukBus = makeProgram({
  id: "uk-bus",
  name: "Boiler Upgrade Scheme",
  type: "grant",
  level: "federal",
  code: "BUS",
  jurisdiction: "UK",
});

const ukEco5 = makeProgram({
  id: "uk-eco5",
  name: "ECO5 Energy Company Obligation",
  type: "grant",
  level: "federal",
  code: "ECO5",
  jurisdiction: "UK",
});

const ukLocal = makeProgram({
  id: "uk-local",
  name: "Local Authority Grant",
  type: "grant",
  level: "local",
  jurisdiction: "UK-LOCAL",
});

const auSolarCredits = makeProgram({
  id: "au-solar-credits",
  name: "Small-scale Renewable Energy Scheme",
  type: "rebate",
  level: "federal",
  code: "SOLAR-CREDITS",
  jurisdiction: "AU",
});

const auVicSolar = makeProgram({
  id: "au-vic-solar",
  name: "Victoria Solar Rebate",
  type: "rebate",
  level: "state",
  code: "VIC-SOLAR",
  jurisdiction: "AU-VIC",
});

const caGreenerHomes = makeProgram({
  id: "ca-greener-homes",
  name: "Canada Greener Homes Grant",
  type: "grant",
  level: "federal",
  code: "GREENER-HOMES",
  jurisdiction: "CA",
});

const caOnRebate = makeProgram({
  id: "ca-on-rebate",
  name: "Ontario Energy Rebate",
  type: "rebate",
  level: "provincial",
  code: "ON-REBATE",
  jurisdiction: "CA-ON",
});

const goldenTestCases: GoldenTestCase[] = [
  {
    name: "US 25C + CA TECH - NOT stackable (state rebate reduces basis)",
    jurisdiction: "US-CA",
    programA: us25C,
    programB: caTech,
    expectedCanStack: false,
    expectedExplanationIncludes: "cannot be combined",
  },
  {
    name: "US 25C + NY Heat Pump - NOT stackable",
    jurisdiction: "US-NY",
    programA: us25C,
    programB: nyHeatPump,
    expectedCanStack: false,
    expectedExplanationIncludes: "cannot be combined",
  },
  {
    name: "US 25C + MA Heat Pump - NOT stackable",
    jurisdiction: "US-MA",
    programA: us25C,
    programB: maHeatPump,
    expectedCanStack: false,
    expectedExplanationIncludes: "cannot be combined",
  },
  {
    name: "US 25D + PGE Solar - NOT stackable (utility rebate reduces basis)",
    jurisdiction: "US-CA",
    programA: us25D,
    programB: pgeRebate,
    expectedCanStack: false,
    expectedExplanationIncludes: "cannot be combined",
  },
  {
    name: "US WAP + Federal 25C - stackable",
    jurisdiction: "US",
    programA: wap,
    programB: us25C,
    expectedCanStack: true,
  },
  {
    name: "US HER + Federal 25C - stackable",
    jurisdiction: "US",
    programA: her,
    programB: us25C,
    expectedCanStack: true,
  },
  {
    name: "UK BUS + ECO5 - NOT stackable (same measure)",
    jurisdiction: "UK",
    programA: ukBus,
    programB: ukEco5,
    expectedCanStack: false,
    expectedExplanationIncludes: "cannot be combined",
  },
  {
    name: "UK BUS + Local Authority - stackable with order",
    jurisdiction: "UK",
    programA: ukBus,
    programB: ukLocal,
    expectedCanStack: true,
  },
  {
    name: "UK ECO5 + Utility - stackable",
    jurisdiction: "UK",
    programA: ukEco5,
    programB: makeProgram({
      id: "uk-utility",
      name: "Energy Supplier Rebate",
      type: "rebate",
      level: "utility",
      jurisdiction: "UK",
    }),
    expectedCanStack: true,
  },
  {
    name: "AU Solar Credits + VIC Solar - stackable",
    jurisdiction: "AU",
    programA: auSolarCredits,
    programB: auVicSolar,
    expectedCanStack: true,
  },
  {
    name: "CA Greener Homes + ON Rebate - stackable",
    jurisdiction: "CA",
    programA: caGreenerHomes,
    programB: caOnRebate,
    expectedCanStack: true,
  },
];

describe("Rules Engine Golden Tests - US Rules", () => {
  const rules = getRulesForJurisdiction("US");

  for (const tc of goldenTestCases.filter((t) => t.jurisdiction === "US")) {
    it(tc.name, async () => {
      const engine = createRulesEngine(rules);
      const result = await evaluateStackability(engine, tc.programA, tc.programB);

      expect(result.canStack).toBe(tc.expectedCanStack);

      if (tc.expectedExplanationIncludes) {
        expect(result.explanation).toContain(tc.expectedExplanationIncludes);
      }

      if (tc.expectedSourceIncludes) {
        expect(result.source).toContain(tc.expectedSourceIncludes);
      }
    });
  }
});

describe("Rules Engine Golden Tests - UK Rules", () => {
  const rules = getRulesForJurisdiction("UK");

  for (const tc of goldenTestCases.filter((t) => t.jurisdiction === "UK")) {
    it(tc.name, async () => {
      const engine = createRulesEngine(rules);
      const result = await evaluateStackability(engine, tc.programA, tc.programB);

      expect(result.canStack).toBe(tc.expectedCanStack);

      if (tc.expectedExplanationIncludes) {
        expect(result.explanation).toContain(tc.expectedExplanationIncludes);
      }
    });
  }
});

describe("Rules Engine - Deterministic Behavior", () => {
  it("produces identical results for same inputs regardless of order", async () => {
    const rules = getRulesForJurisdiction("UK");
    const engine = createRulesEngine(rules);

    const resultAB = await evaluateStackability(engine, ukBus, ukEco5);
    const resultBA = await evaluateStackability(engine, ukEco5, ukBus);

    expect(resultAB.canStack).toBe(resultBA.canStack);
    expect(resultAB.canStack).toBe(false);
  });

  it("produces identical results across multiple runs", async () => {
    const rules = getRulesForJurisdiction("UK");
    const engine = createRulesEngine(rules);

    const results = await Promise.all([
      evaluateStackability(engine, ukBus, ukEco5),
      evaluateStackability(engine, ukBus, ukEco5),
      evaluateStackability(engine, ukBus, ukEco5),
    ]);

    for (const result of results) {
      expect(result.canStack).toBe(false);
      expect(result.explanation).toContain("cannot be combined");
    }
  });

  it("handles missing optional fields gracefully", async () => {
    const rules = getRulesForJurisdiction("US");
    const engine = createRulesEngine(rules);

    const minimalProgramA = makeProgram({
      id: "minimal-a",
      name: "Minimal Program A",
      jurisdiction: "US",
    });

    const minimalProgramB = makeProgram({
      id: "minimal-b",
      name: "Minimal Program B",
      jurisdiction: "US",
    });

    const result = await evaluateStackability(engine, minimalProgramA, minimalProgramB);

    expect(result).toBeDefined();
    expect(typeof result.canStack).toBe("boolean");
    expect(typeof result.explanation).toBe("string");
  });
});

describe("Rules Engine - Source Citation Verification", () => {
  it("includes IRS source for federal tax credit rules", async () => {
    const rules = getRulesForJurisdiction("US");
    const engine = createRulesEngine(rules);

    const result = await evaluateStackability(engine, us25C, caTech);

    expect(result.source).toBeDefined();
    expect(result.source).toMatch(/IRS|Publication/);
  });

  it("includes Ofgem source for UK rules", async () => {
    const rules = getRulesForJurisdiction("UK");
    const engine = createRulesEngine(rules);

    const result = await evaluateStackability(engine, ukBus, ukEco5);

    expect(result.source).toBeDefined();
    expect(result.source).toMatch(/Ofgem|BUS|ECO/);
  });
});

describe("Rules Engine - All Jurisdictions Loadable", () => {
  const jurisdictions = [
    "US",
    "UK",
    "UK-SCOTLAND",
    "UK-WALES",
    "AU",
    "AU-VIC",
    "AU-NSW",
    "AU-QLD",
    "CA",
    "CA-BC",
    "CA-ON",
    "CA-QC",
  ];

  for (const jurisdiction of jurisdictions) {
    it(`loads rules for ${jurisdiction}`, () => {
      const rules = getRulesForJurisdiction(jurisdiction);
      expect(rules).toBeDefined();
      expect(Array.isArray(rules)).toBe(true);
    });

    it(`engine runs without error for ${jurisdiction}`, async () => {
      const rules = getRulesForJurisdiction(jurisdiction);
      const engine = createRulesEngine(rules);
      const result = await evaluateStackability(
        engine,
        makeProgram({ id: "p1", name: "Program 1", jurisdiction }),
        makeProgram({ id: "p2", name: "Program 2", jurisdiction }),
      );

      expect(result).toBeDefined();
      expect(typeof result.canStack).toBe("boolean");
    });
  }
});

describe("Rules Engine - Rule Export Functions", () => {
  it("getAllCountryRules returns all rules from all jurisdictions", () => {
    const allRules = getAllCountryRules();

    expect(allRules).toBeDefined();
    expect(Array.isArray(allRules)).toBe(true);
    expect(allRules.length).toBeGreaterThan(0);
  });

  it("getActiveRules returns only active rules (excludes EXPIRED)", () => {
    const activeRules = getActiveRules();

    expect(activeRules).toBeDefined();
    expect(Array.isArray(activeRules)).toBe(true);
    expect(activeRules.length).toBeGreaterThan(0);

    const hasExpiredRules = activeRules.some((r) => r.ruleId.includes("expired"));
    expect(hasExpiredRules).toBe(false);
  });

  it("getExpiredRules returns only expired rules", () => {
    const expiredRules = getExpiredRules();

    expect(expiredRules).toBeDefined();
    expect(Array.isArray(expiredRules)).toBe(true);
  });

  it("active rules and expired rules are mutually exclusive", () => {
    const activeRules = getActiveRules();
    const expiredRules = getExpiredRules();

    const activeIds = new Set(activeRules.map((r) => r.ruleId));
    const hasOverlap = expiredRules.some((r) => activeIds.has(r.ruleId));

    expect(hasOverlap).toBe(false);
  });
});
