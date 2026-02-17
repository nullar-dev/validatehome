import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { URL } from "node:url";
import postgres from "postgres";

const DEFAULT_TIMEOUT_MS = 4000;

const output = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

const outputError = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

function loadDotEnvIfPresent(): void {
  const candidates = [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")];

  for (const filePath of candidates) {
    if (!existsSync(filePath)) {
      continue;
    }

    const raw = readFileSync(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex <= 0) {
        continue;
      }

      const key = trimmed.slice(0, equalsIndex).trim();
      if (!key || process.env[key] !== undefined) {
        continue;
      }

      const value = trimmed
        .slice(equalsIndex + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");
      process.env[key] = value;
    }
  }
}

function getDatabaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error(
      [
        "DATABASE_URL is not set.",
        "Set DATABASE_URL in your environment or .env file.",
        "Recommended local value:",
        "  postgresql://postgres:postgres@127.0.0.1:5432/validatehome",
      ].join("\n"),
    );
  }
  return value;
}

function validateUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("DATABASE_URL is not a valid URL.");
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must start with postgres:// or postgresql://");
  }

  if (!parsed.hostname) {
    throw new Error("DATABASE_URL is missing a hostname.");
  }

  return parsed;
}

async function checkConnection(databaseUrl: string): Promise<void> {
  const sql = postgres(databaseUrl, {
    connect_timeout: Math.ceil(DEFAULT_TIMEOUT_MS / 1000),
    max: 1,
    prepare: false,
    idle_timeout: 1,
  });

  try {
    await sql`select 1`;
  } finally {
    await sql.end({ timeout: 1 });
  }
}

function remediationHint(): string {
  return [
    "DB connectivity remediation:",
    "  1) Start local Postgres: pnpm db:up",
    "  2) Copy env template if needed: cp .env.example .env",
    "  3) Re-run: pnpm db:migrate && pnpm --filter @validatehome/db db:seed",
    "If Docker is unavailable, use a hosted Postgres (Neon/Supabase) and set DATABASE_URL.",
  ].join("\n");
}

async function main(): Promise<void> {
  loadDotEnvIfPresent();
  const databaseUrl = getDatabaseUrl();
  const parsed = validateUrl(databaseUrl);

  output(`Checking DB connectivity: ${parsed.hostname}:${parsed.port || "5432"}${parsed.pathname}`);
  await checkConnection(databaseUrl);
  output("Database connection OK");
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  outputError(`Database check failed: ${message}`);
  outputError(remediationHint());
  process.exitCode = 1;
}
