import { describe, expect, it } from "vitest";
import { validateCrawlUrl } from "../pipeline/security.js";

describe("validateCrawlUrl", () => {
  it("allows matching https host", () => {
    expect(() => validateCrawlUrl("https://example.gov/program", "example.gov")).not.toThrow();
  });

  it("blocks localhost", () => {
    expect(() => validateCrawlUrl("http://localhost:3000", "localhost")).toThrow(
      "Blocked host for crawler policy",
    );
  });

  it("blocks host mismatch", () => {
    expect(() => validateCrawlUrl("https://evil.example.com", "example.com")).toThrow(
      "URL host mismatch with allowlisted source host",
    );
  });
});
