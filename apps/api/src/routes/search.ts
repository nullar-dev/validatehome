import type { Program } from "@validatehome/db";
import { jurisdictionRepo, programRepo } from "@validatehome/db";
import {
  createBadRequestProblem,
  createMeilisearchClient,
  searchPrograms,
} from "@validatehome/shared";
import { Hono } from "hono";
import { db } from "../db.js";

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST ?? "http://localhost:7700";
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY;

export const searchRoutes = new Hono()
  .get("/", async (c) => {
    const q = c.req.query("q") ?? "";
    const country = c.req.query("country");
    const status = c.req.query("status");
    const category = c.req.query("category");
    const page = Math.max(1, Number(c.req.query("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(c.req.query("limit")) || 20));

    if (country && !["US", "UK", "AU", "CA"].includes(country.toUpperCase())) {
      const problem = createBadRequestProblem("Invalid country. Must be one of: US, UK, AU, CA");
      return c.json(problem, 400);
    }

    if (
      status &&
      !["open", "waitlist", "reserved", "funded", "closed", "coming_soon"].includes(status)
    ) {
      const problem = createBadRequestProblem("Invalid status");
      return c.json(problem, 400);
    }

    try {
      const client = createMeilisearchClient({
        host: MEILISEARCH_HOST,
        apiKey: MEILISEARCH_API_KEY,
      });

      const filters: string[] = [];
      if (country) {
        filters.push(`country = "${country.toUpperCase()}"`);
      }
      if (status) {
        filters.push(`status = "${status}"`);
      }
      if (category) {
        filters.push(`categories = "${category}"`);
      }

      const results = await searchPrograms(
        client,
        {
          query: q,
          limit,
          offset: (page - 1) * limit,
          filter: filters.length > 0 ? filters : undefined,
        },
        "programs",
      );

      const normalized = results.hits.map((hit) => ({
        id: hit.id,
        name: hit.name,
        slug: hit.slug,
        description: hit.description,
        status: hit.status,
        jurisdiction: {
          name: hit.jurisdiction,
          country: hit.country,
        },
      }));

      return c.json({
        success: true,
        data: normalized,
        meta: {
          total: results.totalHits,
          page,
          limit,
          filters: { q, country, status, category },
        },
      });
    } catch (_error) {
      return c.json({ success: false, data: [], meta: { error: "Search failed" } }, 500);
    }
  })
  .get("/facets", async (c) => {
    try {
      const repo = programRepo(db);
      const result = await repo.findAll({}, { page: 1, limit: 1000 });
      const programs: Program[] = Array.isArray(result) ? result : result.data;

      const jurisdictionRepoFn = jurisdictionRepo(db);

      const countries = new Set<string>();
      const statuses = new Set<string>();

      for (const p of programs) {
        const j = await jurisdictionRepoFn.findById(p.jurisdictionId);
        if (j?.country) countries.add(j.country);
        statuses.add(p.status);
      }

      return c.json({
        success: true,
        data: {
          countries: Array.from(countries),
          statuses: Array.from(statuses),
          categories: ["heat-pump", "solar", "insulation", "battery", "ev-charger"],
        },
        meta: {},
      });
    } catch (_error) {
      return c.json({ success: false, data: null, meta: { error: "Failed to get facets" } }, 500);
    }
  })
  .get("/suggest", async (c) => {
    const q = c.req.query("q");

    if (!q || q.length < 2) {
      return c.json({ success: true, data: [] });
    }

    try {
      const client = createMeilisearchClient({
        host: MEILISEARCH_HOST,
        apiKey: MEILISEARCH_API_KEY,
      });
      const results = await searchPrograms(
        client,
        {
          query: q,
          limit: 5,
        },
        "programs",
      );
      const suggestions = results.hits.map((hit) => ({
        id: hit.id,
        name: hit.name,
        slug: hit.slug,
      }));

      return c.json({ success: true, data: suggestions });
    } catch {
      return c.json({ success: false, data: [], meta: { error: "Suggest failed" } }, 500);
    }
  });
