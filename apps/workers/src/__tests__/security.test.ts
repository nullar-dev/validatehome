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

  it("blocks invalid URL", () => {
    expect(() => validateCrawlUrl("not-a-url", "example.com")).toThrow("Invalid source URL");
  });

  it("blocks unsupported protocol", () => {
    expect(() => validateCrawlUrl("ftp://example.com/resource", "example.com")).toThrow(
      "Unsupported URL protocol",
    );
  });

  it("blocks private ipv4 ranges", () => {
    expect(() => validateCrawlUrl("http://10.0.0.8/a", "10.0.0.8")).toThrow(
      "Blocked host for crawler policy",
    );
    expect(() => validateCrawlUrl("http://172.16.0.4/a", "172.16.0.4")).toThrow(
      "Blocked host for crawler policy",
    );
    expect(() => validateCrawlUrl("http://192.168.1.2/a", "192.168.1.2")).toThrow(
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
    expect(() => validateCrawlUrl("http://[fd12::1]/a", "fd12::1")).toThrow(
      "Blocked host for crawler policy",
    );
  });

  it("allows public ipv4 host", () => {
    expect(() => validateCrawlUrl("https://8.8.8.8/path", "8.8.8.8")).not.toThrow();
  });
});
