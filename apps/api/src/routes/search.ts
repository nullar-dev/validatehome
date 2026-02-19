import type { CountryCode, Program } from "@validatehome/db";
import { jurisdictionRepo, programRepo } from "@validatehome/db";
import { createBadRequestProblem } from "@validatehome/shared";
import { Hono } from "hono";
import { db } from "../db.js";

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
      const filters: {
        country?: CountryCode;
        status?: "open" | "waitlist" | "reserved" | "funded" | "closed" | "coming_soon";
      } = {};

      if (country) {
        filters.country = country.toUpperCase() as CountryCode;
      }
      if (status) {
        filters.status = status as typeof filters.status;
      }

      const repo = programRepo(db);
      const shouldFilterByQuery = q.trim().length > 0;
      const result = await repo.findAll(
        filters,
        shouldFilterByQuery ? { page: 1, limit: 1000 } : { page, limit },
      );
      const programs: Program[] = Array.isArray(result) ? result : result.data;

      let filtered = programs;

      if (q) {
        const searchLower = q.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(searchLower) ||
            (p.description?.toLowerCase().includes(searchLower) ?? false),
        );
      }

      const paged = shouldFilterByQuery
        ? filtered.slice((page - 1) * limit, page * limit)
        : filtered;

      const jurisdictionRepoFn = jurisdictionRepo(db);
      const withJurisdiction = await Promise.all(
        paged.map(async (p) => {
          const j = await jurisdictionRepoFn.findById(p.jurisdictionId);
          return { ...p, jurisdiction: j };
        }),
      );

      return c.json({
        success: true,
        data: withJurisdiction,
        meta: {
          total: filtered.length,
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
      const repo = programRepo(db);
      const result = await repo.findAll({}, { page: 1, limit: 10 });
      const programs: Program[] = Array.isArray(result) ? result : result.data;

      const searchLower = q.toLowerCase();
      const suggestions = programs
        .filter((p) => p.name.toLowerCase().includes(searchLower))
        .slice(0, 5)
        .map((p) => ({ id: p.id, name: p.name, slug: p.slug }));

      return c.json({ success: true, data: suggestions });
    } catch {
      return c.json({ success: false, data: [], meta: { error: "Suggest failed" } }, 500);
    }
  });
