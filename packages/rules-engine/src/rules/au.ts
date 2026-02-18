import type { StackingRule } from "../types.js";

export const auRules: StackingRule[] = [
  {
    ruleId: "au-solar-credits-multiplier-phasing",
    jurisdiction: "AU",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "SOLAR-CREDITS" },
        { fact: "program_a.installationDate", operator: "greaterThan", value: "2025-01-01" },
      ],
    },
    event: {
      type: "conditional",
      params: {
        explanation:
          "Solar Credits multiplier is phasing down: 1.0 (2025) → 0.8 (2026) → 0.6 (2027) → 0.4 (2028) → 0.2 (2029). New installations after 2025 get reduced multiplier.",
        cap: 15000,
        source: "Clean Energy Regulator - Small-scale Renewable Energy Scheme",
      },
    },
  },
  {
    ruleId: "au-state-battery-not-stackable-with-federal",
    jurisdiction: "AU",
    conditions: {
      all: [
        {
          fact: "program_a.code",
          operator: "in",
          value: ["VIC-BATTERY", "NSW-BATTERY", "QLD-BATTERY"],
        },
        { fact: "program_b.code", operator: "equal", value: "FEDERAL-BATTERY" },
      ],
    },
    event: {
      type: "not_stackable",
      params: {
        explanation:
          "State battery rebates cannot be combined with the federal small-scale technology certificate program for battery storage.",
        source: "Clean Energy Council - State + Federal Battery Programs",
      },
    },
  },
  {
    ruleId: "au-solar-and-battery-stackable",
    jurisdiction: "AU",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "in", value: ["SOLAR-CREDITS", "FEDERAL-SOLAR"] },
        {
          fact: "program_b.code",
          operator: "in",
          value: [
            "FEDERAL-BATTERY",
            "VIC-BATTERY",
            "NSW-BATTERY",
            "QLD-BATTERY",
            "WA-BATTERY",
            "SA-BATTERY",
          ],
        },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "Solar and battery systems can be stacked. Small-scale technology certificates can be claimed for both solar panels and battery storage.",
        order: ["program_a", "program_b"],
        source: "Clean Energy Regulator",
      },
    },
  },
  {
    ruleId: "au-vic-solar-not-stackable-with-vic-rebate",
    jurisdiction: "AU-VIC",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "VIC-SOLAR" },
        { fact: "program_b.code", operator: "equal", value: "SOLAR-CREDITS" },
      ],
    },
    event: {
      type: "not_stackable",
      params: {
        explanation:
          "Victoria's Solar Victoria rebate cannot be combined with federal Small-scale Renewable Energy Scheme (STCs) for the same system.",
        source: "Solar Victoria Program Terms",
      },
    },
  },
  {
    ruleId: "au-nsw-energy-savings-scheme",
    jurisdiction: "AU-NSW",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "NSW-ESS" },
        { fact: "program_b.code", operator: "in", value: ["SOLAR-CREDITS", "FEDERAL-SOLAR"] },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "NSW Energy Savings Scheme (ESS) can be combined with federal solar certificates. ESS creates tradeable certificates based on energy savings.",
        order: ["program_a", "program_b"],
        source: "NSW ESS Administrator",
      },
    },
  },
  {
    ruleId: "au-queensland-battery-boost",
    jurisdiction: "AU-QLD",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "QLD-BATTERY" },
        { fact: "program_b.code", operator: "equal", value: "FEDERAL-BATTERY" },
      ],
    },
    event: {
      type: "not_stackable",
      params: {
        explanation:
          "Queensland's Battery Boost rebate cannot be combined with federal small-scale technology certificates for the same battery system.",
        source: "Queensland Energy Minister Announcement",
      },
    },
  },
  {
    ruleId: "au-heat-pump-water-heater-rules",
    jurisdiction: "AU",
    conditions: {
      all: [
        { fact: "program_a.type", operator: "equal", value: "rebate" },
        { fact: "program_a.category", operator: "equal", value: "heat-pump-water-heater" },
        { fact: "program_b.type", operator: "equal", value: "tax-credit" },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "State heat pump water heater rebates can be combined with federal tax incentives. Rebates do not reduce basis for federal claims in Australia.",
        order: ["program_a", "program_b"],
        source: "Australian Tax Office - Energy Incentives",
      },
    },
  },
  {
    ruleId: "au-wa-energy-upgrade",
    jurisdiction: "AU-WA",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "WA-ENERGY-UPGRADE" },
        { fact: "program_b.code", operator: "in", value: ["SOLAR-CREDITS", "FEDERAL-SOLAR"] },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "WA Energy Upgrade scheme can be combined with federal solar credits. State rebates apply to efficiency measures, federal for solar.",
        order: ["program_a", "program_b"],
        source: "WA Energy Minister",
      },
    },
  },
  {
    ruleId: "au-sa-home-battery",
    jurisdiction: "AU-SA",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "SA-HOME-BATTERY" },
        { fact: "program_b.code", operator: "equal", value: "FEDERAL-BATTERY" },
      ],
    },
    event: {
      type: "not_stackable",
      params: {
        explanation:
          "South Australia Home Battery scheme cannot be combined with federal battery certificates for the same system.",
        source: "SA Energy",
      },
    },
  },
  {
    ruleId: "au-nsw-energy-savings-stacks-with-solar",
    jurisdiction: "AU-NSW",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "NSW-ESS" },
        { fact: "program_b.code", operator: "in", value: ["SOLAR-CREDITS", "FEDERAL-SOLAR"] },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "NSW Energy Savings Scheme (ESS) can be combined with federal Small-scale Technology Certificates (STCs) for solar installations.",
        order: ["program_a", "program_b"],
        source: "NSW ESS Administrator",
      },
    },
  },
  {
    ruleId: "au-vic-solar-vicsmart",
    jurisdiction: "AU-VIC",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "VIC-SMARTS" },
        { fact: "program_b.code", operator: "in", value: ["VIC-SOLAR", "SOLAR-CREDITS"] },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "Victoria's VicSmart program can be combined with other solar incentives. VicSmart is for smaller, simpler installations.",
        source: "Solar Victoria",
      },
    },
  },
  {
    ruleId: "au-act-sustainable-household",
    jurisdiction: "AU-ACT",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "ACT-SUSTAINABLE" },
        { fact: "program_b.code", operator: "in", value: ["SOLAR-CREDITS", "FEDERAL-SOLAR"] },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "ACT Sustainable Household scheme can be combined with federal solar credits for comprehensive energy upgrades.",
        order: ["program_a", "program_b"],
        source: "ACT Environment",
      },
    },
  },
  {
    ruleId: "au-nt-energy-advice",
    jurisdiction: "AU-NT",
    conditions: {
      all: [
        { fact: "program_a.code", operator: "equal", value: "NT-ENERGY-ADVICE" },
        { fact: "program_b.code", operator: "in", value: ["SOLAR-CREDITS"] },
      ],
    },
    event: {
      type: "stackable",
      params: {
        explanation:
          "Northern Territory energy advice andrebates can combine with federal solar certificates.",
        source: "NT Department of Environment",
      },
    },
  },
];
