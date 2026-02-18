import type { StackingRule } from "../types.js";

export const usFederalRules: StackingRule[] = [
  {
    ruleId: "us-25c-heat-pump-not-stackable-with-some-state",
    jurisdiction: "US",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "25C" },
        { fact: "program_b.level", operator: "equal", value: "state" },
        {
          fact: "program_b.code",
          operator: "in",
          value: ["CA-TECH", "NY-HEAT-PUMP", "MA-HEAT-PUMP"],
        },
      ],
    },
    event: {
      type: "not_stackable",
      params: {
        explanation:
          "IRS 25C tax credit cannot be combined with certain state heat pump rebates in CA, NY, and MA. State rebates reduce basis for federal credit calculation.",
        source: "IRS Publication 5027",
      },
    },
  },
  {
    ruleId: "us-25d-solar-not-stackable-with-utility",
    jurisdiction: "US",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "25D" },
        { fact: "program_b.level", operator: "equal", value: "utility" },
        { fact: "program_b.code", operator: "in", value: ["PGE-SOLAR", "PGW-SOLAR"] },
      ],
    },
    event: {
      type: "not_stackable",
      params: {
        explanation:
          "IRS 25D tax credit cannot be combined with certain utility solar rebates that cover the same equipment. Utility rebates reduce basis for federal credit calculation.",
        source: "IRS Publication 5027",
      },
    },
  },
  {
    ruleId: "us-federal-tax-credit-apply-first",
    jurisdiction: "US",
    conditions: {
      all: [
        { fact: "program_a.level", operator: "equal", value: "federal" },
        { fact: "program_b.level", operator: "in", value: ["state", "utility"] },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "Federal tax credits should be applied first, then state/utility rebates on the remaining cost. Federal credits reduce tax liability, not out-of-pocket cost.",
        order: ["program_a", "program_b"],
        source: "IRS Publication 5027",
      },
    },
  },
  {
    ruleId: "us-state-rebates-reduce-basis",
    jurisdiction: "US",
    conditions: {
      all: [
        { fact: "program_a.level", operator: "equal", value: "federal" },
        { fact: "program_b.level", operator: "in", value: ["state", "utility"] },
      ],
    },
    event: {
      type: "conditional",
      params: {
        explanation:
          "State and utility rebates reduce the basis for federal tax credit calculations. Maximum credit is calculated on post-rebate cost.",
        reductionPct: 100,
        source: "IRS Publication 5027",
      },
    },
  },
  {
    ruleId: "us-two-state-rebates-not-stackable",
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
        explanation:
          "Cannot combine two state-level rebates for the same measure. Only one state rebate per equipment type.",
        source: "General state program rules",
      },
    },
  },
  {
    ruleId: "us-two-utility-rebates-not-stackable",
    jurisdiction: "US",
    conditions: {
      all: [
        { fact: "program_a.level", operator: "equal", value: "utility" },
        { fact: "program_b.level", operator: "equal", value: "utility" },
      ],
    },
    event: {
      type: "not_stackable",
      params: {
        explanation:
          "Cannot combine two utility-level rebates for the same measure. Only one utility rebate per equipment type.",
        source: "General utility program rules",
      },
    },
  },
  {
    ruleId: "us-income-phaseout-enhanced-25c",
    jurisdiction: "US",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "25C" },
        { fact: "program_a.incomeRestricted", operator: "equal", value: true },
      ],
    },
    event: {
      type: "conditional",
      params: {
        explanation:
          "Enhanced 25C credit (up to $2,000 for heat pumps) is reduced for households with AGI above phaseout threshold. Standard credit ($600) remains available.",
        cap: 2000,
        source: "IRS 25C Inflation Adjusted Amounts 2024-2026",
      },
    },
  },
  {
    ruleId: "us-wap-stacks-with-federal-credits",
    jurisdiction: "US",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "WAP" },
        { fact: "program_b.level", operator: "equal", value: "federal" },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "Weatherization Assistance Program (WAP) can be combined with federal tax credits (25C, 25D). WAP covers basic weatherization, tax credits can cover remaining efficiency upgrades.",
        order: ["program_a", "program_b"],
        source: "DOE WAP Program Guidance",
      },
    },
  },
  {
    ruleId: "us-wap-income-eligibility",
    jurisdiction: "US",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "WAP" },
        { fact: "program_a.incomeRestricted", operator: "equal", value: true },
      ],
    },
    event: {
      type: "conditional",
      params: {
        explanation:
          "WAP has strict income eligibility (typically 200% of federal poverty level). Must verify income at application.",
        source: "DOE WAP Eligibility Guidelines",
      },
    },
  },
  {
    ruleId: "us-her-stacks-with-tax-credits",
    jurisdiction: "US",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "HER" },
        { fact: "program_b.level", operator: "equal", value: "federal" },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "Home Energy Rebate (HER) programs can be combined with federal tax credits. State rebates apply first, federal credits reduce tax liability.",
        order: ["program_a", "program_b"],
        source: "DOE Home Energy Rebate Programs",
      },
    },
  },
  {
    ruleId: "us-state-energy-office-grants",
    jurisdiction: "US",
    conditions: {
      all: [
        { fact: "program_a.level", operator: "equal", value: "state" },
        { fact: "program_b.level", operator: "equal", value: "federal" },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "State Energy Office grants can typically be combined with federal tax credits. Check specific state program terms.",
        order: ["program_a", "program_b"],
        source: "State Energy Office Programs",
      },
    },
  },
  {
    ruleId: "us-utility-dr-demands-response",
    jurisdiction: "US",
    conditions: {
      all: [
        { fact: "program_a.type", operator: "equal", value: "rebate" },
        { fact: "program_b.type", operator: "equal", value: "tax_credit" },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "Utility Demand Response (DR) programs can be combined with tax credits. DR payments are typically separate from equipment incentives.",
        source: "Utility DR Program Guidelines",
      },
    },
  },
  {
    ruleId: "us-25e-efficient-home-credit",
    jurisdiction: "US",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "25E" },
        { fact: "program_b.code", operator: "in", value: ["25C", "25D"] },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "IRS 25E (Efficient Home Credit) can be combined with 25C and 25D for comprehensive energy efficiency upgrades.",
        order: ["program_a", "program_b"],
        source: "IRS Publication 5027",
      },
    },
  },
];

