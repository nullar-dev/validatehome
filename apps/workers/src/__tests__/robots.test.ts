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

  it("fails open with timeout reason when robots request aborts", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

    const result = await checkRobotsPolicy("https://example.gov/anything");
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("Robots fetch timed out, fail-open policy");
  });

  it("applies disallow only to matching user-agent group", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          [
            "User-agent: some-other-bot",
            "Disallow: /blocked-for-others",
            "User-agent: *",
            "Disallow: /blocked-for-all",
          ].join("\n"),
          {
            status: 200,
            headers: { "content-type": "text/plain" },
          },
        ),
      ),
    );

    const blocked = await checkRobotsPolicy("https://example.gov/blocked-for-all/page");
    const allowed = await checkRobotsPolicy("https://example.gov/blocked-for-others/page");

    expect(blocked.allowed).toBe(false);
    expect(allowed.allowed).toBe(true);
  });

  it("supports wildcard and end-anchor disallow patterns", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          [
            "# comment should be ignored",
            "User-agent: ValidateHomeBot",
            "Disallow: /admin/*",
            "Disallow: /exact$",
            "MalformedLineWithoutColon",
          ].join("\n"),
          {
            status: 200,
            headers: { "content-type": "text/plain" },
          },
        ),
      ),
    );

    const wildcardBlocked = await checkRobotsPolicy("https://example.gov/admin/panel");
    const anchorBlocked = await checkRobotsPolicy("https://example.gov/exact");
    const anchorAllowed = await checkRobotsPolicy("https://example.gov/exact/child");

    expect(wildcardBlocked.allowed).toBe(false);
    expect(anchorBlocked.allowed).toBe(false);
    expect(anchorAllowed.allowed).toBe(true);
  });

  it("ignores excessively long robots patterns", async () => {
    const oversizedPattern = `/blocked/${"x".repeat(600)}`;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(["User-agent: *", `Disallow: ${oversizedPattern}`].join("\n"), {
          status: 200,
          headers: { "content-type": "text/plain" },
        }),
      ),
    );

    const result = await checkRobotsPolicy(`https://example.gov${oversizedPattern}`);
    expect(result.allowed).toBe(true);
  });
});
