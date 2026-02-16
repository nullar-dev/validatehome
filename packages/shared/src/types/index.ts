export type Country = "US" | "UK" | "AU" | "CA";

export type Currency = "USD" | "GBP" | "AUD" | "CAD";

export const COUNTRY_CURRENCY: Record<Country, Currency> = {
  US: "USD",
  UK: "GBP",
  AU: "AUD",
  CA: "CAD",
} as const;

export type JurisdictionLevel = "federal" | "state" | "local" | "utility";

export type ProgramStatus = "open" | "waitlist" | "reserved" | "funded" | "closed" | "coming_soon";

export type BenefitType = "tax_credit" | "rebate" | "grant" | "loan" | "financing";

export type DiffType = "text" | "visual" | "semantic";

export type SourceType = "webpage" | "pdf" | "api_endpoint";

export type VerificationMethod = "auto_crawl" | "manual_review" | "api_check";

export type AlertType = "status_change" | "capacity_threshold" | "new_program";

export type ApiTier = "free" | "pro" | "enterprise";

export type StackabilityConstraintType = "cannot_combine" | "reduces_amount" | "order_matters";

export type EligibilityRuleType = "income" | "property_type" | "geo" | "equipment" | "contractor";

export type PropertyType = "single_family" | "multi_family" | "rental" | "condo" | "townhouse";

export interface CalculatorInput {
  readonly postalCode: string;
  readonly country: Country;
  readonly category: string;
  readonly projectCost: number;
  readonly householdIncome?: number;
  readonly propertyType?: PropertyType;
}

export interface IncentiveApplied {
  readonly programId: string;
  readonly programName: string;
  readonly type: BenefitType;
  readonly amount: number;
  readonly explanation: string;
}

export interface CalculatorOutput {
  readonly stickerPrice: number;
  readonly netCost: number;
  readonly totalSavings: number;
  readonly savingsPct: number;
  readonly currency: Currency;
  readonly incentivesApplied: readonly IncentiveApplied[];
  readonly stackingNotes: readonly string[];
  readonly disclaimers: readonly string[];
  readonly lastVerified: string;
}

export interface ApiErrorResponse {
  readonly success: false;
  readonly error: string;
  readonly code: string;
}

export interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly meta?: {
    readonly total?: number;
    readonly page?: number;
    readonly limit?: number;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
