import type { Currency } from "@validatehome/shared";
import type { AppliedIncentive, CalculationResult, EligibleProgram } from "./types.js";

function calculateIncentiveAmount(program: EligibleProgram, remainingCost: number): number {
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

  return Math.min(amount, remainingCost);
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

export function calculateNetCost(
  stickerPrice: number,
  programs: readonly EligibleProgram[],
  stackingNotes: readonly string[] = [],
): CalculationResult {
  if (stickerPrice <= 0 || programs.length === 0) {
    const currency = programs[0]?.currency ?? "USD";
    return {
      stickerPrice,
      netCost: stickerPrice,
      totalSavings: 0,
      savingsPct: 0,
      currency,
      incentivesApplied: [],
      stackingNotes: [...stackingNotes],
      disclaimers: [
        "Estimates only. Actual amounts depend on final installation cost and eligibility verification.",
      ],
    };
  }

  const sorted = [...programs].sort((a, b) => {
    const amountA = calculateIncentiveAmount(a, stickerPrice);
    const amountB = calculateIncentiveAmount(b, stickerPrice);
    return amountB - amountA;
  });

  let remainingCost = stickerPrice;
  const applied: AppliedIncentive[] = [];

  for (const program of sorted) {
    if (remainingCost <= 0) break;

    const amount = calculateIncentiveAmount(program, remainingCost);
    if (amount <= 0) continue;

    applied.push({
      programId: program.id,
      programName: program.name,
      type: program.benefitType,
      amount,
      explanation: buildExplanation(program, amount),
    });

    remainingCost -= amount;
  }

  const netCost = Math.max(0, remainingCost);
  const totalSavings = stickerPrice - netCost;
  const savingsPct = stickerPrice > 0 ? Math.round((totalSavings / stickerPrice) * 100) : 0;

  const disclaimers = [
    "Estimates only. Actual amounts depend on final installation cost and eligibility verification.",
  ];

  const hasTaxCredits = applied.some((a) => a.type === "tax_credit");
  if (hasTaxCredits) {
    disclaimers.push(
      "Tax credits reduce your tax liability. The actual benefit depends on your tax situation.",
    );
  }

  return {
    stickerPrice,
    netCost,
    totalSavings,
    savingsPct,
    currency: programs[0]?.currency ?? "USD",
    incentivesApplied: applied,
    stackingNotes: [...stackingNotes],
    disclaimers,
  };
}
