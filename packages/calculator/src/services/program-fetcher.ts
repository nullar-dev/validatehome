import type { Country, Currency } from "@validatehome/shared";
import type { CalculatorFixture } from "../fixtures.js";
import { CALCULATOR_FIXTURES } from "../fixtures.js";
import type { EligibleProgram } from "../types.js";

export interface ProgramQuery {
  country: Country;
  category: "heat-pump" | "solar" | "insulation" | "battery" | "ev-charger";
  postalCode?: string;
  jurisdiction?: string;
}

export interface ProgramFetcherOptions {
  useLiveDb: boolean;
  fallbackToFixtures: boolean;
}

const DEFAULT_OPTIONS: ProgramFetcherOptions = {
  useLiveDb: false,
  fallbackToFixtures: true,
};

export interface LiveProgramSource {
  id: string;
  name: string;
  benefitType: "tax_credit" | "rebate" | "grant" | "loan";
  maxAmount: number | null;
  percentage: number | null;
  perUnitAmount: number | null;
  incomeCap: number | null;
  incomePhaseoutStart: number | null;
  lifetimeLimit: number | null;
  annualLimit: number | null;
  currency: Currency;
  level: "federal" | "state" | "provincial" | "local" | "utility";
  code: string | null;
  jurisdiction: string;
  isRefundable: boolean;
  vatExempt: boolean;
  categories: readonly string[];
  status: "active" | "pending" | "expired";
}

export function mapDbProgramToEligibleProgram(dbProgram: LiveProgramSource): EligibleProgram {
  return {
    id: dbProgram.id,
    name: dbProgram.name,
    benefitType: dbProgram.benefitType,
    maxAmount: dbProgram.maxAmount,
    percentage: dbProgram.percentage,
    perUnitAmount: dbProgram.perUnitAmount,
    incomeCap: dbProgram.incomeCap,
    incomePhaseoutStart: dbProgram.incomePhaseoutStart,
    lifetimeLimit: dbProgram.lifetimeLimit,
    annualLimit: dbProgram.annualLimit,
    currency: dbProgram.currency,
    level: dbProgram.level,
    code: dbProgram.code ?? undefined,
    jurisdiction: dbProgram.jurisdiction,
    isRefundable: dbProgram.isRefundable,
    vatExempt: dbProgram.vatExempt,
  };
}

export async function fetchProgramsFromDb(_query: ProgramQuery): Promise<EligibleProgram[]> {
  return [];
}

export function getProgramsFromFixtures(query: ProgramQuery): EligibleProgram[] {
  const fixtures = CALCULATOR_FIXTURES.filter(
    (f: CalculatorFixture) => f.country === query.country && f.category === query.category,
  );

  if (fixtures.length === 0) {
    return [];
  }

  return fixtures.flatMap((fixture: CalculatorFixture) => fixture.programs);
}

export async function fetchPrograms(
  query: ProgramQuery,
  options: ProgramFetcherOptions = DEFAULT_OPTIONS,
): Promise<EligibleProgram[]> {
  if (options.useLiveDb) {
    try {
      const livePrograms = await fetchProgramsFromDb(query);
      if (livePrograms.length > 0) {
        return livePrograms;
      }
    } catch {
      // Fall through to fixtures
    }
  }

  if (options.fallbackToFixtures) {
    return getProgramsFromFixtures(query);
  }

  return [];
}

export function getAvailableCategories(country: Country): readonly string[] {
  const categories = new Set<string>();

  const fixtures = CALCULATOR_FIXTURES.filter((f: CalculatorFixture) => f.country === country);
  for (const fixture of fixtures) {
    categories.add(fixture.category);
  }

  return Array.from(categories);
}

export function getFixturesForCountry(country: Country): CalculatorFixture[] {
  return CALCULATOR_FIXTURES.filter((f: CalculatorFixture) => f.country === country);
}

export function getAllFixtures(): CalculatorFixture[] {
  return CALCULATOR_FIXTURES;
}

