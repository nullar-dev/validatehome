import type {
  BenefitType,
  Currency,
  EligibilityRuleType,
  ProgramStatus,
} from "@validatehome/shared";
import type { ConfidenceScore, ProvenanceData } from "./extraction.js";

export interface CanonicalProgram {
  readonly id?: string;
  readonly jurisdictionId: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly programUrl: string | null;
  readonly status: ProgramStatus;
  readonly budgetTotal: string | null;
  readonly budgetRemaining: string | null;
  readonly budgetPctUsed: number | null;
  readonly startDate: Date | null;
  readonly endDate: Date | null;
  readonly applicationDeadline: Date | null;
  readonly lastVerifiedAt: Date;
  readonly canonicalSourceUrl: string | null;
  readonly metadata: Record<string, unknown> | null;
  readonly confidence: ConfidenceScore;
  readonly provenance: ProvenanceData;
}

export interface CanonicalBenefit {
  readonly id?: string;
  readonly programId?: string;
  readonly type: BenefitType;
  readonly maxAmount: string | null;
  readonly percentage: number | null;
  readonly incomeCap: string | null;
  readonly perUnitAmount: string | null;
  readonly currency: Currency;
  readonly description: string | null;
  readonly confidence: ConfidenceScore;
}

export interface CanonicalEligibilityRule {
  readonly id?: string;
  readonly programId?: string;
  readonly ruleType: EligibilityRuleType;
  readonly criteriaJson: Record<string, unknown>;
  readonly description: string | null;
  readonly confidence: ConfidenceScore;
}

export interface CurrencyConversion {
  readonly fromCurrency: Currency;
  readonly toCurrency: Currency;
  readonly amount: string;
  readonly convertedAmount: string;
  readonly rate: number;
  readonly rateDate: Date;
}

export interface DeduplicationCandidate {
  readonly canonical: CanonicalProgram;
  readonly duplicates: readonly CanonicalProgram[];
  readonly matchScore: number;
  readonly matchReasons: readonly string[];
}

export interface ValidationIssue {
  readonly field: string;
  readonly severity: "error" | "warning" | "info";
  readonly message: string;
  readonly code: string;
}

export interface ValidationResult {
  readonly isValid: boolean;
  readonly issues: readonly ValidationIssue[];
  readonly canAutoFix: boolean;
  readonly autoFixActions?: readonly string[];
}
