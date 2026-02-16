import type { BenefitType, Currency } from "@validatehome/shared";

export interface EligibleProgram {
  readonly id: string;
  readonly name: string;
  readonly benefitType: BenefitType;
  readonly maxAmount: number | null;
  readonly percentage: number | null;
  readonly perUnitAmount: number | null;
  readonly incomeCap: number | null;
  readonly currency: Currency;
  readonly level: string;
  readonly code?: string;
  readonly jurisdiction: string;
}

export interface CalculationResult {
  readonly stickerPrice: number;
  readonly netCost: number;
  readonly totalSavings: number;
  readonly savingsPct: number;
  readonly currency: Currency;
  readonly incentivesApplied: readonly AppliedIncentive[];
  readonly stackingNotes: readonly string[];
  readonly disclaimers: readonly string[];
}

export interface AppliedIncentive {
  readonly programId: string;
  readonly programName: string;
  readonly type: BenefitType;
  readonly amount: number;
  readonly explanation: string;
}
