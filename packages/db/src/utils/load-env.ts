import { resolve } from "node:path";

function loadEnvFileIfPresent(filePath: string): void {
  try {
    process.loadEnvFile(filePath);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
}

export function loadDotEnvIfPresent(baseDir: string = process.cwd()): void {
  const candidates = [resolve(baseDir, ".env"), resolve(baseDir, "../../.env")];
  for (const filePath of candidates) {
    loadEnvFileIfPresent(filePath);
  }
}
