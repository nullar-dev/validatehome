import { describe, expect, it } from "vitest";
import { applyCountryTaxRules, calculateNetCost, getCountryTaxConfig } from "../calculate.js";
import type { EligibleProgram } from "../types.js";

const makeProgram = (overrides: Partial<EligibleProgram>): EligibleProgram => ({
  id: "test-1",
  name: "Test Program",
  benefitType: "rebate",
  maxAmount: null,
  percentage: null,
  perUnitAmount: null,
  incomeCap: null,
  incomePhaseoutStart: null,
  lifetimeLimit: null,
  annualLimit: null,
  currency: "USD",
  level: "federal",
  jurisdiction: "US",
  isRefundable: false,
  vatExempt: false,
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

describe("income cap calculations", () => {
  it("applies full amount when below income cap", () => {
    const programs = [
      makeProgram({
        benefitType: "rebate",
        maxAmount: 2000,
        incomeCap: 150000,
        incomePhaseoutStart: 150000,
      }),
    ];
    const result = calculateNetCost(10000, programs, [], 100000);
    expect(result.incentivesApplied[0]?.amount).toBe(2000);
    expect(result.incentivesApplied[0]?.hitsIncomeCap).toBe(false);
  });

  it("reduces amount when above income cap with phaseout", () => {
    const programs = [
      makeProgram({
        benefitType: "rebate",
        maxAmount: 2000,
        incomeCap: 150000,
        incomePhaseoutStart: 150000,
      }),
    ];
    const result = calculateNetCost(10000, programs, [], 200000);
    expect(result.incentivesApplied[0]?.amount).toBeLessThan(2000);
    expect(result.incentivesApplied[0]?.hitsIncomeCap).toBe(true);
  });

  it("excludes program when income significantly exceeds cap", () => {
    const programs = [
      makeProgram({
        benefitType: "rebate",
        maxAmount: 2000,
        incomeCap: 150000,
        incomePhaseoutStart: 150000,
      }),
    ];
    const result = calculateNetCost(10000, programs, [], 500000);
    expect(result.incentivesApplied).toHaveLength(0);
  });
});

describe("lifetime and annual limits", () => {
  it("applies full amount when under lifetime limit", () => {
    const programs = [
      makeProgram({
        benefitType: "rebate",
        maxAmount: 10000,
        lifetimeLimit: 5000,
      }),
    ];
    const usedAmounts = { "test-1": { annualUsed: 0, lifetimeUsed: 3000 } };
    const result = calculateNetCost(
      10000,
      programs,
      [],
      undefined,
      undefined,
      "US",
      undefined,
      usedAmounts,
    );
    expect(result.incentivesApplied[0]?.amount).toBe(2000);
  });

  it("restricts amount when approaching lifetime limit", () => {
    const programs = [
      makeProgram({
        benefitType: "rebate",
        maxAmount: 10000,
        lifetimeLimit: 5000,
      }),
    ];
    const usedAmounts = { "test-1": { annualUsed: 0, lifetimeUsed: 4000 } };
    const result = calculateNetCost(
      10000,
      programs,
      [],
      undefined,
      undefined,
      "US",
      undefined,
      usedAmounts,
    );
    expect(result.incentivesApplied[0]?.amount).toBe(1000);
  });
});

describe("tax credit nuance - non-refundable vs refundable", () => {
  it("calculates tax impact for refundable tax credit", () => {
    const programs = [
      makeProgram({
        benefitType: "tax_credit",
        maxAmount: 3000,
        isRefundable: true,
      }),
    ];
    const result = calculateNetCost(10000, programs, [], 100000, 2000);
    expect(result.taxImpact.totalTaxSavings).toBe(2000);
    expect(result.taxImpact.nonRefundableWarning).toBe(false);
  });

  it("shows non-refundable warning when credit exceeds tax liability", () => {
    const programs = [
      makeProgram({
        benefitType: "tax_credit",
        maxAmount: 5000,
        isRefundable: false,
      }),
    ];
    const result = calculateNetCost(10000, programs, [], 100000, 1500);
    expect(result.taxImpact.totalTaxSavings).toBe(1500);
    expect(result.taxImpact.nonRefundableWarning).toBe(true);
    expect(result.taxImpact.nonRefundableAmount).toBeGreaterThan(0);
    expect(result.disclaimers.some((d) => d.includes("non-refundable"))).toBe(true);
  });

  it("includes tax impact in effective savings", () => {
    const programs = [
      makeProgram({
        benefitType: "tax_credit",
        percentage: 30,
        isRefundable: false,
      }),
    ];
    const result = calculateNetCost(10000, programs, [], 100000, 5000);
    expect(result.effectiveSavings).toBeLessThanOrEqual(result.totalSavings);
  });
});

describe("country tax nuances", () => {
  it("includes country in output", () => {
    const programs = [makeProgram({ currency: "GBP", jurisdiction: "UK" })];
    const result = calculateNetCost(5000, programs, [], undefined, undefined, "UK");
    expect(result.country).toBe("UK");
  });

  it("applies UK currency", () => {
    const programs = [
      makeProgram({
        benefitType: "grant",
        maxAmount: 7500,
        currency: "GBP",
        jurisdiction: "UK",
        vatExempt: false,
      }),
    ];
    const result = calculateNetCost(10000, programs, [], undefined, undefined, "UK");
    expect(result.currency).toBe("GBP");
  });

  it("applies AU currency", () => {
    const programs = [
      makeProgram({
        benefitType: "rebate",
        maxAmount: 1000,
        currency: "AUD",
        jurisdiction: "AU",
        vatExempt: false,
      }),
    ];
    const result = calculateNetCost(5000, programs, [], undefined, undefined, "AU");
    expect(result.currency).toBe("AUD");
  });

  it("applies CA currency", () => {
    const programs = [
      makeProgram({
        benefitType: "rebate",
        maxAmount: 3000,
        currency: "CAD",
        jurisdiction: "CA-ON",
        vatExempt: false,
      }),
    ];
    const result = calculateNetCost(10000, programs, [], undefined, undefined, "CA");
    expect(result.currency).toBe("CAD");
  });
});

describe("golden scenarios - heat pumps", () => {
  it("US heat pump with 25C credit + state rebate includes tax impact", () => {
    const programs = [
      makeProgram({
        id: "us-25c",
        name: "IRS 25C Heat Pump Tax Credit",
        benefitType: "tax_credit",
        maxAmount: 2000,
        isRefundable: false,
        level: "federal",
        jurisdiction: "US",
      }),
      makeProgram({
        id: "ca-tech",
        name: "California TECH Rebate",
        benefitType: "rebate",
        maxAmount: 7500,
        level: "state",
        jurisdiction: "US-CA",
      }),
    ];
    const result = calculateNetCost(15000, programs, [], 120000, 15000);
    expect(result.stickerPrice).toBe(15000);
    expect(result.incentivesApplied).toHaveLength(2);
    expect(result.taxImpact.totalTaxSavings).toBeGreaterThan(0);
  });
});

describe("golden scenarios - solar", () => {
  it("US solar with 25D tax credit calculates savings", () => {
    const programs = [
      makeProgram({
        id: "us-25d",
        name: "IRS 25D Solar Tax Credit",
        benefitType: "tax_credit",
        percentage: 30,
        isRefundable: false,
        level: "federal",
        jurisdiction: "US",
      }),
    ];
    const result = calculateNetCost(25000, programs, [], 100000, 12000);
    expect(result.stickerPrice).toBe(25000);
    expect(result.totalSavings).toBe(7500);
  });
});

describe("equipment validation helpers", () => {
  it("handles grant benefit type in explanation", () => {
    const programs = [
      makeProgram({
        benefitType: "grant",
        maxAmount: 5000,
      }),
    ];
    const result = calculateNetCost(10000, programs);
    expect(result.incentivesApplied[0]?.explanation).toContain("grant");
  });

  it("handles loan benefit type in explanation", () => {
    const programs = [
      makeProgram({
        benefitType: "loan",
        maxAmount: 10000,
      }),
    ];
    const result = calculateNetCost(15000, programs);
    expect(result.incentivesApplied[0]?.explanation).toContain("loan");
  });

  it("handles per-unit amount explanation", () => {
    const programs = [
      makeProgram({
        benefitType: "rebate",
        perUnitAmount: 500,
      }),
    ];
    const result = calculateNetCost(1000, programs);
    expect(result.incentivesApplied[0]?.explanation).toContain("Per-unit amount");
  });
});

describe("country tax configuration", () => {
  it("returns correct tax config for US", () => {
    const config = getCountryTaxConfig("US");
    expect(config.vatRate).toBe(0);
    expect(config.gstRate).toBe(0);
  });

  it("returns correct tax config for UK", () => {
    const config = getCountryTaxConfig("UK");
    expect(config.vatRate).toBe(0.2);
  });

  it("returns correct tax config for AU", () => {
    const config = getCountryTaxConfig("AU");
    expect(config.gstRate).toBe(0.1);
  });

  it("returns correct tax config for CA with provincial rates", () => {
    const config = getCountryTaxConfig("CA");
    expect(config.gstRate).toBe(0.05);
    expect(config.provincialTaxRates.ON).toBe(0.08);
    expect(config.provincialTaxRates.BC).toBe(0.07);
  });

  it("applies VAT to UK grant amounts", () => {
    const amount = applyCountryTaxRules(1000, "UK", false);
    expect(amount).toBe(1200);
  });

  it("does not apply VAT when vatExempt is true", () => {
    const amount = applyCountryTaxRules(1000, "UK", true);
    expect(amount).toBe(1000);
  });

  it("applies GST to AU amounts", () => {
    const amount = applyCountryTaxRules(1000, "AU", false);
    expect(amount).toBe(1100);
  });

  it("applies GST to CA amounts", () => {
    const amount = applyCountryTaxRules(1000, "CA", false);
    expect(amount).toBe(1050);
  });
});

describe("annual limit handling", () => {
  it("restricts amount when approaching annual limit", () => {
    const programs = [
      makeProgram({
        benefitType: "rebate",
        maxAmount: 5000,
        annualLimit: 2000,
      }),
    ];
    const usedAmounts = { "test-1": { annualUsed: 1500, lifetimeUsed: 1500 } };
    const result = calculateNetCost(
      10000,
      programs,
      [],
      undefined,
      undefined,
      "US",
      undefined,
      usedAmounts,
    );
    expect(result.incentivesApplied[0]?.amount).toBe(500);
  });

  it("excludes program when annual limit fully exhausted", () => {
    const programs = [
      makeProgram({
        benefitType: "rebate",
        maxAmount: 5000,
        annualLimit: 2000,
      }),
    ];
    const usedAmounts = { "test-1": { annualUsed: 2000, lifetimeUsed: 2000 } };
    const result = calculateNetCost(
      10000,
      programs,
      [],
      undefined,
      undefined,
      "US",
      undefined,
      usedAmounts,
    );
    expect(result.incentivesApplied).toHaveLength(0);
  });
});

describe("calculator input object overload", () => {
  it("accepts CalculatorInput object directly", () => {
    const input = {
      stickerPrice: 10000,
      programs: [makeProgram({ maxAmount: 2000 })],
      country: "UK" as const,
    };
    const result = calculateNetCost(input);
    expect(result.stickerPrice).toBe(10000);
    expect(result.netCost).toBe(8000);
    expect(result.country).toBe("UK");
  });
});