export function searchFixtures(
  country: Country,
  category?: string,
  searchTerm?: string,
): CalculatorFixture[] {
  let fixtures = CALCULATOR_FIXTURES.filter((f: CalculatorFixture) => f.country === country);

  if (category) {
    fixtures = fixtures.filter((f: CalculatorFixture) => f.category === category);
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    fixtures = fixtures.filter(
      (f: CalculatorFixture) =>
        f.name.toLowerCase().includes(term) || f.description.toLowerCase().includes(term),
    );
  }

  return fixtures;
}

export function getFixtureByName(name: string): CalculatorFixture | undefined {
  return CALCULATOR_FIXTURES.find((f: CalculatorFixture) => f.name === name);
}

export interface CalculatorServiceOptions {
  fetchProgramsOptions?: ProgramFetcherOptions;
  enableEquipmentValidation?: boolean;
}

export interface EquipmentValidationResult {
  isEligible: boolean;
  meetsRequirements: boolean;
  errors: readonly string[];
  warnings: readonly string[];
  eligiblePrograms: readonly string[];
}

export class CalculatorService {
  private options: Required<CalculatorServiceOptions>;

  constructor(options: CalculatorServiceOptions = {}) {
    this.options = {
      fetchProgramsOptions: options.fetchProgramsOptions ?? DEFAULT_OPTIONS,
      enableEquipmentValidation: options.enableEquipmentValidation ?? true,
    };
  }

  async calculateForPostalCode(
    postalCode: string,
    category: ProgramQuery["category"],
    projectCost: number,
    country: Country,
    householdIncome?: number,
    estimatedTaxLiability?: number,
  ): Promise<{
    programs: EligibleProgram[];
    calculation: unknown;
    equipmentValidation: EquipmentValidationResult | null;
  }> {
    const { fetchProgramsOptions, enableEquipmentValidation } = this.options;

    const jurisdiction = this.inferJurisdiction(postalCode, country);
    const programs = await fetchPrograms(
      { country, category, postalCode, jurisdiction },
      fetchProgramsOptions,
    );

    if (programs.length === 0) {
      return {
        programs: [],
        calculation: null,
        equipmentValidation: null,
      };
    }

    const { calculateNetCost } = await import("../calculate.js");
    const calculation = calculateNetCost({
      stickerPrice: projectCost,
      programs,
      country,
      householdIncome,
      estimatedTaxLiability,
    });

    let equipmentValidation: EquipmentValidationResult | null = null;
    if (enableEquipmentValidation && programs.length > 0) {
      const { EQUIPMENT_REQUIREMENTS } = await import("../equipment.js");
      const programCodes = programs.map((p: EligibleProgram) => p.code ?? "").filter(Boolean);

      const allErrors: string[] = [];
      const allWarnings: string[] = [];

      for (const code of programCodes) {
        const req = EQUIPMENT_REQUIREMENTS[code];
        if (req) {
          allWarnings.push(`Program ${code} has equipment requirements - verify eligibility`);
        }
      }

      equipmentValidation = {
        isEligible: allErrors.length === 0,
        meetsRequirements: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings,
        eligiblePrograms: programCodes,
      };
    }

    return { programs, calculation, equipmentValidation };
  }

  private inferJurisdiction(postalCode: string, country: Country): string {
    if (country === "US") {
      const state = postalCode.substring(0, 2).toUpperCase();
      return `US-${state}`;
    }
    if (country === "UK") {
      const area = postalCode.substring(0, 2).toUpperCase();
      return `UK-${area}`;
    }
    if (country === "AU") {
      const state = postalCode.substring(0, 1).toUpperCase();
      return `AU-${state}`;
    }
    if (country === "CA") {
      const province = postalCode.substring(0, 2).toUpperCase();
      return `CA-${province}`;
    }
    return country;
  }
}

export const defaultCalculatorService = new CalculatorService();
