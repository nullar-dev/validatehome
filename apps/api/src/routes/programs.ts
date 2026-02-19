import type { CountryCode, Program } from "@validatehome/db";
import { benefitRepo, jurisdictionRepo, programRepo } from "@validatehome/db";
import { programs } from "@validatehome/db/schema";
import {
  createBadRequestProblem,
  createForbiddenProblem,
  createNotFoundProblem,
} from "@validatehome/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db.js";
import { commonSchemas } from "../middleware/validation.js";

/**
 * Builds a record of field updates from the request body for program mutations.
 * Separates fields by type (string, numeric, date) for proper database updates.
 * @param body - The parsed request body
 * @returns A record of field names to updated values
 */
function buildProgramUpdates(body: Record<string, unknown>): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  const stringFields = ["name", "slug", "description", "status", "programUrl"];
  const numericFields = ["budgetTotal", "budgetRemaining", "budgetPctUsed"];

  for (const field of stringFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }
  for (const field of numericFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  if (body.startDate !== undefined)
    updates.startDate = body.startDate ? new Date(body.startDate as string) : null;
  if (body.endDate !== undefined)
    updates.endDate = body.endDate ? new Date(body.endDate as string) : null;
  if (body.applicationDeadline !== undefined) {
    updates.applicationDeadline = body.applicationDeadline
      ? new Date(body.applicationDeadline as string)
      : null;
  }

  return updates;
}

type ApiKeyContext = {
  id: string;
  tier: "free" | "pro" | "enterprise";
};

function getEnterpriseApiKey(c: { get: (key: string) => unknown }): ApiKeyContext | null {
  const apiKey = c.get("apiKey") as ApiKeyContext | undefined;
  if (!apiKey || apiKey.tier !== "enterprise") {
    return null;
  }
  return apiKey;
}

