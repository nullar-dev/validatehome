import { calculateNetCost, type NetCostCalculatorInput } from "@validatehome/calculator";
import { NextResponse } from "next/server";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

type ValidationResult<T> = { valid: true; data: T } | { valid: false; error: string };

function validateCountry(value: unknown): ValidationResult<"US" | "UK" | "AU" | "CA"> {
  if (value === "US" || value === "UK" || value === "AU" || value === "CA") {
    return { valid: true, data: value };
  }
  return { valid: false, error: "Country must be US, UK, AU, or CA" };
}

function validatePrograms(value: unknown): ValidationResult<NetCostCalculatorInput["programs"]> {
  if (!Array.isArray(value) || value.length === 0) {
    return { valid: false, error: "Programs must be a non-empty array" };
  }

  for (const program of value) {
    if (!isObject(program)) {
      return { valid: false, error: "Each program must be an object" };
    }
    const requiredStringFields = ["id", "name", "benefitType", "currency", "level", "jurisdiction"];
    for (const field of requiredStringFields) {
      if (typeof program[field] !== "string" || program[field].trim() === "") {
        return { valid: false, error: `Program field '${field}' is required` };
      }
    }
    if (typeof program.isRefundable !== "boolean" || typeof program.vatExempt !== "boolean") {
      return {
        valid: false,
        error: "Program fields 'isRefundable' and 'vatExempt' must be boolean",
      };
    }
  }

  return { valid: true, data: value as unknown as NetCostCalculatorInput["programs"] };
}

function validateOptionalNumber(
  value: unknown,
  field: string,
): ValidationResult<number | undefined> {
  if (value === undefined) {
    return { valid: true, data: undefined };
  }
  const parsed = toNumber(value);
  if (parsed === null) {
    return { valid: false, error: `${field} must be a number when provided` };
  }
  return { valid: true, data: parsed };
}

function validateInput(payload: unknown): ValidationResult<NetCostCalculatorInput> {
  if (!isObject(payload)) {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const stickerPrice = toNumber(payload.stickerPrice);
  if (stickerPrice === null || stickerPrice <= 0) {
    return { valid: false, error: "Sticker price must be greater than 0" };
  }

  const countryResult = validateCountry(payload.country);
  if (!countryResult.valid) return countryResult;

  const programsResult = validatePrograms(payload.programs);
  if (!programsResult.valid) return programsResult;

  const householdIncomeResult = validateOptionalNumber(payload.householdIncome, "householdIncome");
  if (!householdIncomeResult.valid) return householdIncomeResult;

  const taxLiabilityResult = validateOptionalNumber(
    payload.estimatedTaxLiability,
    "estimatedTaxLiability",
  );
  if (!taxLiabilityResult.valid) return taxLiabilityResult;

  return {
    valid: true,
    data: {
      country: countryResult.data,
      stickerPrice,
      programs: programsResult.data,
      householdIncome: householdIncomeResult.data,
      estimatedTaxLiability: taxLiabilityResult.data,
      stackingNotes: payload.stackingNotes as NetCostCalculatorInput["stackingNotes"],
      sessionId: payload.sessionId as NetCostCalculatorInput["sessionId"],
      usedAmounts: payload.usedAmounts as NetCostCalculatorInput["usedAmounts"],
    },
  };
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const validation = validateInput(payload);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const result = calculateNetCost(validation.data);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Calculation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
