import { URL } from "node:url";
import postgres from "postgres";
import { loadDotEnvIfPresent } from "../utils/load-env.js";

const DEFAULT_TIMEOUT_MS = 4000;

const output = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

const outputError = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

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
