import { apiKeyRepo } from "@validatehome/db";
import { createInternalErrorProblem, createUnauthorizedProblem } from "@validatehome/shared";
import type { Context } from "hono";
import { db } from "../db.js";

export interface ApiKeyContext {
  apiKey: {
    id: string;
    customerName: string;
    tier: "free" | "pro" | "enterprise";
    rateLimit: number;
    monthlyQuota: number;
    lastUsedAt: Date | null;
  } | null;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function apiKeyMiddleware(c: Context, next: () => Promise<void>) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const problem = createUnauthorizedProblem("Missing or invalid Authorization header");
    return c.json(problem, 401);
  }

  const apiKey = authHeader.slice(7);

  if (!apiKey || apiKey.length < 10) {
    const problem = createUnauthorizedProblem("Invalid API key format");
    return c.json(problem, 401);
  }

  try {
    const keyHash = await hashKey(apiKey);
    const repo = apiKeyRepo(db);
    const foundKey = await repo.findByHash(keyHash);

    if (!foundKey) {
      const problem = createUnauthorizedProblem("Invalid or inactive API key");
      return c.json(problem, 401);
    }

    await repo.touchLastUsed(foundKey.id);

    c.set("apiKey", {
      id: foundKey.id,
      customerName: foundKey.customerName,
      tier: foundKey.tier,
      rateLimit: foundKey.rateLimit,
      monthlyQuota: foundKey.monthlyQuota,
      lastUsedAt: foundKey.lastUsedAt,
    });

    await next();
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: auth middleware error visibility
    console.error("API key authentication failed", error);
    const problem = createInternalErrorProblem("Authentication service error");
    return c.json(problem, 500);
  }
}
