import { isIP } from "node:net";

const BLOCKED_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

function isPrivateIpv4(value: string): boolean {
  const parts = value.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const a = parts[0] ?? -1;
  const b = parts[1] ?? -1;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

function isBlockedHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replaceAll(/^\[|\]$/g, "");
  if (BLOCKED_HOSTNAMES.has(normalized)) {
    return true;
  }
  if (normalized.endsWith(".local") || normalized.endsWith(".internal")) {
    return true;
  }

  const ipType = isIP(normalized);
  if (ipType === 4) {
    return isPrivateIpv4(normalized);
  }
  if (ipType === 6) {
    return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd");
  }
  return false;
}

export function validateCrawlUrl(url: string, allowedHost: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid source URL");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Unsupported URL protocol");
  }

  if (isBlockedHost(parsed.hostname)) {
    throw new Error("Blocked host for crawler policy");
  }

  const parsedHost = parsed.hostname.toLowerCase().replaceAll(/^\[|\]$/g, "");
  const allowlistedHost = allowedHost.toLowerCase().replaceAll(/^\[|\]$/g, "");

  if (parsedHost !== allowlistedHost) {
    throw new Error("URL host mismatch with allowlisted source host");
  }
}
