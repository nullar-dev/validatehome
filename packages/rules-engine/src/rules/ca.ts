import type { StackingRule } from "../types.js";

export const caRules: StackingRule[] = [
  {
    ruleId: "ca-greener-homes-loan-grant-stackable",
    jurisdiction: "CA",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "GREENER-HOMES-LOAN" },
        { fact: "program_b.code", operator: "equal", value: "GREENER-HOMES-GRANT" },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "Canada Greener Homes Loan (interest-free) can be combined with Greener Homes Grant. Apply loan for upfront costs, grant for reimbursement.",
        order: ["program_a", "program_b"],
        source: "Natural Resources Canada - Greener Homes Initiative",
      },
    },
  },
  {
    ruleId: "ca-greener-homes-not-stack-with-provincial",
    jurisdiction: "CA",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "GREENER-HOMES-GRANT" },
        { fact: "program_b.level", operator: "equal", value: "provincial" },
        { fact: "program_b.code", operator: "in", value: ["BC-GREEN", "ON-GREEN", "QC-ECO"] },
      ],
    },
    event: {
      type: "not_stackable",
      params: {
        explanation:
          "Federal Greener Homes Grant cannot be combined with provincial programs for the same upgrade. Choose either federal or provincial, not both.",
        source: "NRCan Greener Homes - Stacking Rules",
      },
    },
  },
  {
    ruleId: "ca-provincial-utilities-can-stack",
    jurisdiction: "CA",
    conditions: {
      all: [
        { fact: "program_a.level", operator: "equal", value: "provincial" },
        { fact: "program_b.level", operator: "equal", value: "utility" },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "Provincial programs can usually be combined with utility rebates. Apply provincial first, then utility.",
        order: ["program_a", "program_b"],
        source: "General Canadian Energy Incentive Stacking Rules",
      },
    },
  },
  {
    ruleId: "ca-bc-cleanbc-not-stack-with-federal",
    jurisdiction: "CA-BC",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "BC-CLEAN-BC" },
        { fact: "program_b.code", operator: "equal", value: "GREENER-HOMES-GRANT" },
      ],
    },
    event: {
      type: "not_stackable",
      params: {
        explanation:
          "BC CleanBC rebates cannot be combined with federal Greener Homes Grant for the same equipment.",
        source: "BC CleanBC Program Terms",
      },
    },
  },
  {
    ruleId: "ca-on-saveonenergy-not-stack-with-federal",
    jurisdiction: "CA-ON",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "ON-SAVEONENERGY" },
        { fact: "program_b.code", operator: "equal", value: "GREENER-HOMES-GRANT" },
      ],
    },
    event: {
      type: "not_stackable",
      params: {
        explanation:
          "Ontario SaveOnEnergy rebates cannot be combined with federal Greener Homes Grant for the same equipment.",
        source: "IESO SaveOnEnergy Program Terms",
      },
    },
  },
  {
    ruleId: "ca-qc-eco-conditions-standalone",
    jurisdiction: "CA-QC",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "QC-ECO" },
        { fact: "program_b.level", operator: "equal", value: "utility" },
        { fact: "program_b.code", operator: "notEqual", value: "GREENER-HOMES-GRANT" },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "Quebec's Rénoclimat (ECO) program can be combined with utility rebates but not with federal Greener Homes. Quebec has separate provincial tax credits.",
        order: ["program_a", "program_b"],
        source: "Transition Énergétique Québec",
      },
    },
  },
  {
    ruleId: "ca-alberta-utilities-can-stack",
    jurisdiction: "CA-AB",
    conditions: {
      all: [{ fact: "program_a.level", operator: "equal", value: "utility" }],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "Alberta has no provincial program, but utility rebates (ENMAX, FortisAlberta) can combine with federal Greener Homes Grant.",
        order: ["program_a", "program_b"],
        source: "Alberta Utility Programs",
      },
    },
  },
  {
    ruleId: "ca-heat-pump-canada-grep",
    jurisdiction: "CA",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "CANADA-GREP" },
        {
          fact: "program_b.code",
          operator: "in",
          value: ["GREENER-HOMES-GRANT", "GREENER-HOMES-LOAN"],
        },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "Canada Greener Homes Refund (Canada GREP) pilot can be combined with regular Greener Homes Grant. Canada GREP is additional top-up for early adopters.",
        order: ["program_b", "program_a"],
        source: "NRCan Canada GREP Pilot",
      },
    },
  },
  {
    ruleId: "ca-bc-energy-coach-stacks",
    jurisdiction: "CA-BC",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "BC-ENERGY-COACH" },
        { fact: "program_b.code", operator: "in", value: ["BC-CLEAN-BC", "GREENER-HOMES-GRANT"] },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "BC Energy Coach program can combine with CleanBC and federal Greener Homes for comprehensive energy upgrades.",
        order: ["program_a", "program_b"],
        source: "BC CleanBC",
      },
    },
  },
  {
    ruleId: "ca-qc-renoclimat-stacks-with-utility",
    jurisdiction: "CA-QC",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "QC-RENOCLIMAT" },
        { fact: "program_b.level", operator: "equal", value: "utility" },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "Quebec Rénoclimat can be combined with utility rebates. Apply provincial first, utility may add top-up.",
        order: ["program_a", "program_b"],
        source: "Transition Énergétique Québec",
      },
    },
  },
  {
    ruleId: "ca-ab-efficiency-programs",
    jurisdiction: "CA-AB",
    conditions: {
      all: [
        {
          fact: "program_a.code",
          operator: "in",
          value: ["AB-EFFICIENCY", "ENMAX-REBATE", "FORTIS-REBATE"],
        },
        { fact: "program_b.code", operator: "equal", value: "GREENER-HOMES-GRANT" },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "Alberta efficiency programs and utility rebates can stack with federal Greener Homes Grant.",
        order: ["program_a", "program_b"],
        source: "Alberta Utilities",
      },
    },
  },
  {
    ruleId: "ca-ns-home-energy",
    jurisdiction: "CA-NS",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "NS-HOME-ENERGY" },
        { fact: "program_b.code", operator: "equal", value: "GREENER-HOMES-GRANT" },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "Nova Scotia Home Energy Assessment can stack with federal Greener Homes Grant.",
        order: ["program_a", "program_b"],
        source: "Nova Scotia Department of Natural Resources",
      },
    },
  },
  {
    ruleId: "ca-mb-efficiency",
    jurisdiction: "CA-MB",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "MB-EFFICIENCY" },
        { fact: "program_b.level", operator: "in", value: ["federal", "utility"] },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "Manitoba Efficiency Programs can combine with federal and utility incentives.",
        order: ["program_a", "program_b"],
        source: "Manitoba Hydro",
      },
    },
  },
  {
    ruleId: "ca-sk-energy-efficiency",
    jurisdiction: "CA-SK",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "SK-ENERGY-EFFICIENCY" },
        {
          fact: "program_b.code",
          operator: "in",
          value: ["GREENER-HOMES-GRANT", "GREENER-HOMES-LOAN"],
        },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "Saskatchewan Energy Efficiency programs can stack with federal Greener Homes.",
        order: ["program_a", "program_b"],
        source: "Saskatchewan Ministry of Energy",
      },
    },
  },
  {
    ruleId: "ca-nb-energy-savings",
    jurisdiction: "CA-NB",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "NB-ENERGY-SAVINGS" },
        { fact: "program_b.code", operator: "in", value: ["GREENER-HOMES-GRANT"] },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation: "New Brunswick Energy Savings can combine with federal Greener Homes Grant.",
        order: ["program_a", "program_b"],
        source: "NB Power",
      },
    },
  },
  {
    ruleId: "ca-pe-energy-efficient",
    jurisdiction: "CA-PE",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "PE-ENERGY-EFFICIENT" },
        { fact: "program_b.code", operator: "equal", value: "GREENER-HOMES-GRANT" },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "Prince Edward Island Energy Efficient programs stack with federal incentives.",
        order: ["program_a", "program_b"],
        source: "PEI Government",
      },
    },
  },
  {
    ruleId: "ca-nl-home-energy",
    jurisdiction: "CA-NL",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "NL-HOME-ENERGY" },
        { fact: "program_b.code", operator: "equal", value: "GREENER-HOMES-GRANT" },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation: "Newfoundland Home Energy programs can combine with federal Greener Homes.",
        order: ["program_a", "program_b"],
        source: "NLCAN",
      },
    },
  },
];
