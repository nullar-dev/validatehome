import { describe, expect, it } from "vitest";
import { buildDiffRecords, evaluateDiffBenchmark } from "../pipeline/diff-runner.js";

describe("diff runner", () => {
  it("builds three diff record types", () => {
    const records = buildDiffRecords(
      "status open budget 1000 deadline 2026-12-31",
      "status closed budget 500 deadline 2027-01-30",
    );
    expect(records).toHaveLength(3);
    expect(records.map((record) => record.diffType)).toEqual(["text", "visual", "semantic"]);
  });

  it("meets benchmark precision and recall thresholds", () => {
    const outcome = evaluateDiffBenchmark([
      {
        previous: "Program status open. Budget 100000. Deadline 2026-12-31",
        next: "Program status closed. Budget 100000. Deadline 2026-12-31",
        expectedHighImpactChange: true,
      },
      {
        previous: "Program status open. Budget 100000. Deadline 2026-12-31",
        next: "Program status open. Budget 100000. Deadline 2026-12-31. Footer updated",
        expectedHighImpactChange: false,
      },
      {
        previous: "Program status open. Budget 100000. Deadline 2026-12-31",
        next: "Program status open. Budget 50000. Deadline 2026-12-31",
        expectedHighImpactChange: true,
      },
      {
        previous: "Program status open. Budget 100000. Deadline 2026-12-31",
        next: "Program status open. Budget 100000. Deadline 2027-01-15",
        expectedHighImpactChange: true,
      },
    ]);

    expect(outcome.precision).toBeGreaterThanOrEqual(0.95);
    expect(outcome.recall).toBeGreaterThanOrEqual(0.9);
  });
});
