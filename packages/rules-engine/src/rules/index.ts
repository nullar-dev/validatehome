import type { StackingRule } from "../types.js";
import { auRules } from "./au.js";
import { caRules } from "./ca.js";
import { ukExpiredRules, ukRules } from "./uk.js";
import { usFederalRules, usStateRules } from "./us.js";

export interface CountryRulePack {
  readonly jurisdiction: string;
  readonly rules: readonly StackingRule[];
}

export const allRules: CountryRulePack[] = [
  {
    jurisdiction: "US",
    rules: usFederalRules,
  },
  ...Object.entries(usStateRules).map(([jurisdiction, rules]) => ({
    jurisdiction,
    rules,
  })),
  {
    jurisdiction: "UK",
    rules: ukRules,
  },
  {
    jurisdiction: "UK-EXPIRED",
    rules: ukExpiredRules,
  },
  {
    jurisdiction: "UK-SCOTLAND",
    rules: ukRules.filter((r) => r.jurisdiction === "UK" || r.jurisdiction === "UK-SCOTLAND"),
  },
  {
    jurisdiction: "UK-WALES",
    rules: ukRules.filter((r) => r.jurisdiction === "UK" || r.jurisdiction === "UK-WALES"),
  },
  {
    jurisdiction: "AU",
    rules: auRules,
  },
  {
    jurisdiction: "AU-VIC",
    rules: auRules.filter((r) => r.jurisdiction === "AU" || r.jurisdiction === "AU-VIC"),
  },
  {
    jurisdiction: "AU-NSW",
    rules: auRules.filter((r) => r.jurisdiction === "AU" || r.jurisdiction === "AU-NSW"),
  },
  {
    jurisdiction: "AU-QLD",
    rules: auRules.filter((r) => r.jurisdiction === "AU" || r.jurisdiction === "AU-QLD"),
  },
  {
    jurisdiction: "AU-WA",
    rules: auRules.filter((r) => r.jurisdiction === "AU" || r.jurisdiction === "AU-WA"),
  },
  {
    jurisdiction: "AU-SA",
    rules: auRules.filter((r) => r.jurisdiction === "AU" || r.jurisdiction === "AU-SA"),
  },
  {
    jurisdiction: "AU-ACT",
    rules: auRules.filter((r) => r.jurisdiction === "AU" || r.jurisdiction === "AU-ACT"),
  },
  {
    jurisdiction: "AU-NT",
    rules: auRules.filter((r) => r.jurisdiction === "AU" || r.jurisdiction === "AU-NT"),
  },
  {
    jurisdiction: "CA",
    rules: caRules,
  },
  {
    jurisdiction: "CA-BC",
    rules: caRules.filter((r) => r.jurisdiction === "CA" || r.jurisdiction === "CA-BC"),
  },
  {
    jurisdiction: "CA-ON",
    rules: caRules.filter((r) => r.jurisdiction === "CA" || r.jurisdiction === "CA-ON"),
  },
  {
    jurisdiction: "CA-QC",
    rules: caRules.filter((r) => r.jurisdiction === "CA" || r.jurisdiction === "CA-QC"),
  },
  {
    jurisdiction: "CA-AB",
    rules: caRules.filter((r) => r.jurisdiction === "CA" || r.jurisdiction === "CA-AB"),
  },
  {
    jurisdiction: "CA-NS",
    rules: caRules.filter((r) => r.jurisdiction === "CA" || r.jurisdiction === "CA-NS"),
  },
  {
    jurisdiction: "CA-MB",
    rules: caRules.filter((r) => r.jurisdiction === "CA" || r.jurisdiction === "CA-MB"),
  },
  {
    jurisdiction: "CA-SK",
    rules: caRules.filter((r) => r.jurisdiction === "CA" || r.jurisdiction === "CA-SK"),
  },
  {
    jurisdiction: "CA-NB",
    rules: caRules.filter((r) => r.jurisdiction === "CA" || r.jurisdiction === "CA-NB"),
  },
  {
    jurisdiction: "CA-PE",
    rules: caRules.filter((r) => r.jurisdiction === "CA" || r.jurisdiction === "CA-PE"),
  },
  {
    jurisdiction: "CA-NL",
    rules: caRules.filter((r) => r.jurisdiction === "CA" || r.jurisdiction === "CA-NL"),
  },
];

export function getRulesForJurisdiction(jurisdiction: string): readonly StackingRule[] {
  const pack = allRules.find((p) => p.jurisdiction === jurisdiction);
  return pack?.rules ?? [];
}

export function getAllCountryRules(): StackingRule[] {
  const seen = new Set<string>();
  const result: StackingRule[] = [];

  for (const pack of allRules) {
    for (const rule of pack.rules) {
      if (!seen.has(rule.ruleId)) {
        seen.add(rule.ruleId);
        result.push(rule);
      }
    }
  }

  return result;
}

export function getActiveRules(): StackingRule[] {
  return allRules
    .filter((pack) => !pack.jurisdiction.includes("EXPIRED"))
    .flatMap((pack) => pack.rules);
}

export function getExpiredRules(): StackingRule[] {
  return allRules
    .filter((pack) => pack.jurisdiction.includes("EXPIRED"))
    .flatMap((pack) => pack.rules);
}

export * from "./au.js";
export * from "./ca.js";
export * from "./uk.js";
export * from "./us.js";
