import { describe, expect, it } from "vitest";
import { validateCrawlUrl } from "../pipeline/security.js";

function buildIpv4(octets: readonly number[]): string {
  return octets.join(".");
}

function buildIpv6(segments: readonly number[]): string {
  return segments.map((segment) => segment.toString(16)).join(":");
}

function buildMappedIpv6(octets: readonly number[]): string {
  const mappedPrefix = ["", "", "ffff"].join(":");
  return `${mappedPrefix}:${buildIpv4(octets)}`;
}

function buildMappedIpv6HexSuffix(words: readonly number[]): string {
  const mappedPrefix = ["", "", "ffff"].join(":");
  const suffix = words.map((word) => word.toString(16)).join(":");
  return `${mappedPrefix}:${suffix}`;
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
    const ip0 = buildIpv4([0x0, 1, 2, 3]);
    const ip10 = buildIpv4([0xa, 0, 0, 0x8]);
    const ip172 = buildIpv4([0xac, 0x10, 0, 4]);
    const ip192 = buildIpv4([0xc0, 0xa8, 1, 2]);

    expect(() => validateCrawlUrl(`https://${ip0}/a`, ip0)).toThrow(
      "Blocked host for crawler policy",
    );
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
    const privateIpv6 = buildIpv6([0xfd12, 0, 0, 0, 0, 0, 0, 1]);
    const linkLocalIpv6 = buildIpv6([0xfe80, 0, 0, 0, 0, 0, 0, 1]);
    const mappedPrivateIpv6 = buildMappedIpv6([0xa, 0, 0, 4]);
    const mappedPrivateIpv6Url = `https://[${mappedPrivateIpv6}]/a`;
    const mappedPrivateIpv6Host = new URL(mappedPrivateIpv6Url).hostname;

    expect(() => validateCrawlUrl(`https://[${privateIpv6}]/a`, privateIpv6)).toThrow(
      "Blocked host for crawler policy",
    );
    expect(() => validateCrawlUrl(`https://[${linkLocalIpv6}]/a`, linkLocalIpv6)).toThrow(
      "Blocked host for crawler policy",
    );
    expect(() => validateCrawlUrl(mappedPrivateIpv6Url, mappedPrivateIpv6Host)).toThrow(
      "Blocked host for crawler policy",
    );
  });

  it("allows public ipv4-mapped ipv6 host", () => {
    const mappedPublicIpv6 = buildMappedIpv6HexSuffix([0xc633, 0x6401]);
    const mappedPublicIpv6Url = `https://[${mappedPublicIpv6}]/a`;
    const mappedPublicIpv6Host = new URL(mappedPublicIpv6Url).hostname;

    expect(() => validateCrawlUrl(mappedPublicIpv6Url, mappedPublicIpv6Host)).not.toThrow();
  });

  it("allows invalid ipv4-mapped ipv6 forms when host matches", () => {
    const weirdMappedUrl = `https://[${buildMappedIpv6HexSuffix([0xabcd])}]/a`;
    const weirdMappedHost = new URL(weirdMappedUrl).hostname;

    expect(() => validateCrawlUrl(weirdMappedUrl, weirdMappedHost)).not.toThrow();
  });

  it("allows public host", () => {
    expect(() => validateCrawlUrl("https://public.example/path", "public.example")).not.toThrow();
  });
});
