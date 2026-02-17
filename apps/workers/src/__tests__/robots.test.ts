import { afterEach, describe, expect, it, vi } from "vitest";
import { checkRobotsPolicy, resetRobotsCache } from "../pipeline/robots.js";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  resetRobotsCache();
});

describe("checkRobotsPolicy", () => {
  it("blocks URL disallowed by robots", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("User-agent: *\nDisallow: /private", {
          status: 200,
          headers: { "content-type": "text/plain" },
        }),
      ),
    );

    const result = await checkRobotsPolicy("https://example.gov/private/page");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("Blocked by robots");
  });

  it("allows URL and then uses cache", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("User-agent: *\nDisallow: /private", {
        status: 200,
        headers: { "content-type": "text/plain" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const first = await checkRobotsPolicy("https://example.gov/public/page");
    const second = await checkRobotsPolicy("https://example.gov/public/again");

    expect(first.allowed).toBe(true);
    expect(second.reason).toBe("Allowed by robots (cache)");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fails open when robots endpoint is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not found", { status: 404 })));

    const result = await checkRobotsPolicy("https://example.gov/anything");
    expect(result.allowed).toBe(true);
    expect(result.reason).toContain("Robots unavailable");
  });

  it("fails open when robots fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network failure")));

    const result = await checkRobotsPolicy("https://example.gov/anything");
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("Robots fetch failed, fail-open policy");
  });
});
