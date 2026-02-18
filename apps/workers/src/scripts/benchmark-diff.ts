import { type DiffBenchmarkSample, evaluateDiffBenchmark } from "../pipeline/diff-runner.js";

const samples: DiffBenchmarkSample[] = [
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
];

const outcome = evaluateDiffBenchmark(samples);
process.stdout.write(`${JSON.stringify(outcome)}\n`);

if (outcome.precision < 0.95 || outcome.recall < 0.9) {
  process.exitCode = 1;
}
