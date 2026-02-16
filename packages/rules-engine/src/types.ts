import type { BenefitType } from "@validatehome/shared";

export interface StackingRule {
  readonly ruleId: string;
  readonly jurisdiction: string;
  readonly conditions: RuleConditions;
  readonly event: RuleEvent;
}

export interface RuleConditions {
  readonly all?: readonly RuleCondition[];
  readonly any?: readonly RuleCondition[];
}

export interface RuleCondition {
  readonly fact: string;
  readonly operator: "equal" | "notEqual" | "greaterThan" | "lessThan" | "in" | "notIn";
  readonly value: string | number | readonly string[];
}

export interface RuleEvent {
  readonly type: "stackable" | "not_stackable" | "conditional";
  readonly params: {
    readonly explanation: string;
    readonly order?: readonly string[];
    readonly cap?: number | null;
    readonly reductionPct?: number;
  };
}

export interface ProgramFact {
  readonly id: string;
  readonly name: string;
  readonly type: BenefitType;
  readonly level: string;
  readonly code?: string;
  readonly maxAmount?: number;
  readonly percentage?: number;
  readonly jurisdiction: string;
}

export interface StackabilityResult {
  readonly canStack: boolean;
  readonly explanation: string;
  readonly order?: readonly string[];
  readonly cap?: number | null;
  readonly reductionPct?: number;
}
