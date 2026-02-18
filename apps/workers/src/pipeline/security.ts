import { isIP } from "node:net";

const BLOCKED_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

function normalizeHostLiteral(value: string): string {
  return value.toLowerCase().replaceAll(/(?:^\[)|(?:\]$)/g, "");
}

function isPrivateIpv4(value: string): boolean {
  const parts = value.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const a = parts[0] ?? -1;
  const b = parts[1] ?? -1;
  if (a === 0) return true;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

function extractMappedIpv4(value: string): string | undefined {
  if (!value.startsWith("::ffff:")) {
    return undefined;
  }

  const mappedValue = value.slice(7);
  if (mappedValue.includes(".")) {
    return mappedValue;
  }

  const parts = mappedValue.split(":");
  if (parts.length !== 2) {
    return undefined;
  }

  const first = Number.parseInt(parts[0] ?? "", 16);
  const second = Number.parseInt(parts[1] ?? "", 16);
  if (
    !Number.isFinite(first) ||
    !Number.isFinite(second) ||
    first < 0 ||
    first > 0xffff ||
    second < 0 ||
    second > 0xffff
  ) {
    return undefined;
  }

  return `${(first >> 8) & 0xff}.${first & 0xff}.${(second >> 8) & 0xff}.${second & 0xff}`;
}

function isPrivateIpv6(value: string): boolean {
  const normalized = value.toLowerCase();
  if (normalized === "::" || normalized === "::1") {
    return true;
  }
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true;
  }

  const hextet = normalized.slice(0, 3);
  if (["fe8", "fe9", "fea", "feb"].includes(hextet)) {
    return true;
  }

  const mappedIpv4 = extractMappedIpv4(normalized);
  if (mappedIpv4) {
    return isPrivateIpv4(mappedIpv4);
  }

  return false;
}

function isBlockedHost(hostname: string): boolean {
  const normalized = normalizeHostLiteral(hostname);
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
    return isPrivateIpv6(normalized);
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

  const parsedHost = normalizeHostLiteral(parsed.hostname);
  const allowlistedHost = normalizeHostLiteral(allowedHost);

  if (parsedHost !== allowlistedHost) {
    throw new Error("URL host mismatch with allowlisted source host");
  }
}
