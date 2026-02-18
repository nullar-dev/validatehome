interface RobotsRuleSet {
  readonly disallow: string[];
}

interface RobotsCacheEntry {
  readonly fetchedAt: number;
  readonly rules: RobotsRuleSet;
}

const CACHE_TTL_MS = 60 * 60 * 1000;
const ROBOTS_TIMEOUT_MS = 5_000;
const MAX_ROBOTS_PATTERN_LENGTH = 512;
const cache = new Map<string, RobotsCacheEntry>();

export function resetRobotsCache(): void {
  cache.clear();
}

function patternToRegex(pattern: string): RegExp {
  if (pattern.length > MAX_ROBOTS_PATTERN_LENGTH) {
    return /^$/;
  }
  const endsWithAnchor = pattern.endsWith("$");
  const basePattern = endsWithAnchor ? pattern.slice(0, -1) : pattern;
  const escaped = basePattern.replaceAll(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*");
  return new RegExp(`^${escaped}${endsWithAnchor ? "$" : ""}`);
}

function isPathBlocked(pathname: string, disallowRules: readonly string[]): boolean {
  return disallowRules.some((rule) => {
    if (!rule) {
      return false;
    }
    return patternToRegex(rule).test(pathname);
  });
}

function parseDirective(
  line: string,
): { readonly key: string; readonly value: string } | undefined {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return undefined;
  }

  const [rawKey, ...rawValue] = trimmed.split(":");
  if (!rawKey || rawValue.length === 0) {
    return undefined;
  }

  return {
    key: rawKey.trim().toLowerCase(),
    value: rawValue.join(":").trim(),
  };
}

function isCrawlerUserAgent(value: string): boolean {
  return value === "*" || value.toLowerCase() === "validatehomebot";
}

function parseRobots(content: string): RobotsRuleSet {
  const lines = content.split(/\r?\n/);
  const disallow: string[] = [];
  let groupMatches = false;
  let sawDirective = false;

  for (const line of lines) {
    const directive = parseDirective(line);
    if (!directive) {
      continue;
    }

    if (directive.key === "user-agent") {
      if (sawDirective) {
        groupMatches = false;
        sawDirective = false;
      }
      if (isCrawlerUserAgent(directive.value)) {
        groupMatches = true;
      }
      continue;
    }

    sawDirective = true;
    if (groupMatches && directive.key === "disallow" && directive.value) {
      disallow.push(directive.value);
    }
  }

  return { disallow };
}

export async function checkRobotsPolicy(targetUrl: string): Promise<{
  readonly allowed: boolean;
  readonly reason: string;
}> {
  const url = new URL(targetUrl);
  const origin = url.origin;
  const now = Date.now();
  const cached = cache.get(origin);

  if (cached && now - cached.fetchedAt <= CACHE_TTL_MS) {
    const blocked = isPathBlocked(url.pathname, cached.rules.disallow);
    return {
      allowed: !blocked,
      reason: blocked ? "Blocked by robots (cache)" : "Allowed by robots (cache)",
    };
  }

  const robotsUrl = `${origin}/robots.txt`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ROBOTS_TIMEOUT_MS);
  try {
    const response = await fetch(robotsUrl, {
      headers: {
        "User-Agent": "ValidateHomeBot/1.0 (+https://validatehome.com/bot)",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      cache.set(origin, { fetchedAt: now, rules: { disallow: [] } });
      return { allowed: true, reason: `Robots unavailable (${response.status})` };
    }

    const content = await response.text();
    const rules = parseRobots(content);
    cache.set(origin, { fetchedAt: now, rules });
    const blocked = isPathBlocked(url.pathname, rules.disallow);
    return {
      allowed: !blocked,
      reason: blocked ? "Blocked by robots" : "Allowed by robots",
    };
  } catch (error) {
    cache.set(origin, { fetchedAt: now, rules: { disallow: [] } });
    if (error instanceof Error && error.name === "AbortError") {
      return { allowed: true, reason: "Robots fetch timed out, fail-open policy" };
    }
    return { allowed: true, reason: "Robots fetch failed, fail-open policy" };
  } finally {
    clearTimeout(timeoutId);
  }
}
