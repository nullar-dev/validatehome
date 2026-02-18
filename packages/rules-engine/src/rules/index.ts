import type { StackingRule } from "../types.js";
import { auRules } from "./au.js";
import { caRules } from "./ca.js";
import { ukRules } from "./uk.js";
import { usFederalRules, usStateRules } from "./us.js";

export interface CountryRulePack {
  jurisdiction: string;
  rules: StackingRule[];
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
];

export function getRulesForJurisdiction(jurisdiction: string): StackingRule[] {
  const pack = allRules.find((p) => p.jurisdiction === jurisdiction);
  return pack?.rules ?? [];
}

export function getAllCountryRules(): StackingRule[] {
  return allRules.flatMap((pack) => pack.rules);
}

export * from "./au.js";
export * from "./ca.js";
export * from "./uk.js";
export * from "./us.js";
