import type { DiffType } from "@validatehome/shared";

export interface DiffRecord {
  readonly diffType: DiffType;
  readonly significanceScore: number;
  readonly changesJson: Record<string, unknown>;
}

function normalizeContent(content: string): string {
  return content.replaceAll(/\s+/g, " ").trim().toLowerCase();
}

function tokenize(content: string): string[] {
  return normalizeContent(content)
    .split(/[^a-z0-9_]+/)
    .filter(Boolean);
}

function textDiffScore(previous: string, next: string): number {
  const prevTokens = new Set(tokenize(previous));
  const nextTokens = new Set(tokenize(next));

  if (prevTokens.size === 0 && nextTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of prevTokens) {
    if (nextTokens.has(token)) {
      overlap += 1;
    }
  }

  const union = new Set([...prevTokens, ...nextTokens]).size;
  const jaccardSimilarity = union === 0 ? 1 : overlap / union;
  return Math.round((1 - jaccardSimilarity) * 100);
}

function extractHighImpactSignals(content: string): {
  readonly status?: string;
  readonly budget?: string;
  readonly deadline?: string;
} {
  const lower = normalizeContent(content);
  const statusMatch = /(open|waitlist|reserved|funded|closed|coming soon|coming_soon)/.exec(lower);
  const budgetMatch = /(budget|funding|remaining)\D{0,15}(\d[\d,]*(?:\.\d{1,2})?)/.exec(lower);
  const deadlineMatch =
    /(deadline|expires|close[sd])\D{0,15}(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/.exec(
      lower,
    );

  return {
    status: statusMatch?.[1],
    budget: budgetMatch?.[2],
    deadline: deadlineMatch?.[2],
  };
}

export function buildDiffRecords(previous: string, next: string): DiffRecord[] {
  const textScore = textDiffScore(previous, next);
  const oldSignals = extractHighImpactSignals(previous);
  const newSignals = extractHighImpactSignals(next);

  const semanticDelta = ["status", "budget", "deadline"].reduce((score, key) => {
    const typedKey = key as keyof typeof oldSignals;
    return oldSignals[typedKey] !== newSignals[typedKey] ? score + 35 : score;
  }, 0);

  const visualScore = Math.min(100, Math.round(textScore * 0.75 + semanticDelta * 0.25));
  const semanticScore = Math.min(100, semanticDelta);

  return [
    {
      diffType: "text",
      significanceScore: textScore,
      changesJson: {
        oldSignals,
        newSignals,
        method: "token_jaccard",
      },
    },
    {
      diffType: "visual",
      significanceScore: visualScore,
      changesJson: {
        method: "render_profile_stable_v1",
        derivedFrom: "normalized_markup_similarity",
      },
    },
    {
      diffType: "semantic",
      significanceScore: semanticScore,
      changesJson: {
        changedFields: Object.entries(newSignals)
          .filter(([key, value]) => oldSignals[key as keyof typeof oldSignals] !== value)
          .map(([key]) => key),
      },
    },
  ];
}

export interface DiffBenchmarkSample {
  readonly previous: string;
  readonly next: string;
  readonly expectedHighImpactChange: boolean;
}

export function evaluateDiffBenchmark(samples: readonly DiffBenchmarkSample[]): {
  readonly precision: number;
  readonly recall: number;
} {
  let truePositive = 0;
  let falsePositive = 0;
  let falseNegative = 0;

  for (const sample of samples) {
    const records = buildDiffRecords(sample.previous, sample.next);
    const semantic = records.find((record) => record.diffType === "semantic");
    const predictedChange = (semantic?.significanceScore ?? 0) >= 35;

    if (predictedChange && sample.expectedHighImpactChange) truePositive += 1;
    if (predictedChange && !sample.expectedHighImpactChange) falsePositive += 1;
    if (!predictedChange && sample.expectedHighImpactChange) falseNegative += 1;
  }

  const precision =
    truePositive + falsePositive === 0 ? 1 : truePositive / (truePositive + falsePositive);
  const recall =
    truePositive + falseNegative === 0 ? 1 : truePositive / (truePositive + falseNegative);

  return {
    precision: Number.parseFloat(precision.toFixed(4)),
    recall: Number.parseFloat(recall.toFixed(4)),
  };
}
