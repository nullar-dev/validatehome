import { describe, expect, it } from "vitest";
import { createRulesEngine, evaluateStackability } from "../engine.js";
import type { ProgramFact, StackingRule } from "../types.js";

const federalTaxCredit: ProgramFact = {
  id: "federal-25c",
  name: "IRS 25C Tax Credit",
  type: "tax_credit",
  level: "federal",
  code: "25C",
  jurisdiction: "US",
};

const stateRebate: ProgramFact = {
  id: "ca-tech",
  name: "CA TECH Clean Energy",
  type: "rebate",
  level: "state",
  code: "TECH",
  jurisdiction: "US-CA",
};

const utilityRebate: ProgramFact = {
  id: "pge-rebate",
  name: "PG&E Heat Pump Rebate",
  type: "rebate",
  level: "utility",
  jurisdiction: "US-CA-PGE",
};

describe("createRulesEngine", () => {
  it("creates an engine with no rules", () => {
    const engine = createRulesEngine([]);
    expect(engine).toBeDefined();
  });

  it("creates an engine with rules", () => {
    const rules: StackingRule[] = [
      {
        ruleId: "test-rule",
        jurisdiction: "US",
        conditions: {
          all: [{ fact: "program_a.type", operator: "equal", value: "tax_credit" }],
        },
        event: {
          type: "stackable",
          params: { explanation: "Test rule" },
        },
      },
    ];
    const engine = createRulesEngine(rules);
    expect(engine).toBeDefined();
  });
});

