import type { CountryCode, Program } from "@validatehome/db";
import { benefitRepo, createDb, jurisdictionRepo, programRepo } from "@validatehome/db";
import { programs } from "@validatehome/db/schema";
import { createBadRequestProblem, createNotFoundProblem } from "@validatehome/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

const db = createDb(process.env.DATABASE_URL ?? "postgresql://localhost:5432/validatehome");

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

      const repo = programRepo(db);
      const result = await repo.findAll(filters, { page, limit });

      let programs: Program[] = [];
      if (Array.isArray(result)) {
        programs = result as Program[];
      } else if ("data" in result) {
        programs = result.data;
      }

      let finalPrograms = programs;

      if (search && finalPrograms.length > 0) {
        const searchLower = search.toLowerCase();
        finalPrograms = finalPrograms.filter(
          (p: Program) =>
            p.name.toLowerCase().includes(searchLower) ||
            (p.description?.toLowerCase().includes(searchLower) ?? false),
        );
      }

      const totalCount =
        !Array.isArray(result) && "total" in result ? result.total : finalPrograms.length;

      const meta = {
        total: totalCount,
        page,
        limit,
        filters: { jurisdiction, status, search },
      };

      return c.json({ success: true, data: finalPrograms, meta });
    } catch (_error) {
      return c.json({ success: false, data: [], meta: { error: "Failed to fetch programs" } }, 500);
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

      const result = await repo.findAll({}, { page: 1, limit: 1000 });
      const allPrograms: Program[] = Array.isArray(result) ? (result as Program[]) : result.data;

      const changes = allPrograms
        .filter((p: Program) => p.updatedAt >= sinceDate)
        .map((p: Program) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          status: p.status,
          updatedAt: p.updatedAt,
        }));

      return c.json({
        success: true,
        data: changes,
        meta: { since: sinceDate.toISOString(), count: changes.length },
      });
    } catch (_error) {
      return c.json({ success: false, data: [], meta: { error: "Failed to fetch changes" } }, 500);
    }
  })
  .post("/", async (c) => {
    try {
      const body = await c.req.json();
      const repo = programRepo(db);

      if (!body.name || !body.slug || !body.jurisdictionId) {
        const problem = createBadRequestProblem("name, slug, and jurisdictionId are required");
        return c.json(problem, 400);
      }

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

    try {
      const body = await c.req.json();
      const repo = programRepo(db);
      const existing = await repo.findById(id);
      if (!existing) {
        return c.json(createNotFoundProblem(`Program not found: ${id}`), 404);
      }

      const updates = buildProgramUpdates(body);
      const program = await repo.update(id, updates);
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

    try {
      const repo = programRepo(db);

      const existing = await repo.findById(id);
      if (!existing) {
        const problem = createNotFoundProblem(`Program not found: ${id}`);
        return c.json(problem, 404);
      }

      await db.delete(programs).where(eq(programs.id, id));

      return c.json({ success: true, data: null });
    } catch (_error) {
      return c.json(
        { success: false, data: null, meta: { error: "Failed to delete program" } },
        500,
      );
    }
  });
