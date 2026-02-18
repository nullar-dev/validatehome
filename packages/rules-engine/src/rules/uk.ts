import type { StackingRule } from "../types.js";

export const ukRules: StackingRule[] = [
  {
    ruleId: "uk-eco5-bus-not-stackable",
    jurisdiction: "UK",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "ECO5" },
        { fact: "program_b.code", operator: "equal", value: "BUS" },
      ],
    },
    event: {
      type: "not_stackable",
      params: {
        explanation:
          "ECO5 (Energy Company Obligation 2026+) and Boiler Upgrade Scheme (BUS) cannot be combined for the same measure. Choose one per heating system.",
        source: "Ofgem ECO5 Guidance (2026)",
      },
    },
  },
  {
    ruleId: "uk-bus-eco5-not-stackable-same-measure",
    jurisdiction: "UK",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "BUS" },
        { fact: "program_b.code", operator: "equal", value: "ECO5" },
      ],
    },
    event: {
      type: "not_stackable",
      params: {
        explanation:
          "Boiler Upgrade Scheme (BUS) and ECO5 cannot be combined for the same measure. BUS provides upfront grant, ECO5 provides bill savings. Choose one per heating system.",
        source: "Ofgem BUS + ECO5 Guidance (2026)",
      },
    },
  },
  {
    ruleId: "uk-bus-insulation-not-stackable",
    jurisdiction: "UK",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "BUS" },
        { fact: "program_b.category", operator: "equal", value: "insulation" },
      ],
    },
    event: {
      type: "not_stackable",
      params: {
        explanation:
          "Boiler Upgrade Scheme (BUS) is only for heat pumps and biomass boilers, not insulation. Insulation measures are covered by other schemes.",
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
    ruleId: "uk-eco5-flexible-not-stack-with-bus",
    jurisdiction: "UK",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "ECO5-FLEX" },
        { fact: "program_b.code", operator: "equal", value: "BUS" },
      ],
    },
    event: {
      type: "not_stackable",
      params: {
        explanation:
          "ECO5 Flexible eligibility cannot be combined with BUS for the same measure. They serve different household types.",
        source: "Ofgem ECO5 Guidance (2026)",
      },
    },
  },
  {
    ruleId: "uk-eco5-utility-can-stack",
    jurisdiction: "UK",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "ECO5" },
        { fact: "program_b.level", operator: "equal", value: "utility" },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "ECO5 can be combined with energy supplier rebates. ECO5 provides the main measure, suppliers may add top-ups.",
        order: ["program_a", "program_b"],
        source: "Ofgem ECO5 + Supplier Guidance (2026)",
      },
    },
  },
  {
    ruleId: "uk-bus-cannot-replace-new-build",
    jurisdiction: "UK",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "BUS" },
        { fact: "program_a.isNewBuild", operator: "equal", value: true },
      ],
    },
    event: {
      type: "conditional",
      params: {
        explanation:
          "BUS only covers replacement of existing fossil fuel boilers (or broken boilers). New build or first-time central heating has different eligibility.",
        source: "Ofgem BUS Eligibility Criteria 2026",
      },
    },
  },
  {
    ruleId: "uk-home-upgrade-scheme-bus-not-stackable",
    jurisdiction: "UK",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "HUS" },
        { fact: "program_b.code", operator: "equal", value: "BUS" },
      ],
    },
    event: {
      type: "not_stackable",
      params: {
        explanation:
          "Home Upgrade Scheme (HUS) and BUS cannot be combined for the same measure. HUS targets off-gas homes, BUS is for boiler replacement.",
        source: "Ofgem Home Upgrade Scheme Guidance",
      },
    },
  },
  {
    ruleId: "uk-scotland-nest-eligibility",
    jurisdiction: "UK-SCOTLAND",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "NEST" },
        { fact: "program_b.level", operator: "equal", value: "federal" },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "Nest (Scotland) can work alongside UK-wide schemes. However, eligibility must be checked separately for each program.",
        source: "Energy Saving Trust Scotland",
      },
    },
  },
  {
    ruleId: "uk-wales-nest-wales-rules",
    jurisdiction: "UK-WALES",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "NEST-WALES" },
        { fact: "program_b.code", operator: "equal", value: "BUS" },
      ],
    },
    event: {
      type: "not_stackable",
      params: {
        explanation:
          "Nest Wales and Boiler Upgrade Scheme cannot be combined for the same measure. Each has separate eligibility criteria.",
        source: "Nest Wales + Ofgem",
      },
    },
  },
  {
    ruleId: "uk-energy-company-obligation-eco5",
    jurisdiction: "UK",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "ECO5" },
        { fact: "program_b.level", operator: "equal", value: "utility" },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "ECO5 can be combined with energy supplier rebates. ECO5 provides the main measure, suppliers may add top-ups.",
        order: ["program_a", "program_b"],
        source: "Ofgem ECO5 + Supplier Guidance (2026)",
      },
    },
  },
];

export const ukExpiredRules: StackingRule[] = [
  {
    ruleId: "uk-eco4-expired",
    jurisdiction: "UK",
    conditions: {
      all: [{ fact: "program_a.code", operator: "equal", value: "ECO4" }],
    },
    event: {
      type: "conditional",
      params: {
        explanation:
          "ECO4 ended on 31 March 2026. Replaced by ECO5. Check ECO5 for current heating and insulation measures.",
        source: "Ofgem ECO4 Archive",
      },
    },
  },
  {
    ruleId: "uk-gbis-expired",
    jurisdiction: "UK",
    conditions: {
      all: [{ fact: "program_a.code", operator: "equal", value: "GBIS" }],
    },
    event: {
      type: "conditional",
      params: {
        explanation:
          "Great British Insulation Scheme (GBIS) ended in 2026. Replaced by ECO5 and local authority schemes.",
        source: "Ofgem GBIS Archive",
      },
    },
  },
];