describe("evaluateStackability", () => {
  it("returns stackable when no rules are defined", async () => {
    const engine = createRulesEngine([]);
    const result = await evaluateStackability(engine, federalTaxCredit, stateRebate);

    expect(result.canStack).toBe(true);
    expect(result.explanation).toBe("No stacking restrictions found. Programs can be combined.");
  });

  it("returns not_stackable when rule blocks combination", async () => {
    const rules: StackingRule[] = [
      {
        ruleId: "block-same-level",
        jurisdiction: "US",
        conditions: {
          all: [
            { fact: "program_a.level", operator: "equal", value: "state" },
            { fact: "program_b.level", operator: "equal", value: "state" },
          ],
        },
        event: {
          type: "not_stackable",
          params: {
            explanation: "Cannot combine two state-level rebates for the same measure.",
          },
        },
      },
    ];
    const engine = createRulesEngine(rules);

    const stateRebateB: ProgramFact = {
      id: "ny-clean-heat",
      name: "NY Clean Heat",
      type: "rebate",
      level: "state",
      jurisdiction: "US-NY",
    };

    const result = await evaluateStackability(engine, stateRebate, stateRebateB);

    expect(result.canStack).toBe(false);
    expect(result.explanation).toBe("Cannot combine two state-level rebates for the same measure.");
  });

  it("returns stackable with order when rule specifies application order", async () => {
    const rules: StackingRule[] = [
      {
        ruleId: "federal-first",
        jurisdiction: "US",
        conditions: {
          all: [
            { fact: "program_a.type", operator: "equal", value: "tax_credit" },
            { fact: "program_a.level", operator: "equal", value: "federal" },
            { fact: "program_b.level", operator: "equal", value: "state" },
          ],
        },
        event: {
          type: "stackable",
          params: {
            explanation: "Federal tax credit applied first, then state rebate on remaining cost.",
            order: ["program_a", "program_b"],
          },
        },
      },
    ];
    const engine = createRulesEngine(rules);
    const result = await evaluateStackability(engine, federalTaxCredit, stateRebate);

    expect(result.canStack).toBe(true);
    expect(result.explanation).toBe(
      "Federal tax credit applied first, then state rebate on remaining cost.",
    );
    expect(result.order).toEqual(["program_a", "program_b"]);
  });

  it("returns conditional result with cap", async () => {
    const rules: StackingRule[] = [
      {
        ruleId: "capped-stack",
        jurisdiction: "US",
        conditions: {
          all: [
            { fact: "program_a.level", operator: "equal", value: "federal" },
            { fact: "program_b.level", operator: "equal", value: "utility" },
          ],
        },
        event: {
          type: "stackable",
          params: {
            explanation: "Federal credit and utility rebate can stack, capped at $5,000 combined.",
            cap: 5000,
          },
        },
      },
    ];
    const engine = createRulesEngine(rules);
    const result = await evaluateStackability(engine, federalTaxCredit, utilityRebate);

    expect(result.canStack).toBe(true);
    expect(result.cap).toBe(5000);
    expect(result.explanation).toContain("capped at $5,000");
  });

  it("returns conditional result with reduction percentage", async () => {
    const rules: StackingRule[] = [
      {
        ruleId: "reduced-stack",
        jurisdiction: "UK",
        conditions: {
          all: [
            { fact: "program_a.code", operator: "equal", value: "BUS" },
            { fact: "program_b.code", operator: "equal", value: "ECO4" },
          ],
        },
        event: {
          type: "conditional",
          params: {
            explanation: "BUS and ECO4 can combine but ECO4 amount is reduced by 50%.",
            reductionPct: 50,
          },
        },
      },
    ];
    const engine = createRulesEngine(rules);

    const busProgram: ProgramFact = {
      id: "uk-bus",
      name: "Boiler Upgrade Scheme",
      type: "grant",
      level: "federal",
      code: "BUS",
      jurisdiction: "UK",
    };
    const eco4Program: ProgramFact = {
      id: "uk-eco4",
      name: "ECO4",
      type: "grant",
      level: "federal",
      code: "ECO4",
      jurisdiction: "UK",
    };

    const result = await evaluateStackability(engine, busProgram, eco4Program);

    expect(result.canStack).toBe(false);
    expect(result.reductionPct).toBe(50);
  });

  it("does not match rules when conditions are not met", async () => {
    const rules: StackingRule[] = [
      {
        ruleId: "only-grants",
        jurisdiction: "AU",
        conditions: {
          all: [
            { fact: "program_a.type", operator: "equal", value: "grant" },
            { fact: "program_b.type", operator: "equal", value: "grant" },
          ],
        },
        event: {
          type: "not_stackable",
          params: { explanation: "Cannot combine two grants." },
        },
      },
    ];
    const engine = createRulesEngine(rules);

    const result = await evaluateStackability(engine, federalTaxCredit, stateRebate);

    expect(result.canStack).toBe(true);
    expect(result.explanation).toBe("No stacking restrictions found. Programs can be combined.");
  });

  it("handles rules with any conditions", async () => {
    const rules: StackingRule[] = [
      {
        ruleId: "any-federal",
        jurisdiction: "US",
        conditions: {
          any: [
            { fact: "program_a.level", operator: "equal", value: "federal" },
            { fact: "program_b.level", operator: "equal", value: "federal" },
          ],
        },
        event: {
          type: "stackable",
          params: {
            explanation: "At least one federal program involved, stacking allowed.",
            order: ["program_a", "program_b"],
          },
        },
      },
    ];
    const engine = createRulesEngine(rules);
    const result = await evaluateStackability(engine, federalTaxCredit, stateRebate);

    expect(result.canStack).toBe(true);
    expect(result.order).toEqual(["program_a", "program_b"]);
  });

  it("handles null cap in result", async () => {
    const rules: StackingRule[] = [
      {
        ruleId: "no-cap",
        jurisdiction: "CA",
        conditions: {
          all: [{ fact: "program_a.level", operator: "equal", value: "federal" }],
        },
        event: {
          type: "stackable",
          params: {
            explanation: "No cap on combined benefits.",
            cap: null,
          },
        },
      },
    ];
    const engine = createRulesEngine(rules);
    const result = await evaluateStackability(engine, federalTaxCredit, stateRebate);

    expect(result.canStack).toBe(true);
    expect(result.cap).toBeNull();
  });
});
