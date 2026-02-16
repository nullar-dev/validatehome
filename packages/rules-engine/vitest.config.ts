import { sharedConfig } from "@validatehome/config/vitest.shared";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(sharedConfig, defineConfig({}));
