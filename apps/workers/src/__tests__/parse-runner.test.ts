import type { Source } from "@validatehome/db";
import { describe, expect, it } from "vitest";
import { runParsePipeline } from "../pipeline/parse-runner.js";

const source: Source = {
  id: "source-1",
  url: "https://example.gov/program",
  jurisdictionId: null,
  sourceType: "webpage",
  crawlFrequencyMs: 86_400_000,
  lastCrawlAt: null,
  etag: null,
  lastModifiedHeader: null,
  isActive: true,
  metadata: { country: "US" },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("runParsePipeline", () => {
  it("routes low quality extraction to review", async () => {
    const outcome = await runParsePipeline(source, "<html><body>empty</body></html>");
    expect(outcome.reviewRequired).toBe(true);
    expect(outcome.reviewReasons.length).toBeGreaterThan(0);
  });

  it("computes quality scores", async () => {
    const outcome = await runParsePipeline(
      source,
      '<html><h1 class="program-title">Program A</h1><div class="program-status">open</div><div class="jurisdiction">Federal</div><div class="benefits">$1000 rebate</div><div class="eligibility">Homeowner</div></html>',
    );
    expect(outcome.quality.requiredFieldCompleteness).toBeGreaterThanOrEqual(0);
    expect(outcome.quality.requiredFieldCompleteness).toBeLessThanOrEqual(1);
  });
});
