import type { Source } from "@validatehome/db";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchSource,
  fetchSourceWithRetry,
  resetFetchHostState,
} from "../pipeline/fetch-client.js";
import { resetRobotsCache } from "../pipeline/robots.js";

const baseSource: Source = {
  id: "source-1",
  url: "https://example.gov/program",
  jurisdictionId: null,
  sourceType: "webpage",
  crawlFrequencyMs: 86_400_000,
  lastCrawlAt: null,
  etag: "etag-1",
  lastModifiedHeader: "Mon, 01 Jan 2026 00:00:00 GMT",
  isActive: true,
  metadata: { country: "US" },
  createdAt: new Date(),
  updatedAt: new Date(),
};

afterEach(() => {
  vi.restoreAllMocks();
  resetRobotsCache();
  resetFetchHostState();
});

describe("fetchSource", () => {
  it("returns notModified for 304", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response("User-agent: *\nDisallow:", {
            status: 200,
            headers: { "content-type": "text/plain" },
          }),
        )
        .mockResolvedValueOnce(new Response(null, { status: 304 })),
    );

    const result = await fetchSource(baseSource);
    expect(result.notModified).toBe(true);
    expect(result.statusCode).toBe(304);
  });

  it("returns body for 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response("User-agent: *\nDisallow:", {
            status: 200,
            headers: { "content-type": "text/plain" },
          }),
        )
        .mockResolvedValueOnce(
          new Response("<html><h1>Program</h1></html>", {
            status: 200,
            headers: { etag: "etag-2", "last-modified": "Tue, 02 Jan 2026 00:00:00 GMT" },
          }),
        ),
    );

    const result = await fetchSource(baseSource);
    expect(result.notModified).toBe(false);
    expect(result.content).toContain("Program");
    expect(result.etag).toBe("etag-2");
  });
});

describe("fetchSourceWithRetry", () => {
  it("retries transient failures and succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response("User-agent: *\nDisallow:", {
            status: 200,
            headers: { "content-type": "text/plain" },
          }),
        )
        .mockResolvedValueOnce(new Response("", { status: 500 }))
        .mockResolvedValueOnce(new Response("<html>ok</html>", { status: 200 })),
    );

    const result = await fetchSourceWithRetry(baseSource, 2);
    expect(result.statusCode).toBe(200);
    expect(result.content).toContain("ok");
  });
});
