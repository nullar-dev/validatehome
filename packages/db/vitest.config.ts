import { sharedConfig } from "@validatehome/config/vitest.shared";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      coverage: {
        exclude: [
          "src/schema/**", // Drizzle table declarations — configuration, not business logic
          "src/relations.ts", // Drizzle relation definitions — configuration
          "src/seed.ts", // Seed script — requires DB connection, tested via integration
        ],
      },
    },
  }),
);
