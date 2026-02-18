import type { Source } from "@validatehome/db";
import { checkRobotsPolicy } from "./robots.js";
import { validateCrawlUrl } from "./security.js";

interface HostState {
  readonly nextAllowedAt: number;
  readonly failureCount: number;
  readonly circuitOpenUntil: number;
}

const HOST_STATE = new Map<string, HostState>();
const REQUEST_DELAY_MS = 250;
const CIRCUIT_OPEN_MS = 60_000;
const MAX_HOST_FAILURES = 3;
const FETCH_TIMEOUT_MS = 30_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function readHostState(host: string): HostState {
  return (
    HOST_STATE.get(host) ?? {
      nextAllowedAt: 0,
      failureCount: 0,
      circuitOpenUntil: 0,
    }
  );
}

function updateHostState(host: string, state: HostState): void {
  HOST_STATE.set(host, state);
}

function isTransientFailure(error: Error): boolean {
  const maybeCode =
    typeof error === "object" && "code" in error ? (error.code as string | undefined) : undefined;
  if (maybeCode && ["ETIMEDOUT", "ECONNRESET", "ENETUNREACH", "EAI_AGAIN"].includes(maybeCode)) {
    return true;
  }
  if (error.name === "AbortError" || error.name === "TimeoutError") {
    return true;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes("timeout") ||
    message.includes("network") ||
    message.includes("fetch failed with status 5")
  );
}

async function applyHostRateLimits(host: string): Promise<void> {
  const now = Date.now();
  const current = readHostState(host);

  if (current.circuitOpenUntil > now) {
    throw new Error(
      `Fetch blocked by circuit breaker until ${new Date(current.circuitOpenUntil).toISOString()}`,
    );
  }

  if (current.nextAllowedAt > now) {
    await sleep(current.nextAllowedAt - now);
  }

  updateHostState(host, {
    ...current,
    nextAllowedAt: Date.now() + REQUEST_DELAY_MS,
  });
}

function markHostSuccess(host: string): void {
  const current = readHostState(host);
  updateHostState(host, {
    ...current,
    failureCount: 0,
    circuitOpenUntil: 0,
  });
}

function markHostFailure(host: string): void {
  const current = readHostState(host);
  const nextFailureCount = current.failureCount + 1;
  updateHostState(host, {
    ...current,
    failureCount: nextFailureCount,
    circuitOpenUntil: nextFailureCount >= MAX_HOST_FAILURES ? Date.now() + CIRCUIT_OPEN_MS : 0,
  });
}

export function resetFetchHostState(): void {
  HOST_STATE.clear();
}

function resolveAllowedHost(source: Source, parsedHost: string): string {
  if (source.metadata && typeof source.metadata === "object" && "allowedHost" in source.metadata) {
    const maybeAllowedHost = source.metadata.allowedHost;
    if (typeof maybeAllowedHost === "string" && maybeAllowedHost.trim().length > 0) {
      return maybeAllowedHost;
    }
  }
  return parsedHost;
}

async function fetchWithTimeout(
  url: string,
  options: Omit<RequestInit, "signal">,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Fetch timeout after ${FETCH_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface FetchResult {
  readonly statusCode: number;
  readonly content: string;
  readonly fetchedAt: Date;
  readonly etag?: string;
  readonly lastModified?: string;
  readonly notModified: boolean;
  readonly robotsReason: string;
}

export async function fetchSource(source: Source): Promise<FetchResult> {
  const parsed = new URL(source.url);
  const allowedHost = resolveAllowedHost(source, parsed.hostname);
  await applyHostRateLimits(parsed.hostname);
  validateCrawlUrl(source.url, allowedHost);

  const robots = await checkRobotsPolicy(source.url);
  if (!robots.allowed) {
    throw new Error(`Policy blocked: ${robots.reason}`);
  }

  const headers = new Headers();
  headers.set("User-Agent", "ValidateHomeBot/1.0 (+https://validatehome.com/bot)");
  if (source.etag) {
    headers.set("If-None-Match", source.etag);
  }
  if (source.lastModifiedHeader) {
    headers.set("If-Modified-Since", source.lastModifiedHeader);
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(source.url, {
      method: "GET",
      redirect: "follow",
      headers,
    });
  } catch (error) {
    markHostFailure(parsed.hostname);
    throw error;
  }

  if (response.status === 304) {
    markHostSuccess(parsed.hostname);
    return {
      statusCode: 304,
      content: "",
      fetchedAt: new Date(),
      etag: response.headers.get("etag") ?? undefined,
      lastModified: response.headers.get("last-modified") ?? undefined,
      notModified: true,
      robotsReason: robots.reason,
    };
  }

  if (!response.ok) {
    if (response.status >= 500) {
      markHostFailure(parsed.hostname);
    }
    throw new Error(`Fetch failed with status ${response.status}`);
  }

  const content = await response.text();
  markHostSuccess(parsed.hostname);
  return {
    statusCode: response.status,
    content,
    fetchedAt: new Date(),
    etag: response.headers.get("etag") ?? undefined,
    lastModified: response.headers.get("last-modified") ?? undefined,
    notModified: false,
    robotsReason: robots.reason,
  };
}

export async function fetchSourceWithRetry(source: Source, maxAttempts = 3): Promise<FetchResult> {
  let attempt = 1;
  let lastError: Error | undefined;

  while (attempt <= maxAttempts) {
    try {
      return await fetchSource(source);
    } catch (error) {
      const typedError = error instanceof Error ? error : new Error("Unknown fetch error");
      lastError = typedError;
      if (!isTransientFailure(typedError) || attempt >= maxAttempts) {
        break;
      }

      const backoffMs = 250 * 2 ** (attempt - 1);
      await sleep(backoffMs);
      attempt += 1;
    }
  }

  throw lastError ?? new Error("Fetch failed after retries");
}
