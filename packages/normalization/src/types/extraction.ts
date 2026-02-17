import type {
  BenefitType,
  Country,
  Currency,
  EligibilityRuleType,
  ProgramStatus,
} from "@validatehome/shared";

export type SourceType = "webpage" | "pdf" | "api_endpoint";

export interface RawSource {
  readonly id: string;
  readonly url: string;
  readonly type: SourceType;
  readonly country: Country;
  readonly fetchedAt: Date;
  readonly rawContent: string;
  readonly metadata?: Record<string, unknown>;
}

export interface ExtractedField<T = string> {
  readonly value: T | null;
  readonly confidence: number;
  readonly sourceSelector?: string;
  readonly rawValue?: string;
  readonly errors?: readonly string[];
}

export interface RawProgramData {
  readonly sourceId: string;
  readonly name: ExtractedField<string | null>;
  readonly description: ExtractedField<string | null>;
  readonly url: ExtractedField<string | null>;
  readonly status: ExtractedField<ProgramStatus>;
  readonly budgetTotal: ExtractedField<string | null>;
  readonly budgetRemaining: ExtractedField<string | null>;
  readonly startDate: ExtractedField<string | null>;
  readonly endDate: ExtractedField<string | null>;
  readonly applicationDeadline: ExtractedField<string | null>;
  readonly jurisdictionName: ExtractedField<string | null>;
  readonly jurisdictionLevel: ExtractedField<string | null>;
  readonly benefits: ExtractedBenefit[];
  readonly eligibilityRules: ExtractedEligibilityRule[];
  readonly categories: ExtractedField<string[] | null>;
}

export interface ExtractedBenefit {
  readonly type: ExtractedField<BenefitType>;
  readonly maxAmount: ExtractedField<string | null>;
  readonly percentage: ExtractedField<number | null>;
  readonly incomeCap: ExtractedField<string | null>;
  readonly perUnitAmount: ExtractedField<string | null>;
  readonly currency: ExtractedField<Currency>;
  readonly description: ExtractedField<string | null>;
}

export interface ExtractedEligibilityRule {
  readonly ruleType: ExtractedField<EligibilityRuleType>;
  readonly criteria: ExtractedField<Record<string, unknown>>;
  readonly description: ExtractedField<string | null>;
}

export interface ExtractionResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly provenance: ProvenanceData;
}

export interface ProvenanceData {
  readonly sourceUrl: string;
  readonly sourceType: SourceType;
  readonly country: Country;
  readonly fetchedAt: Date;
  readonly normalizedAt: Date;
  readonly extractorVersion: string;
  readonly rawSnapshot?: string;
  readonly transformationRules: readonly string[];
}

export interface ConfidenceScore {
  readonly overall: number;
  readonly fields: Record<string, number>;
  readonly requiresManualReview: boolean;
  readonly reviewReasons?: readonly string[];
}

export interface NormalizationOptions {
  readonly strictMode?: boolean;
  readonly requireMinimumConfidence?: number;
  readonly enableDeduplication?: boolean;
  readonly currencyConversionDate?: Date;
}
