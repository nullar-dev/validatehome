import { slugify } from "@validatehome/shared";
import type {
  CanonicalBenefit,
  CanonicalEligibilityRule,
  CanonicalProgram,
  ValidationIssue,
  ValidationResult,
} from "../types/canonical.js";
import type {
  ConfidenceScore,
  ExtractionResult,
  NormalizationOptions,
  RawProgramData,
} from "../types/extraction.js";
import { validateProgram } from "../validators/index.js";

export class Transformer {
  private options: NormalizationOptions;

  constructor(options: NormalizationOptions = {}) {
    this.options = {
      strictMode: false,
      requireMinimumConfidence: 0.5,
      enableDeduplication: true,
      ...options,
    };
  }

  async transform(extraction: ExtractionResult<RawProgramData>): Promise<{
    canonical?: CanonicalProgram;
    validation: ValidationResult;
    benefits: CanonicalBenefit[];
    eligibilityRules: CanonicalEligibilityRule[];
  }> {
    if (!extraction.success || !extraction.data) {
      return {
        validation: {
          isValid: false,
          issues: extraction.errors.map((e) => ({
            field: "extraction",
            severity: "error",
            message: e,
            code: "EXTRACTION_FAILED",
          })),
          canAutoFix: false,
        },
        benefits: [],
        eligibilityRules: [],
      };
    }

    const raw = extraction.data;
    const issues: ValidationIssue[] = [];

    const confidence = this.calculateConfidence(raw);

    if (
      this.options.requireMinimumConfidence &&
      confidence.overall < this.options.requireMinimumConfidence
    ) {
      issues.push({
        field: "overall",
        severity: "warning",
        message: `Overall confidence (${confidence.overall.toFixed(2)}) below minimum (${this.options.requireMinimumConfidence})`,
        code: "LOW_CONFIDENCE",
      });
    }

    const canonical = this.buildCanonicalProgram(raw, confidence, extraction.provenance);
    const validation = validateProgram(canonical);

    issues.push(...validation.issues);

    const benefits = raw.benefits.map((b) => this.transformBenefit(b, raw.sourceId));
    const eligibilityRules = raw.eligibilityRules.map((e) =>
      this.transformEligibilityRule(e, raw.sourceId),
    );

    return {
      canonical,
      validation: {
        isValid: validation.isValid && issues.filter((i) => i.severity === "error").length === 0,
        issues,
        canAutoFix: validation.canAutoFix,
        autoFixActions: validation.autoFixActions,
      },
      benefits,
      eligibilityRules,
    };
  }

  private calculateConfidence(raw: RawProgramData): ConfidenceScore {
    const fieldScores: Record<string, number> = {};
    let totalScore = 0;
    let fieldCount = 0;

    const fieldList = [
      raw.name,
      raw.jurisdictionName,
      raw.status,
      raw.description,
      raw.url,
      raw.budgetTotal,
      raw.budgetRemaining,
      raw.startDate,
      raw.endDate,
      raw.applicationDeadline,
    ];

    for (const field of fieldList) {
      if (field) {
        const score = field.confidence;
        fieldScores[field.sourceSelector ?? "unknown"] = score;
        totalScore += score;
        fieldCount++;
      }
    }

    for (const benefit of raw.benefits) {
      const score = benefit.type.confidence;
      fieldScores["benefit.type"] = (fieldScores["benefit.type"] ?? 0) + score;
      totalScore += score;
      fieldCount++;
    }

    const overall = fieldCount > 0 ? totalScore / fieldCount : 0;
    const reviewReasons: string[] = [];

    const threshold = this.options.requireMinimumConfidence ?? 0.5;
    if (overall < threshold) {
      reviewReasons.push(`Overall confidence below threshold: ${overall.toFixed(2)}`);
    }

    if (!raw.name?.value) {
      reviewReasons.push("Missing program name");
    }

    if (!raw.jurisdictionName?.value) {
      reviewReasons.push("Missing jurisdiction");
    }

    return {
      overall,
      fields: fieldScores,
      requiresManualReview: reviewReasons.length > 0,
      reviewReasons: reviewReasons.length > 0 ? reviewReasons : undefined,
    };
  }

  private buildCanonicalProgram(
    raw: RawProgramData,
    confidence: ConfidenceScore,
    provenance: ExtractionResult<RawProgramData>["provenance"],
  ): CanonicalProgram {
    const name = raw.name.value ?? "Unknown Program";
    const slug = slugify(name);

    const budgetTotal = raw.budgetTotal.value
      ? parseFloat(raw.budgetTotal.value.replaceAll(",", ""))
      : null;
    const budgetRemaining = raw.budgetRemaining.value
      ? parseFloat(raw.budgetRemaining.value.replaceAll(",", ""))
      : null;

    let budgetPctUsed: number | null = null;
    if (budgetTotal && budgetRemaining !== null) {
      budgetPctUsed = Math.round(((budgetTotal - budgetRemaining) / budgetTotal) * 100);
    }

    return {
      jurisdictionId: raw.jurisdictionName.value ?? "unknown",
      name,
      slug: `${slug}-${provenance.country.toLowerCase()}`,
      description: raw.description.value ?? null,
      programUrl: raw.url.value ?? null,
      status: raw.status.value ?? "open",
      budgetTotal: raw.budgetTotal.value,
      budgetRemaining: raw.budgetRemaining.value,
      budgetPctUsed,
      startDate: raw.startDate.value ? this.parseDate(raw.startDate.value) : null,
      endDate: raw.endDate.value ? this.parseDate(raw.endDate.value) : null,
      applicationDeadline: raw.applicationDeadline.value
        ? this.parseDate(raw.applicationDeadline.value)
        : null,
      lastVerifiedAt: provenance.normalizedAt,
      canonicalSourceUrl: provenance.sourceUrl,
      metadata: {
        sourceId: raw.sourceId,
        extractedFields: Object.keys(raw),
      },
      confidence,
      provenance,
    };
  }

  private transformBenefit(
    raw: RawProgramData["benefits"][0],
    _sourceId: string,
  ): CanonicalBenefit {
    return {
      type: raw.type.value ?? "rebate",
      maxAmount: raw.maxAmount.value,
      percentage: raw.percentage.value,
      incomeCap: raw.incomeCap.value,
      perUnitAmount: raw.perUnitAmount.value,
      currency: raw.currency.value ?? "USD",
      description: raw.description.value ?? null,
      confidence: {
        overall: raw.type.confidence,
        fields: {
          type: raw.type.confidence,
          maxAmount: raw.maxAmount.confidence,
          percentage: raw.percentage.confidence,
          currency: raw.currency.confidence,
        },
        requiresManualReview: raw.type.confidence < 0.5,
      },
    };
  }

  private transformEligibilityRule(
    raw: RawProgramData["eligibilityRules"][0],
    _sourceId: string,
  ): CanonicalEligibilityRule {
    return {
      ruleType: raw.ruleType.value ?? "property_type",
      criteriaJson: raw.criteria.value ?? {},
      description: raw.description.value ?? null,
      confidence: {
        overall: raw.ruleType.confidence,
        fields: {
          ruleType: raw.ruleType.confidence,
          criteria: raw.criteria.confidence,
        },
        requiresManualReview: raw.ruleType.confidence < 0.5,
      },
    };
  }

  private parseDate(value: string): Date | null {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
