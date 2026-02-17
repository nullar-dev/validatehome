interface RobotsRuleSet {
  readonly disallow: string[];
}

interface RobotsCacheEntry {
  readonly fetchedAt: number;
  readonly rules: RobotsRuleSet;
}

const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, RobotsCacheEntry>();

export function resetRobotsCache(): void {
  cache.clear();
}

function patternToRegex(pattern: string): RegExp {
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

function parseRobots(content: string): RobotsRuleSet {
  const lines = content.split(/\r?\n/);
  const disallow: string[] = [];
  let inGlobalAgent = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const [rawKey, ...rawValue] = trimmed.split(":");
    if (!rawKey || rawValue.length === 0) {
      continue;
    }

    const key = rawKey.trim().toLowerCase();
    const value = rawValue.join(":").trim();
    if (key === "user-agent") {
      inGlobalAgent = value === "*" || value.toLowerCase() === "validatehomebot";
      continue;
    }
    if (inGlobalAgent && key === "disallow" && value) {
      disallow.push(value);
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
  try {
    const response = await fetch(robotsUrl, {
      headers: {
        "User-Agent": "ValidateHomeBot/1.0 (+https://validatehome.com/bot)",
      },
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
  } catch {
    cache.set(origin, { fetchedAt: now, rules: { disallow: [] } });
    return { allowed: true, reason: "Robots fetch failed, fail-open policy" };
  }
}
