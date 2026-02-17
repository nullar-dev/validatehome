import { defineConfig } from "drizzle-kit";
import { loadDotEnvIfPresent } from "./src/utils/load-env.ts";

loadDotEnvIfPresent();

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/validatehome",
  },
});
