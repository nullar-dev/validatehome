import type { Country, Currency } from "@validatehome/shared";
import type {
  AppliedIncentive,
  CalculationResult,
  CalculatorInput,
  CountryTaxConfig,
  EligibleProgram,
  ProgramUsageAmounts,
  TaxImpact,
} from "./types.js";
import { COUNTRY_TAX_CONFIGS } from "./types.js";

function calculateIncentiveAmount(
  program: EligibleProgram,
  remainingCost: number,
  usedAmounts?: ProgramUsageAmounts,
): number {
  const used = usedAmounts?.[program.id];
  let availableAmount = Infinity;

  if (program.lifetimeLimit != null && used?.lifetimeUsed != null) {
    availableAmount = Math.min(availableAmount, program.lifetimeLimit - used.lifetimeUsed);
  }

  if (program.annualLimit != null && used?.annualUsed != null) {
    availableAmount = Math.min(availableAmount, program.annualLimit - used.annualUsed);
  }

  let amount = 0;

  if (program.percentage != null) {
    amount = Math.floor(remainingCost * (program.percentage / 100));
    if (program.maxAmount != null) {
      amount = Math.min(amount, program.maxAmount);
    }
  } else if (program.maxAmount != null) {
    amount = program.maxAmount;
  } else if (program.perUnitAmount != null) {
    amount = program.perUnitAmount;
  }

  const finalAmount = Math.min(amount, remainingCost, availableAmount);
  return Math.max(0, finalAmount);
}

function calculateIncomeAdjustedAmount(
  program: EligibleProgram,
  baseAmount: number,
  householdIncome: number,
): { amount: number; isCapped: boolean } {
  if (program.incomeCap == null || householdIncome == null || program.incomePhaseoutStart == null) {
    return { amount: baseAmount, isCapped: false };
  }

  if (householdIncome <= program.incomeCap) {
    return { amount: baseAmount, isCapped: false };
  }

  const phaseoutRange = 100000;
  const incomeOverCap = householdIncome - program.incomeCap;
  const phaseoutFactor = Math.max(0, 1 - incomeOverCap / phaseoutRange);
  const adjustedAmount = Math.floor(baseAmount * phaseoutFactor);

  return { amount: Math.max(0, adjustedAmount), isCapped: phaseoutFactor < 1 };
}

function buildExplanation(program: EligibleProgram, amount: number): string {
  if (program.percentage != null && program.maxAmount != null) {
    return `${program.percentage}% of cost, max ${formatAmount(program.maxAmount, program.currency)}`;
  }
  if (program.percentage != null) {
    return `${program.percentage}% of cost`;
  }
  if (program.maxAmount != null) {
    return `Fixed ${program.benefitType} of ${formatAmount(amount, program.currency)}`;
  }
  if (program.perUnitAmount != null) {
    return `Per-unit amount of ${formatAmount(program.perUnitAmount, program.currency)}`;
  }
  return `${formatAmount(amount, program.currency)} ${program.benefitType}`;
}

function formatAmount(amount: number, currency: Currency): string {
  const symbols: Record<Currency, string> = {
    USD: "$",
    GBP: "\u00a3",
    AUD: "A$",
    CAD: "C$",
  };
  return `${symbols[currency]}${amount.toLocaleString()}`;
}

export function getCountryTaxConfig(country: Country): CountryTaxConfig {
  return COUNTRY_TAX_CONFIGS[country];
}

export function applyCountryTaxRules(
  amount: number,
  country: Country,
  _isRefundable: boolean,
  vatExempt: boolean,
): number {
  if (vatExempt) {
    return amount;
  }

  const config = getCountryTaxConfig(country);

  if (country === "UK") {
    return amount * (1 + config.vatRate);
  }

  if (country === "AU") {
    return amount * (1 + config.gstRate);
  }

  if (country === "CA") {
    return amount * (1 + config.gstRate);
  }

  return amount;
}

