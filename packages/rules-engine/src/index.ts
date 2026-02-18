export { createRulesEngine, evaluateStackability } from "./engine.js";
export type { CountryRulePack } from "./rules/index.js";
export {
  allRules,
  auRules,
  caRules,
  getAllCountryRules,
  getRulesForJurisdiction,
  ukRules,
  usFederalRules,
  usStateRules,
} from "./rules/index.js";
export type {
  ProgramFact,
  RuleCondition,
  RuleConditions,
  RuleEvent,
  StackabilityResult,
  StackingRule,
} from "./types.js";
