import type { StackingRule } from "../types.js";

export const ukRules: StackingRule[] = [
  {
    ruleId: "uk-bus-eco4-not-stackable-same-measure",
    jurisdiction: "UK",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "BUS" },
        { fact: "program_b.code", operator: "equal", value: "ECO4" },
      ],
    },
    event: {
      type: "not_stackable",
      params: {
        explanation:
          "Boiler Upgrade Scheme (BUS) and ECO4 cannot be combined for the same measure. BUS provides upfront grant, ECO4 provides bill savings. Choose one per heating system.",
        source: "Ofgem BUS Guidance + ECO4 Terms",
      },
    },
  },
  {
    ruleId: "uk-bus-insulation-not-stackable",
    jurisdiction: "UK",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "BUS" },
        { fact: "program_b.code", operator: "equal", value: "GBIS" },
      ],
    },
    event: {
      type: "not_stackable",
      params: {
        explanation:
          "Boiler Upgrade Scheme (BUS) is only for heat pumps and biomass boilers, not insulation. GBIS covers insulation separately.",
        source: "Ofgem BUS Guidance",
      },
    },
  },
  {
    ruleId: "uk-bus-apply-first",
    jurisdiction: "UK",
    conditions: {
      any: [
        {
          all: [
            { fact: "program_a.code", operator: "equal", value: "BUS" },
            { fact: "program_b.level", operator: "equal", value: "local" },
          ],
        },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "BUS can be combined with local authority grants, but BUS should be applied first as it's an upfront voucher.",
        order: ["program_a", "program_b"],
        source: "Ofgem BUS + Local Authority Guidance",
      },
    },
  },
  {
    ruleId: "uk-eco4-flexible-not-stack-with-bus",
    jurisdiction: "UK",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "ECO4-FLEX" },
        { fact: "program_b.code", operator: "equal", value: "BUS" },
      ],
    },
    event: {
      type: "not_stackable",
      params: {
        explanation:
          "ECO4 Flexible eligibility cannot be combined with BUS for the same measure. They serve different household types.",
        source: "Ofgem ECO4 Guidance",
      },
    },
  },
  {
    ruleId: "uk-great-british-insulation-standalone",
    jurisdiction: "UK",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "GBIS" },
        { fact: "program_b.code", operator: "in", value: ["BUS", "ECO4", "ECO4-FLEX"] },
      ],
    },
    event: {
      type: "not_stackable",
      params: {
        explanation:
          "Great British Insulation Scheme (GBIS) is for insulation only and cannot combine with BUS or ECO4 for the same insulation measure.",
        source: "Ofgem GBIS Guidance",
      },
    },
  },
  {
    ruleId: "uk-energy-company-obligation-eco4",
    jurisdiction: "UK",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "ECO4" },
        { fact: "program_b.level", operator: "equal", value: "utility" },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "ECO4 can be combined with energy supplier rebates. ECO4 provides the main measure, suppliers may add top-ups.",
        order: ["program_a", "program_b"],
        source: "Ofgem ECO4 + Supplier Guidance",
      },
    },
  },
  {
    ruleId: "uk-bus-cannot-replace-existing-boiler",
    jurisdiction: "UK",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "BUS" },
        { fact: "program_a.replacesExisting", operator: "equal", value: true },
      ],
    },
    event: {
      type: "conditional",
      params: {
        explanation:
          "BUS only covers replacement of existing fossil fuel boilers (or broken boilers). New build or first-time central heating has different eligibility.",
        source: "Ofgem BUS Eligibility Criteria",
      },
    },
  },
];