export const usStateRules: Record<string, StackingRule[]> = {
  "US-CA": [
    {
      ruleId: "ca-tech-not-stackable-with-federal",
      jurisdiction: "US-CA",
      conditions: {
        all: [
          { fact: "program_a.code", operator: "equal", value: "TECH" },
          { fact: "program_b.code", operator: "equal", value: "25C" },
        ],
      },
      event: {
        type: "not_stackable",
        params: {
          explanation:
            "California TECH Clean Energy rebate cannot be combined with federal 25C heat pump credit for the same equipment.",
          source: "California TECH Program Terms",
        },
      },
    },
    {
      ruleId: "ca-tech-and-pge-stackable",
      jurisdiction: "US-CA",
      conditions: {
        all: [
          { fact: "program_a.code", operator: "equal", value: "TECH" },
          {
            fact: "program_b.code",
            operator: "in",
            value: ["PGE-REBATE", "SCE-REBATE", "SDGE-REBATE"],
          },
        ],
      },
      event: {
        type: "stackable",
        params: {
          explanation:
            "California TECH rebate can stack with utility rebates from PGE, SCE, or SDGE.",
          order: ["program_a", "program_b"],
          source: "California TECH + Utility Program Terms",
        },
      },
    },
  ],
  "US-NY": [
    {
      ruleId: "ny-heat-pump-not-stack-with-federal",
      jurisdiction: "US-NY",
      conditions: {
        all: [
          { fact: "program_a.code", operator: "equal", value: "NY-HEAT-PUMP" },
          { fact: "program_b.code", operator: "equal", value: "25C" },
        ],
      },
      event: {
        type: "not_stackable",
        params: {
          explanation:
            "New York Heat Pump rebate cannot be combined with federal 25C credit for the same equipment.",
          source: "NYSERDA Heat Pump Program Terms",
        },
      },
    },
  ],
  "US-MA": [
    {
      ruleId: "ma-heat-pump-not-stack-with-federal",
      jurisdiction: "US-MA",
      conditions: {
        all: [
          { fact: "program_a.code", operator: "equal", value: "MA-HEAT-PUMP" },
          { fact: "program_b.code", operator: "equal", value: "25C" },
        ],
      },
      event: {
        type: "not_stackable",
        params: {
          explanation:
            "Massachusetts Mass Save heat pump rebate cannot be combined with federal 25C credit for the same equipment.",
          source: "Mass Save Heat Pump Program Terms",
        },
      },
    },
  ],
};