export const programRoutes = new Hono()
  .get("/", async (c) => {
    const jurisdiction = c.req.query("jurisdiction") as CountryCode | undefined;
    const status = c.req.query("status");
    const page = Math.max(1, Number(c.req.query("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(c.req.query("limit")) || 20));
    const search = c.req.query("search");

    if (jurisdiction && !["US", "UK", "AU", "CA"].includes(jurisdiction)) {
      const problem = createBadRequestProblem(
        "Invalid jurisdiction. Must be one of: US, UK, AU, CA",
      );
      return c.json(problem, 400);
    }

    if (
      status &&
      !["open", "waitlist", "reserved", "funded", "closed", "coming_soon"].includes(status)
    ) {
      const problem = createBadRequestProblem(
        "Invalid status. Must be one of: open, waitlist, reserved, funded, closed, coming_soon",
      );
      return c.json(problem, 400);
    }

    try {
      const filters: {
        country?: CountryCode;
        status?: "open" | "waitlist" | "reserved" | "funded" | "closed" | "coming_soon";
        search?: string;
      } = {};

      if (jurisdiction) {
        filters.country = jurisdiction;
      }
      if (status) {
        filters.status = status as
          | "open"
          | "waitlist"
          | "reserved"
          | "funded"
          | "closed"
          | "coming_soon";
      }
      if (search?.trim()) {
        filters.search = search.trim();
      }

      const repo = programRepo(db);
      const result = await repo.findAll(filters, { page, limit });

      let programs: Program[] = [];
      if (Array.isArray(result)) {
        programs = result as Program[];
      } else if ("data" in result) {
        programs = result.data;
      }

      const totalCount =
        !Array.isArray(result) && "total" in result ? result.total : programs.length;

      const meta = {
        total: totalCount,
        page,
        limit,
        filters: { jurisdiction, status, search },
      };

      return c.json({ success: true, data: programs, meta });
    } catch (_error) {
      return c.json({ success: false, data: [], meta: { error: "Failed to fetch programs" } }, 500);
    }
  })
  .get("/changes", async (c) => {
    const since = c.req.query("since");

    if (since && Number.isNaN(Date.parse(since))) {
      const problem = createBadRequestProblem(
        "Invalid 'since' parameter. Must be a valid ISO date string.",
      );
      return c.json(problem, 400);
    }

    try {
      const repo = programRepo(db);
      const sinceDate = since ? new Date(since) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const changes: Array<{
        id: string;
        slug: string;
        name: string;
        status: Program["status"];
        updatedAt: Date;
      }> = [];

      let pageNumber = 1;
      while (true) {
        const result = await repo.findAll(
          { updatedSince: sinceDate },
          { page: pageNumber, limit: 1000 },
        );
        const pageData: Program[] = Array.isArray(result) ? result : result.data;
        changes.push(
          ...pageData.map((p: Program) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            status: p.status,
            updatedAt: p.updatedAt,
          })),
        );

        if (Array.isArray(result) || pageNumber >= result.totalPages) {
          break;
        }
        pageNumber += 1;
      }

      return c.json({
        success: true,
        data: changes,
        meta: { since: sinceDate.toISOString(), count: changes.length },
      });
    } catch (_error) {
      return c.json({ success: false, data: [], meta: { error: "Failed to fetch changes" } }, 500);
    }
  })
  .get("/:idOrSlug", async (c) => {
    const idOrSlug = c.req.param("idOrSlug");

    if (!idOrSlug || idOrSlug.length === 0) {
      const problem = createBadRequestProblem("Program ID or slug is required");
      return c.json(problem, 400);
    }

    try {
      const repo = programRepo(db);

      let program: Program | undefined;

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );
      const isSlug = idOrSlug.includes("-") && !isUuid;

      if (isUuid) {
        program = await repo.findById(idOrSlug);
      } else if (isSlug) {
        const parts = idOrSlug.split("/");
        const slug = parts[parts.length - 1] ?? idOrSlug;
        program = await repo.findBySlug(slug);
      } else {
        program = await repo.findBySlug(idOrSlug);
      }

      if (!program) {
        const problem = createNotFoundProblem(`Program not found: ${idOrSlug}`);
        return c.json(problem, 404);
      }

      const jurisdictionRepoFn = jurisdictionRepo(db);
      const jurisdiction = await jurisdictionRepoFn.findById(program.jurisdictionId);

      const benefitRepoFn = benefitRepo(db);
      const benefits = await benefitRepoFn.findByProgram(program.id);

      return c.json({
        success: true,
        data: {
          ...program,
          jurisdiction: jurisdiction ?? null,
          benefits,
          eligibilityRules: [],
          categories: [],
        },
        meta: { id: idOrSlug },
      });
    } catch (_error) {
      return c.json(
        { success: false, data: null, meta: { error: "Failed to fetch program" } },
        500,
      );
    }
  })
  .get("/:id/history", async (c) => {
    const id = c.req.param("id");

    if (!id || id.length === 0) {
      const problem = createBadRequestProblem("Program ID is required");
      return c.json(problem, 400);
    }

    try {
      const repo = programRepo(db);
      const program = await repo.findById(id);

      if (!program) {
        const problem = createNotFoundProblem(`Program not found: ${id}`);
        return c.json(problem, 404);
      }

      const versions = await repo.findVersions(id);

      return c.json({
        success: true,
        data: versions,
        meta: { programId: id, count: versions.length },
      });
    } catch (_error) {
      return c.json(
        { success: false, data: [], meta: { error: "Failed to fetch program history" } },
        500,
      );
    }
  })
  .post("/", async (c) => {
    const apiKey = getEnterpriseApiKey(c);
    if (!apiKey) {
      return c.json(
        createForbiddenProblem("Enterprise tier is required for program mutations"),
        403,
      );
    }

    try {
      const parsed = commonSchemas.programCreate.safeParse(await c.req.json());
      if (!parsed.success) {
        return c.json(createBadRequestProblem("Invalid request body for program creation"), 400);
      }
      const body = parsed.data;
      const repo = programRepo(db);

      const program = await repo.create({
        name: body.name,
        slug: body.slug,
        jurisdictionId: body.jurisdictionId,
        description: body.description ?? null,
        status: body.status ?? "open",
        programUrl: body.programUrl ?? null,
        budgetTotal: body.budgetTotal ?? null,
        budgetRemaining: body.budgetRemaining ?? null,
        budgetPctUsed: body.budgetPctUsed ?? null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        applicationDeadline: body.applicationDeadline ? new Date(body.applicationDeadline) : null,
      });

      // biome-ignore lint/suspicious/noConsole: server-side audit trail
      console.info("Program created", {
        action: "program.create",
        actor: `apikey:${apiKey.id}`,
        programId: program.id,
      });

      return c.json({ success: true, data: program }, 201);
    } catch (_error) {
      return c.json(
        { success: false, data: null, meta: { error: "Failed to create program" } },
        500,
      );
    }
  })
  .put("/:id", async (c) => {
    const id = c.req.param("id");
    if (!id) {
      return c.json(createBadRequestProblem("Program ID is required"), 400);
    }

    const apiKey = getEnterpriseApiKey(c);
    if (!apiKey) {
      return c.json(
        createForbiddenProblem("Enterprise tier is required for program mutations"),
        403,
      );
    }

    try {
      const parsed = commonSchemas.programUpdate.safeParse(await c.req.json());
      if (!parsed.success) {
        return c.json(createBadRequestProblem("Invalid request body for program update"), 400);
      }
      const body = parsed.data;
      const repo = programRepo(db);
      const existing = await repo.findById(id);
      if (!existing) {
        return c.json(createNotFoundProblem(`Program not found: ${id}`), 404);
      }

      const updates = buildProgramUpdates(body);
      const program = await repo.update(id, updates);

      // biome-ignore lint/suspicious/noConsole: server-side audit trail
      console.info("Program updated", {
        action: "program.update",
        actor: `apikey:${apiKey.id}`,
        programId: id,
      });

      return c.json({ success: true, data: program });
    } catch (_error) {
      return c.json(
        { success: false, data: null, meta: { error: "Failed to update program" } },
        500,
      );
    }
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");

    if (!id) {
      const problem = createBadRequestProblem("Program ID is required");
      return c.json(problem, 400);
    }

    const apiKey = getEnterpriseApiKey(c);
    if (!apiKey) {
      return c.json(
        createForbiddenProblem("Enterprise tier is required for program mutations"),
        403,
      );
    }

    try {
      const repo = programRepo(db);

      const existing = await repo.findById(id);
      if (!existing) {
        const problem = createNotFoundProblem(`Program not found: ${id}`);
        return c.json(problem, 404);
      }

      await db.delete(programs).where(eq(programs.id, id));

      // biome-ignore lint/suspicious/noConsole: server-side audit trail
      console.info("Program deleted", {
        action: "program.delete",
        actor: `apikey:${apiKey.id}`,
        programId: id,
      });

      return c.json({ success: true, data: null });
    } catch (_error) {
      return c.json(
        { success: false, data: null, meta: { error: "Failed to delete program" } },
        500,
      );
    }
  });
