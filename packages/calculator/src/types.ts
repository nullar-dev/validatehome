import type { BenefitType, Country, Currency } from "@validatehome/shared";

export type GrantType = "rebate" | "grant" | "tax_credit";

export interface EligibleProgram {
  readonly id: string;
  readonly name: string;
  readonly benefitType: BenefitType;
  readonly grantType?: GrantType;
  readonly maxAmount: number | null;
  readonly percentage: number | null;
  readonly perUnitAmount: number | null;
  readonly incomeCap: number | null;
  readonly incomePhaseoutStart: number | null;
  readonly lifetimeLimit: number | null;
  readonly annualLimit: number | null;
  readonly currency: Currency;
  readonly level: string;
  readonly code?: string;
  readonly jurisdiction: string;
  readonly isRefundable: boolean;
  readonly vatExempt: boolean;
  readonly amtApplicable?: boolean;
}

export interface CalculationResult {
  readonly stickerPrice: number;
  readonly netCost: number;
  readonly totalSavings: number;
  readonly savingsPct: number;
  readonly currency: Currency;
  readonly country: Country;
  readonly incentivesApplied: readonly AppliedIncentive[];
  readonly stackingNotes: readonly string[];
  readonly disclaimers: readonly string[];
  readonly taxImpact: TaxImpact;
  readonly effectiveSavings: number;
}

export interface AppliedIncentive {
  readonly programId: string;
  readonly programName: string;
  readonly type: BenefitType;
  readonly amount: number;
  readonly taxSavings: number;
  readonly effectiveAmount: number;
  readonly explanation: string;
  readonly hitsIncomeCap: boolean;
  readonly hitsLifetimeLimit: boolean;
  readonly hitsAnnualLimit: boolean;
}

export interface TaxImpact {
  readonly totalTaxSavings: number;
  readonly taxLiabilityBefore: number;
  readonly taxLiabilityAfter: number;
  readonly nonRefundableWarning: boolean;
  readonly nonRefundableAmount: number;
  readonly amtImpact?: {
    readonly applicable: boolean;
    readonly amtAdjustment?: number;
    readonly regularTaxLiability?: number;
    readonly amtLiability?: number;
    readonly warning?: string;
  };
}

export interface NetCostCalculatorInput {
  readonly stickerPrice: number;
  readonly programs: readonly EligibleProgram[];
  readonly stackingNotes?: readonly string[];
  readonly householdIncome?: number;
  readonly estimatedTaxLiability?: number;
  readonly country: Country;
  readonly sessionId?: string;
  readonly usedAmounts?: ProgramUsageAmounts;
}

export interface ProgramUsageAmounts {
  readonly [programId: string]: {
    readonly annualUsed: number;
    readonly lifetimeUsed: number;
  };
}

export interface CountryTaxConfig {
  /** VAT rate (UK standard rate = 0.20) */
  readonly vatRate: number;
  /** GST rate (Canada federal = 0.05, Australia = 0.10) */
  readonly gstRate: number;
  /** HST rate (only used for Canada federal, provinces use GST + provincial) */
  readonly hstRate: number;
  /**
   * Provincial tax rates (Canada only).
   * These are PROVINCIAL-ONLY rates (not total HST).
   * Total tax = gstRate + provincialTaxRates[province]
   * Example: Ontario total = 0.05 (GST) + 0.08 (provincial) = 0.13 HST
   */
  readonly provincialTaxRates: Record<string, number>;
  readonly amtRate?: number;
  readonly amtExemption?: number;
}

export const COUNTRY_TAX_CONFIGS: Record<Country, CountryTaxConfig> = {
  US: {
    vatRate: 0,
    gstRate: 0,
    hstRate: 0,
    provincialTaxRates: {},
    amtRate: 0.26,
    amtExemption: 85000,
  },
  UK: {
    vatRate: 0.2,
    gstRate: 0,
    hstRate: 0,
    provincialTaxRates: {},
  },
  AU: {
    vatRate: 0,
    gstRate: 0.1,
    hstRate: 0,
    provincialTaxRates: {},
  },
  CA: {
    vatRate: 0,
    gstRate: 0.05,
    hstRate: 0,
    provincialTaxRates: {
      ON: 0.13,
      BC: 0.12,
      AB: 0.05,
      QC: 0.14975,
      NS: 0.15,
      NB: 0.15,
      PE: 0.15,
      NL: 0.15,
      SK: 0.11,
      MB: 0.12,
      NT: 0.05,
      YT: 0.05,
      NU: 0.05,
    },
  },
} as const;
