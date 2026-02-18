import type { BenefitType } from "@validatehome/shared";

export interface StackingRule {
  readonly ruleId: string;
  readonly jurisdiction: string;
  readonly conditions: RuleConditions;
  readonly event: RuleEvent;
  readonly isActive?: boolean;
  readonly source?: string;
  readonly sourceUrl?: string;
}

export interface RuleConditions {
  readonly all?: readonly RuleConditionNode[];
  readonly any?: readonly RuleConditionNode[];
}

export interface RuleCondition {
  readonly fact: string;
  readonly operator: "equal" | "notEqual" | "greaterThan" | "lessThan" | "in" | "notIn";
  readonly value: string | number | boolean | readonly string[];
}

export type RuleConditionNode = RuleCondition | RuleConditions;

export interface RuleEvent {
  readonly type: "stackable" | "not_stackable" | "conditional";
  readonly params: {
    readonly explanation: string;
    readonly order?: readonly string[];
    readonly cap?: number | null;
    readonly reductionPct?: number;
    readonly source?: string;
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
  readonly incomeRestricted?: boolean;
  readonly installationDate?: string;
  readonly replacesExisting?: boolean;
  readonly category?: string;
  readonly annualLimit?: number;
  readonly lifetimeLimit?: number;
}

export interface StackabilityResult {
  readonly canStack: boolean;
  readonly explanation: string;
  readonly order?: readonly string[];
  readonly cap?: number | null;
  readonly reductionPct?: number | null;
  readonly source?: string;
}
