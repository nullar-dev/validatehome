import { describe, expect, it } from "vitest";
import { calculateNetCost } from "../calculate.js";
import type { EligibleProgram } from "../types.js";

const makeProgram = (overrides: Partial<EligibleProgram>): EligibleProgram => ({
  id: "test-1",
  name: "Test Program",
  benefitType: "rebate",
  maxAmount: null,
  percentage: null,
  perUnitAmount: null,
  incomeCap: null,
  currency: "USD",
  level: "federal",
  jurisdiction: "US",
  ...overrides,
});

describe("calculateNetCost", () => {
  it("returns zero savings when no programs provided", () => {
    const result = calculateNetCost(12000, []);
    expect(result.netCost).toBe(12000);
    expect(result.totalSavings).toBe(0);
    expect(result.savingsPct).toBe(0);
    expect(result.incentivesApplied).toHaveLength(0);
  });

  it("returns zero savings for zero sticker price", () => {
    const programs = [makeProgram({ maxAmount: 2000 })];
    const result = calculateNetCost(0, programs);
    expect(result.netCost).toBe(0);
    expect(result.totalSavings).toBe(0);
  });

  it("applies a fixed rebate", () => {
    const programs = [makeProgram({ maxAmount: 3000 })];
    const result = calculateNetCost(12000, programs);
    expect(result.netCost).toBe(9000);
    expect(result.totalSavings).toBe(3000);
    expect(result.savingsPct).toBe(25);
    expect(result.incentivesApplied).toHaveLength(1);
  });

  it("applies a percentage-based tax credit with cap", () => {
    const programs = [
      makeProgram({
        benefitType: "tax_credit",
        percentage: 30,
        maxAmount: 2000,
      }),
    ];
    const result = calculateNetCost(12000, programs);
    expect(result.netCost).toBe(10000);
    expect(result.totalSavings).toBe(2000);
    expect(result.incentivesApplied[0]?.type).toBe("tax_credit");
  });

  it("applies percentage without cap", () => {
    const programs = [
      makeProgram({
        benefitType: "tax_credit",
        percentage: 30,
      }),
    ];
    const result = calculateNetCost(10000, programs);
    expect(result.netCost).toBe(7000);
    expect(result.totalSavings).toBe(3000);
  });

  it("stacks multiple programs correctly", () => {
    const programs = [
      makeProgram({
        id: "federal",
        name: "Federal Tax Credit",
        benefitType: "tax_credit",
        percentage: 30,
        maxAmount: 2000,
      }),
      makeProgram({
        id: "state",
        name: "State Rebate",
        benefitType: "rebate",
        maxAmount: 3000,
        level: "state",
      }),
      makeProgram({
        id: "utility",
        name: "Utility Rebate",
        benefitType: "rebate",
        maxAmount: 2800,
        level: "utility",
      }),
    ];
    const result = calculateNetCost(12000, programs);
    // Sorted by impact: State $3000, Utility $2800, Federal 30% of remaining $6200 = $1860
    expect(result.netCost).toBe(4340);
    expect(result.totalSavings).toBe(7660);
    expect(result.savingsPct).toBe(64);
    expect(result.incentivesApplied).toHaveLength(3);
  });

  it("never produces negative net cost", () => {
    const programs = [
      makeProgram({ maxAmount: 15000 }),
      makeProgram({ id: "2", maxAmount: 10000 }),
    ];
    const result = calculateNetCost(12000, programs);
    expect(result.netCost).toBe(0);
    expect(result.totalSavings).toBe(12000);
    expect(result.savingsPct).toBe(100);
  });

  it("includes tax credit disclaimer when applicable", () => {
    const programs = [makeProgram({ benefitType: "tax_credit", percentage: 30 })];
    const result = calculateNetCost(10000, programs);
    expect(result.disclaimers.some((d) => d.includes("tax liability"))).toBe(true);
  });

  it("handles multi-currency (GBP)", () => {
    const programs = [makeProgram({ maxAmount: 5000, currency: "GBP" })];
    const result = calculateNetCost(7500, programs);
    expect(result.currency).toBe("GBP");
    expect(result.netCost).toBe(2500);
  });

  it("handles per-unit amount", () => {
    const programs = [makeProgram({ perUnitAmount: 1500 })];
    const result = calculateNetCost(10000, programs);
    expect(result.netCost).toBe(8500);
    expect(result.totalSavings).toBe(1500);
  });

  it("preserves stacking notes from input", () => {
    const programs = [makeProgram({ maxAmount: 1000 })];
    const notes = ["Federal credit applied first per IRS rules"];
    const result = calculateNetCost(5000, programs, notes);
    expect(result.stackingNotes).toContain("Federal credit applied first per IRS rules");
  });
});
