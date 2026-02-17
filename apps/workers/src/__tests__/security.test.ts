import { describe, expect, it } from "vitest";
import { validateCrawlUrl } from "../pipeline/security.js";

function ip(a: number, b: number, c: number, d: number): string {
  return [a, b, c, d].join(".");
}

describe("validateCrawlUrl", () => {
  it("allows matching https host", () => {
    expect(() => validateCrawlUrl("https://example.gov/program", "example.gov")).not.toThrow();
  });

  it("blocks localhost", () => {
    expect(() => validateCrawlUrl("https://localhost:3000", "localhost")).toThrow(
      "Blocked host for crawler policy",
    );
  });

  it("blocks host mismatch", () => {
    expect(() => validateCrawlUrl("https://evil.example.com", "example.com")).toThrow(
      "URL host mismatch with allowlisted source host",
    );
  });

  it("blocks invalid URL", () => {
    expect(() => validateCrawlUrl("not-a-url", "example.com")).toThrow("Invalid source URL");
  });

  it("blocks unsupported protocol", () => {
    expect(() => validateCrawlUrl("ftp://example.com/resource", "example.com")).toThrow(
      "Unsupported URL protocol",
    );
  });

  it("blocks private ipv4 ranges", () => {
    const ip10 = ip(10, 0, 0, 8);
    const ip172 = ip(172, 16, 0, 4);
    const ip192 = ip(192, 168, 1, 2);

    expect(() => validateCrawlUrl(`https://${ip10}/a`, ip10)).toThrow(
      "Blocked host for crawler policy",
    );
    expect(() => validateCrawlUrl(`https://${ip172}/a`, ip172)).toThrow(
      "Blocked host for crawler policy",
    );
    expect(() => validateCrawlUrl(`https://${ip192}/a`, ip192)).toThrow(
      "Blocked host for crawler policy",
    );
  });

  it("blocks local and internal hostnames", () => {
    expect(() => validateCrawlUrl("https://service.local/path", "service.local")).toThrow(
      "Blocked host for crawler policy",
    );
    expect(() => validateCrawlUrl("https://api.internal/path", "api.internal")).toThrow(
      "Blocked host for crawler policy",
    );
  });

  it("blocks private ipv6 ranges", () => {
    expect(() => validateCrawlUrl("https://[fd12::1]/a", "fd12::1")).toThrow(
      "Blocked host for crawler policy",
    );
  });

  it("allows public ipv4 host", () => {
    const publicIp = ip(8, 8, 8, 8);
    expect(() => validateCrawlUrl(`https://${publicIp}/path`, publicIp)).not.toThrow();
  });
});