export function calculateNetCost(input: CalculatorInput): CalculationResult;
export function calculateNetCost(
  stickerPrice: number,
  programs: readonly EligibleProgram[],
  stackingNotes?: readonly string[],
  householdIncome?: number,
  estimatedTaxLiability?: number,
  country?: Country,
  sessionId?: string,
  usedAmounts?: ProgramUsageAmounts,
): CalculationResult;
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Calculator requires comprehensive logic
export function calculateNetCost(
  stickerPriceOrInput: number | CalculatorInput,
  programs?: readonly EligibleProgram[],
  stackingNotes: readonly string[] = [],
  householdIncomeInput?: number,
  estimatedTaxLiabilityInput?: number,
  country: Country = "US",
  sessionId?: string,
  usedAmounts?: ProgramUsageAmounts,
): CalculationResult {
  let input: CalculatorInput;

  if (typeof stickerPriceOrInput === "object") {
    input = stickerPriceOrInput;
  } else {
    input = {
      stickerPrice: stickerPriceOrInput,
      programs: programs ?? [],
      stackingNotes,
      householdIncome: householdIncomeInput,
      estimatedTaxLiability: estimatedTaxLiabilityInput,
      country,
      sessionId,
      usedAmounts,
    };
  }

  const {
    stickerPrice,
    programs: progList,
    stackingNotes: notes = [],
    householdIncome,
    estimatedTaxLiability,
    country: inputCountry,
    usedAmounts: used,
  } = input;

  if (stickerPrice <= 0 || progList.length === 0) {
    const currency = progList[0]?.currency ?? "USD";
    return {
      stickerPrice,
      netCost: stickerPrice,
      totalSavings: 0,
      savingsPct: 0,
      currency,
      country: inputCountry,
      incentivesApplied: [],
      stackingNotes: notes,
      disclaimers: [
        "Estimates only. Actual amounts depend on final installation cost and eligibility verification.",
      ],
      taxImpact: {
        totalTaxSavings: 0,
        taxLiabilityBefore: 0,
        taxLiabilityAfter: 0,
        nonRefundableWarning: false,
        nonRefundableAmount: 0,
      },
      effectiveSavings: 0,
    };
  }

  const sorted = [...progList].sort((a, b) => {
    const amountA = calculateIncentiveAmount(a, stickerPrice, used);
    const amountB = calculateIncentiveAmount(b, stickerPrice, used);
    return amountB - amountA;
  });

  let remainingCost = stickerPrice;
  const applied: AppliedIncentive[] = [];
  let totalTaxSavings = 0;

  for (const program of sorted) {
    if (remainingCost <= 0) break;

    let amount = calculateIncentiveAmount(program, remainingCost, used);
    if (amount <= 0) continue;

    const incomeAdjusted = calculateIncomeAdjustedAmount(program, amount, householdIncome ?? 0);
    amount = incomeAdjusted.amount;

    if (amount <= 0) continue;

    let taxSavings = 0;
    let effectiveAmount = amount;

    if (program.benefitType === "tax_credit") {
      taxSavings = Math.min(amount, estimatedTaxLiability ?? amount);
      if (!program.isRefundable) {
        effectiveAmount = taxSavings;
      }
      totalTaxSavings += taxSavings;
    }

    const hitsIncomeCap = incomeAdjusted.isCapped;
    const hitsLifetimeLimit =
      program.lifetimeLimit != null &&
      (used?.[program.id]?.lifetimeUsed ?? 0) + amount > program.lifetimeLimit;
    const hitsAnnualLimit =
      program.annualLimit != null &&
      (used?.[program.id]?.annualUsed ?? 0) + amount > program.annualLimit;

    applied.push({
      programId: program.id,
      programName: program.name,
      type: program.benefitType,
      amount,
      taxSavings,
      effectiveAmount,
      explanation: buildExplanation(program, amount),
      hitsIncomeCap,
      hitsLifetimeLimit,
      hitsAnnualLimit,
    });

    remainingCost -= amount;
  }

  const netCost = Math.max(0, remainingCost);
  const totalSavings = stickerPrice - netCost;
  const savingsPct = stickerPrice > 0 ? Math.round((totalSavings / stickerPrice) * 100) : 0;

  const effectiveSavings = applied.reduce((sum, a) => sum + a.effectiveAmount, 0);

  const disclaimers = [
    "Estimates only. Actual amounts depend on final installation cost and eligibility verification.",
  ];

  const hasTaxCredits = applied.some((a) => a.type === "tax_credit");
  if (hasTaxCredits) {
    disclaimers.push(
      "Tax credits reduce your tax liability. The actual benefit depends on your tax situation.",
    );
  }

  const taxCredits = applied.filter((a) => a.type === "tax_credit");
  const nonRefundableTaxCredits = taxCredits.filter(
    (a) => a.amount > a.taxSavings && a.effectiveAmount < a.amount,
  );
  const nonRefundableWarning = nonRefundableTaxCredits.length > 0;
  if (nonRefundableWarning) {
    disclaimers.push(
      "Some tax credits are non-refundable and cannot exceed your tax liability. Unused credits may be carried forward.",
    );
  }

  const taxImpact: TaxImpact = {
    totalTaxSavings,
    taxLiabilityBefore: estimatedTaxLiability ?? 0,
    taxLiabilityAfter: Math.max(0, (estimatedTaxLiability ?? 0) - totalTaxSavings),
    nonRefundableWarning,
    nonRefundableAmount: nonRefundableTaxCredits.reduce(
      (sum, a) => sum + Math.max(0, a.amount - a.taxSavings),
      0,
    ),
  };

  return {
    stickerPrice,
    netCost,
    totalSavings,
    savingsPct,
    currency: progList[0]?.currency ?? "USD",
    country: inputCountry,
    incentivesApplied: applied,
    stackingNotes: [...notes],
    disclaimers,
    taxImpact,
    effectiveSavings,
  };
}
