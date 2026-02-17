import type { Source } from "@validatehome/db";
import {
  HtmlExtractor,
  PdfExtractor,
  type RawSource,
  Transformer,
} from "@validatehome/normalization";

export interface ParseOutcome {
  readonly succeeded: boolean;
  readonly reviewRequired: boolean;
  readonly reviewReasons: readonly string[];
  readonly quality: {
    readonly requiredFieldCompleteness: number;
    readonly validationPass: boolean;
    readonly confidenceOverall: number;
  };
}

function computeCompleteness(params: {
  readonly extractionSucceeded: boolean;
  readonly name: string | undefined;
  readonly status: string | undefined;
  readonly jurisdictionId: string | undefined;
  readonly benefitsCount: number;
  readonly eligibilityCount: number;
}): number {
  const checks = [
    params.extractionSucceeded,
    Boolean(params.name && params.name !== "Unknown Program"),
    Boolean(params.status),
    Boolean(params.jurisdictionId && params.jurisdictionId !== "unknown"),
    params.benefitsCount > 0,
    params.eligibilityCount > 0,
  ];
  const passed = checks.filter(Boolean).length;
  return passed / checks.length;
}

function buildReviewReasons(result: {
  readonly validationErrors: number;
  readonly confidenceOverall: number;
  readonly completeness: number;
}): string[] {
  const reasons: string[] = [];
  if (result.validationErrors > 0) {
    reasons.push("VALIDATION_FAILED");
  }
  if (result.confidenceOverall < 0.75) {
    reasons.push("LOW_CONFIDENCE");
  }
  if (result.completeness < 0.95) {
    reasons.push("INCOMPLETE_REQUIRED_FIELDS");
  }
  return reasons;
}

export async function runParsePipeline(source: Source, rawContent: string): Promise<ParseOutcome> {
  const rawSource: RawSource = {
    id: source.id,
    url: source.url,
    type: source.sourceType,
    country:
      source.metadata && typeof source.metadata === "object" && "country" in source.metadata
        ? (source.metadata.country as RawSource["country"])
        : "US",
    fetchedAt: new Date(),
    rawContent,
  };

  const extractor = source.sourceType === "pdf" ? new PdfExtractor() : new HtmlExtractor();
  const extraction = await extractor.extract(rawSource);
  const transformer = new Transformer({ requireMinimumConfidence: 0.75 });
  const transformed = await transformer.transform(extraction);

  const canonical = transformed.canonical;
  const completeness = computeCompleteness({
    extractionSucceeded: extraction.success,
    name: canonical?.name,
    status: canonical?.status,
    jurisdictionId: canonical?.jurisdictionId,
    benefitsCount: transformed.benefits.length,
    eligibilityCount: transformed.eligibilityRules.length,
  });
  const validationErrors = transformed.validation.issues.filter(
    (issue) => issue.severity === "error",
  ).length;
  const confidenceOverall = canonical?.confidence.overall ?? 0;
  const reasons = buildReviewReasons({
    validationErrors,
    confidenceOverall,
    completeness,
  });

  return {
    succeeded: transformed.validation.isValid,
    reviewRequired: reasons.length > 0,
    reviewReasons: reasons,
    quality: {
      requiredFieldCompleteness: Number.parseFloat(completeness.toFixed(2)),
      validationPass: transformed.validation.isValid,
      confidenceOverall: Number.parseFloat(confidenceOverall.toFixed(2)),
    },
  };
}
