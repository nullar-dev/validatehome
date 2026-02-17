import type {
  CanonicalBenefit,
  CanonicalEligibilityRule,
  CanonicalProgram,
  ValidationIssue,
  ValidationResult,
} from "../types/canonical.js";

function addIssue(
  issues: ValidationIssue[],
  field: string,
  severity: "error" | "warning",
  message: string,
  code: string,
): void {
  issues.push({ field, severity, message, code });
}

function validateRequiredField(
  value: string | null | undefined,
  fieldName: string,
  issues: ValidationIssue[],
  code: string,
): void {
  if (!value || (typeof value === "string" && value.trim().length === 0)) {
    addIssue(issues, fieldName, "error", `${fieldName} is required`, code);
  }
}

function validateNumericField(
  value: string | null | undefined,
  fieldName: string,
  issues: ValidationIssue[],
): void {
  if (value && Number.isNaN(Number.parseFloat(value))) {
    addIssue(issues, fieldName, "error", `${fieldName} must be a valid number`, "INVALID_BUDGET");
  }
}

export function validateProgram(
  program: CanonicalProgram,
  options?: { referenceDate?: Date },
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const referenceDate = options?.referenceDate ?? new Date();

  validateRequiredField(program.name, "name", issues, "MISSING_NAME");
  validateRequiredField(program.slug, "slug", issues, "MISSING_SLUG");
  validateRequiredField(program.jurisdictionId, "jurisdictionId", issues, "MISSING_JURISDICTION");
  validateNumericField(program.budgetTotal, "budgetTotal", issues);
  validateNumericField(program.budgetRemaining, "budgetRemaining", issues);

  if (program.endDate && program.startDate && program.endDate < program.startDate) {
    issues.push({
      field: "endDate",
      severity: "error",
      message: "End date cannot be before start date",
      code: "INVALID_DATE_RANGE",
    });
  }

  if (program.applicationDeadline && program.applicationDeadline < referenceDate) {
    issues.push({
      field: "applicationDeadline",
      severity: "warning",
      message: "Application deadline is in the past",
      code: "PAST_DEADLINE",
    });
  }

  if (program.confidence.overall < 0.3) {
    issues.push({
      field: "confidence",
      severity: "warning",
      message: `Very low confidence score: ${program.confidence.overall.toFixed(2)}`,
      code: "LOW_CONFIDENCE",
    });
  }

  const canAutoFix = issues
    .filter((i) => i.severity === "error")
    .every((i) => ["MISSING_NAME", "MISSING_SLUG", "MISSING_JURISDICTION"].includes(i.code));

  return {
    isValid: issues.filter((i) => i.severity === "error").length === 0,
    issues,
    canAutoFix,
    autoFixActions: canAutoFix
      ? ["Generate slug from name if missing", "Set default jurisdiction if missing"]
      : undefined,
  };
}

export function validateBenefit(benefit: CanonicalBenefit): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!benefit.type) {
    issues.push({
      field: "type",
      severity: "error",
      message: "Benefit type is required",
      code: "MISSING_TYPE",
    });
  }

  if (!benefit.currency) {
    issues.push({
      field: "currency",
      severity: "error",
      message: "Currency is required",
      code: "MISSING_CURRENCY",
    });
  }

  if (benefit.percentage !== null && (benefit.percentage < 0 || benefit.percentage > 100)) {
    issues.push({
      field: "percentage",
      severity: "error",
      message: "Percentage must be between 0 and 100",
      code: "INVALID_PERCENTAGE",
    });
  }

  return {
    isValid: issues.filter((i) => i.severity === "error").length === 0,
    issues,
    canAutoFix: false,
  };
}

export function validateEligibilityRule(rule: CanonicalEligibilityRule): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!rule.ruleType) {
    issues.push({
      field: "ruleType",
      severity: "error",
      message: "Eligibility rule type is required",
      code: "MISSING_RULE_TYPE",
    });
  }

  if (!rule.criteriaJson || Object.keys(rule.criteriaJson).length === 0) {
    issues.push({
      field: "criteriaJson",
      severity: "warning",
      message: "Eligibility criteria is empty",
      code: "EMPTY_CRITERIA",
    });
  }

  return {
    isValid: issues.filter((i) => i.severity === "error").length === 0,
    issues,
    canAutoFix: false,
  };
}

export function validateAll(
  program: CanonicalProgram,
  benefits: CanonicalBenefit[],
  eligibilityRules: CanonicalEligibilityRule[],
): ValidationResult {
  const allIssues: ValidationIssue[] = [];

  const programValidation = validateProgram(program);
  allIssues.push(...programValidation.issues);

  for (let i = 0; i < benefits.length; i++) {
    const benefit = benefits[i];
    if (!benefit) continue;
    const benefitValidation = validateBenefit(benefit);
    benefitValidation.issues.forEach((issue) => {
      allIssues.push({
        ...issue,
        field: `benefits[${i}].${issue.field}`,
      });
    });
  }

  for (let i = 0; i < eligibilityRules.length; i++) {
    const rule = eligibilityRules[i];
    if (!rule) continue;
    const ruleValidation = validateEligibilityRule(rule);
    ruleValidation.issues.forEach((issue) => {
      allIssues.push({
        ...issue,
        field: `eligibilityRules[${i}].${issue.field}`,
      });
    });
  }

  return {
    isValid: allIssues.filter((i) => i.severity === "error").length === 0,
    issues: allIssues,
    canAutoFix: programValidation.canAutoFix,
  };
}
