import type { Country } from "@validatehome/shared";

export interface HeatPumpSpec {
  copRating: number;
  heatingCapacity: number;
  seerRating: number;
  voltage: "115V" | "208V" | "230V";
  type: "air-source" | "ground-source" | "water-source";
  brand?: string;
  model?: string;
}

export interface SolarPanelSpec {
  efficiency: number;
  panelWatts: number;
  systemSize: number;
  panelCount: number;
  panelBrand?: string;
  inverterType: "string" | "microinverter" | "hybrid";
}

export interface InsulationSpec {
  type: "attic" | "wall" | "floor" | "spray-foam";
  rValue: number;
  areaSqft: number;
  material: "fiberglass" | "cellulose" | "spray-foam" | "mineral-wool";
}

export interface BatteryStorageSpec {
  capacityKwh: number;
  powerKw: number;
  chemistry: "li-ion" | "lifepo4" | "flow";
  brand?: string;
}

export interface EquipmentRequirement {
  category: "heat-pump" | "solar" | "insulation" | "battery" | "ev-charger";
  minCopRating?: number;
  minSeerRating?: number;
  maxSystemSizeKw?: number;
  minEfficiency?: number;
  minRValue?: number;
  minCapacityKwh?: number;
  eligibleBrands?: readonly string[];
  requiredCertifications?: readonly string[];
}

export interface ValidationResult {
  isEligible: boolean;
  meetsRequirements: boolean;
  errors: readonly string[];
  warnings: readonly string[];
  eligiblePrograms: readonly string[];
}

