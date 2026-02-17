import type { Country } from "@validatehome/shared";
import type {
  ConfidenceScore,
  ExtractedField,
  ExtractionResult,
  ProvenanceData,
  RawProgramData,
  RawSource,
} from "../types/extraction.js";

export const EXTRACTOR_VERSION = "1.0.0";

export interface ExtractorConfig {
  readonly sourceType: "webpage" | "pdf" | "api_endpoint";
  readonly country: Country;
  readonly selectors?: Record<string, string>;
}

export interface Extractor<T extends RawProgramData = RawProgramData> {
  readonly config: ExtractorConfig;
  readonly version: string;
  extract(source: RawSource): Promise<ExtractionResult<T>>;
}

export abstract class BaseExtractor implements Extractor {
  abstract readonly config: ExtractorConfig;
  readonly version: string = EXTRACTOR_VERSION;

  abstract extract(source: RawSource): Promise<ExtractionResult<RawProgramData>>;

  protected createProvenance(
    source: RawSource,
    transformationRules: readonly string[],
  ): ProvenanceData {
    return {
      sourceUrl: source.url,
      sourceType: source.type,
      country: source.country,
      fetchedAt: source.fetchedAt,
      normalizedAt: new Date(),
      extractorVersion: this.version,
      transformationRules,
    };
  }

  protected calculateFieldConfidence(field: ExtractedField): number {
    if (field.errors && field.errors.length > 0) {
      return Math.max(0, field.confidence - field.errors.length * 0.2);
    }
    return field.confidence;
  }

  protected calculateOverallConfidence(
    fields: Record<string, ExtractedField>,
    thresholds: { minConfidence: number; requiredFields: readonly string[] },
  ): ConfidenceScore {
    const fieldScores: Record<string, number> = {};
    let totalScore = 0;
    let fieldCount = 0;
    const reviewReasons: string[] = [];

    for (const [fieldName, field] of Object.entries(fields)) {
      const score = this.calculateFieldConfidence(field);
      fieldScores[fieldName] = score;
      totalScore += score;
      fieldCount++;

      if (score < thresholds.minConfidence) {
        reviewReasons.push(`Field '${fieldName}' has low confidence: ${score.toFixed(2)}`);
      }
    }

    if (thresholds.requiredFields.length > 0) {
      const missingRequired = thresholds.requiredFields.filter((f) => !fields[f]?.value);
      if (missingRequired.length > 0) {
        reviewReasons.push(`Missing required fields: ${missingRequired.join(", ")}`);
      }
    }

    const overall = fieldCount > 0 ? totalScore / fieldCount : 0;
    const requiresManualReview = overall < thresholds.minConfidence || reviewReasons.length > 0;

    return {
      overall,
      fields: fieldScores,
      requiresManualReview,
      reviewReasons: reviewReasons.length > 0 ? reviewReasons : undefined,
    };
  }

  protected createExtractedField(
    value: string | null,
    rawValue: string | null,
    confidence: number,
    sourceSelector?: string,
    errors?: readonly string[],
  ): ExtractedField {
    return {
      value,
      confidence,
      sourceSelector,
      rawValue: rawValue ?? undefined,
      errors,
    };
  }
}
