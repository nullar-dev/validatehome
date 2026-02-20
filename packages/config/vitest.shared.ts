import { defineConfig } from "vitest/config";

export const sharedConfig = defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        lines: 40,
        branches: 40,
        functions: 40,
        statements: 40,
      },
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/__tests__/**",
        "**/*.test.*",
        "**/*.spec.*",
      ],
    },
    passWithNoTests: true,
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    exclude: ["node_modules", "dist"],
  },
});