export const EQUIPMENT_REQUIREMENTS: Record<string, EquipmentRequirement> = {
  "US-25C": {
    category: "heat-pump",
    minCopRating: 3.2,
    minSeerRating: 15,
    requiredCertifications: ["AHRI", "ENERGY STAR"],
  },
  "US-25D": {
    category: "solar",
    minEfficiency: 15,
    maxSystemSizeKw: 100,
  },
  "UK-BUS": {
    category: "heat-pump",
    minCopRating: 2.5,
    requiredCertifications: ["MCS"],
  },
  "UK-ECO5": {
    category: "heat-pump",
    minCopRating: 2.5,
  },
  "AU-SOLAR-CREDITS": {
    category: "solar",
    minEfficiency: 15,
    maxSystemSizeKw: 100,
    requiredCertifications: ["CEC"],
  },
  "CA-GREENER-HOMES-HP": {
    category: "heat-pump",
    minCopRating: 3.0,
    minSeerRating: 14,
  },
  "CA-GREENER-HOMES-SOLAR": {
    category: "solar",
    minEfficiency: 15,
  },
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Equipment validation requires comprehensive checks
export function validateHeatPumpEligibility(
  spec: HeatPumpSpec,
  _country: Country,
  programCodes: readonly string[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const eligiblePrograms: string[] = [];

  for (const code of programCodes) {
    const req = EQUIPMENT_REQUIREMENTS[code];
    if (!req || req.category !== "heat-pump") continue;

    let meetsAll = true;

    if (req.minCopRating && spec.copRating < req.minCopRating) {
      errors.push(`COP rating ${spec.copRating} is below minimum ${req.minCopRating} for ${code}`);
      meetsAll = false;
    }

    if (req.minSeerRating && spec.seerRating < req.minSeerRating) {
      errors.push(
        `SEER rating ${spec.seerRating} is below minimum ${req.minSeerRating} for ${code}`,
      );
      meetsAll = false;
    }

    if (req.requiredCertifications) {
      for (const cert of req.requiredCertifications) {
        warnings.push(`Verify ${cert} certification for ${code} - system must be certified`);
      }
    }

    if (meetsAll) {
      eligiblePrograms.push(code);
    }
  }

  return {
    isEligible: errors.length === 0,
    meetsRequirements: eligiblePrograms.length > 0,
    errors,
    warnings,
    eligiblePrograms,
  };
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Equipment validation requires comprehensive checks
export function validateSolarEligibility(
  spec: SolarPanelSpec,
  _country: Country,
  programCodes: readonly string[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const eligiblePrograms: string[] = [];

  for (const code of programCodes) {
    const req = EQUIPMENT_REQUIREMENTS[code];
    if (!req || req.category !== "solar") continue;

    let meetsAll = true;

    if (req.minEfficiency && spec.efficiency < req.minEfficiency) {
      errors.push(
        `Panel efficiency ${spec.efficiency}% is below minimum ${req.minEfficiency}% for ${code}`,
      );
      meetsAll = false;
    }

    if (req.maxSystemSizeKw && spec.systemSize > req.maxSystemSizeKw) {
      errors.push(
        `System size ${spec.systemSize}kW exceeds maximum ${req.maxSystemSizeKw}kW for ${code}`,
      );
      meetsAll = false;
    }

    if (spec.systemSize < 1) {
      warnings.push(`Small system under 1kW may have reduced eligibility for ${code}`);
    }

    if (req.requiredCertifications) {
      warnings.push(`Verify ${req.requiredCertifications.join(", ")} certification for ${code}`);
    }

    if (meetsAll) {
      eligiblePrograms.push(code);
    }
  }

  return {
    isEligible: errors.length === 0,
    meetsRequirements: eligiblePrograms.length > 0,
    errors,
    warnings,
    eligiblePrograms,
  };
}

export function validateInsulationEligibility(
  spec: InsulationSpec,
  _country: Country,
  programCodes: readonly string[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const eligiblePrograms: string[] = [];

  for (const code of programCodes) {
    const req = EQUIPMENT_REQUIREMENTS[code];
    if (!req || req.category !== "insulation") continue;

    let meetsAll = true;

    if (req.minRValue && spec.rValue < req.minRValue) {
      errors.push(`R-value ${spec.rValue} is below minimum ${req.minRValue} for ${code}`);
      meetsAll = false;
    }

    if (spec.areaSqft > 10000) {
      warnings.push(`Large area over 10,000 sqft may require pre-approval for ${code}`);
    }

    if (meetsAll) {
      eligiblePrograms.push(code);
    }
  }

  return {
    isEligible: errors.length === 0,
    meetsRequirements: eligiblePrograms.length > 0,
    errors,
    warnings,
    eligiblePrograms,
  };
}

export function validateBatteryEligibility(
  spec: BatteryStorageSpec,
  _country: Country,
  programCodes: readonly string[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const eligiblePrograms: string[] = [];

  for (const code of programCodes) {
    const req = EQUIPMENT_REQUIREMENTS[code];
    if (!req || req.category !== "battery") continue;

    let meetsAll = true;

    if (req.minCapacityKwh && spec.capacityKwh < req.minCapacityKwh) {
      errors.push(
        `Battery capacity ${spec.capacityKwh}kWh is below minimum ${req.minCapacityKwh}kWh for ${code}`,
      );
      meetsAll = false;
    }

    if (spec.capacityKwh > 100) {
      warnings.push(`Large battery system over 100kWh may require special approval for ${code}`);
    }

    if (meetsAll) {
      eligiblePrograms.push(code);
    }
  }

  return {
    isEligible: errors.length === 0,
    meetsRequirements: eligiblePrograms.length > 0,
    errors,
    warnings,
    eligiblePrograms,
  };
}

export function validateEquipment(
  spec: HeatPumpSpec | SolarPanelSpec | InsulationSpec | BatteryStorageSpec,
  country: Country,
  programCodes: readonly string[],
): ValidationResult {
  if ("copRating" in spec) {
    return validateHeatPumpEligibility(spec, country, programCodes);
  }
  if ("efficiency" in spec && "panelWatts" in spec) {
    return validateSolarEligibility(spec, country, programCodes);
  }
  if ("rValue" in spec) {
    return validateInsulationEligibility(spec, country, programCodes);
  }
  if ("capacityKwh" in spec) {
    return validateBatteryEligibility(spec, country, programCodes);
  }
  return {
    isEligible: false,
    meetsRequirements: false,
    errors: ["Unknown equipment type"],
    warnings: [],
    eligiblePrograms: [],
  };
}

export function getEquipmentRequirements(programCode: string): EquipmentRequirement | undefined {
  return EQUIPMENT_REQUIREMENTS[programCode];
}

export function getAllRequirementsForCategory(
  category: EquipmentRequirement["category"],
): EquipmentRequirement[] {
  return Object.values(EQUIPMENT_REQUIREMENTS).filter((req) => req.category === category);
}
