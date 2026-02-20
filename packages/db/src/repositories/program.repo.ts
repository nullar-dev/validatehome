import type { SQL } from "drizzle-orm";
import { and, desc, eq, sql } from "drizzle-orm";
import { benefits } from "../schema/benefit.js";
import { programCategories } from "../schema/category.js";
import { eligibilityRules } from "../schema/eligibility.js";
import { jurisdictions } from "../schema/jurisdiction.js";
import { programs, programVersions } from "../schema/program.js";
import type { CountryCode } from "./jurisdiction.repo.js";
import type { DbClient, PaginatedResult, PaginationOptions } from "./types.js";
import { paginate } from "./types.js";

export type Program = typeof programs.$inferSelect;
export type NewProgram = typeof programs.$inferInsert;
export type ProgramVersion = typeof programVersions.$inferSelect;

export interface ProgramFilters {
  country?: CountryCode;
  status?: Program["status"];
  categoryId?: string;
  search?: string;
  updatedSince?: Date;
}

function getProgramFilterConditions(filters?: ProgramFilters): SQL[] {
  const conditions: SQL[] = [];

  if (filters?.country) {
    conditions.push(eq(jurisdictions.country, filters.country));
  }
  if (filters?.status) {
    conditions.push(eq(programs.status, filters.status));
  }
  if (filters?.categoryId) {
    conditions.push(eq(programCategories.categoryId, filters.categoryId));
  }
  if (filters?.updatedSince) {
    conditions.push(sql`${programs.updatedAt} >= ${filters.updatedSince}`);
  }
  if (filters?.search && filters.search.trim().length > 0) {
    const q = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      sql`(
        lower(${programs.name}) like ${q}
        or lower(coalesce(${programs.description}, '')) like ${q}
      )`,
    );
  }

  return conditions;
}

export function programRepo(db: DbClient) {
  return {
    async findAll(
      filters?: ProgramFilters,
      options?: PaginationOptions,
    ): Promise<PaginatedResult<Program> | Program[]> {
      const conditions = getProgramFilterConditions(filters);
      const hasCountryFilter = Boolean(filters?.country);
      const hasCategoryFilter = Boolean(filters?.categoryId);

      let dataQuery = db.select({ program: programs }).from(programs).$dynamic();

      dataQuery = hasCountryFilter
        ? dataQuery.innerJoin(jurisdictions, eq(programs.jurisdictionId, jurisdictions.id))
        : dataQuery;

      dataQuery = hasCategoryFilter
        ? dataQuery.innerJoin(programCategories, eq(programCategories.programId, programs.id))
        : dataQuery;

      if (conditions.length > 0) {
        dataQuery = dataQuery.where(and(...conditions));
      }

      if (!options) {
        const rows = await dataQuery.orderBy(programs.name);
        return rows.map((r) => r.program);
      }

      const offset = (options.page - 1) * options.limit;
      let countQuery = db
        .select({ count: sql<number>`count(distinct ${programs.id})::int` })
        .from(programs)
        .$dynamic();

      countQuery = hasCountryFilter
        ? countQuery.innerJoin(jurisdictions, eq(programs.jurisdictionId, jurisdictions.id))
        : countQuery;

      countQuery = hasCategoryFilter
        ? countQuery.innerJoin(programCategories, eq(programCategories.programId, programs.id))
        : countQuery;

      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }

      const [rows, countResult] = await Promise.all([
        dataQuery.orderBy(programs.name).limit(options.limit).offset(offset),
        countQuery,
      ]);

      return paginate(
        rows.map((r) => r.program),
        countResult[0]?.count ?? 0,
        options,
      );
    },

    async findBySlug(first: string, second?: string): Promise<Program | undefined> {
      const isCountryCode = (value: string): value is CountryCode =>
        value === "US" || value === "UK" || value === "AU" || value === "CA";

      let slug: string;
      let country: CountryCode | undefined;

      if (!second) {
        slug = first;
      } else if (isCountryCode(first)) {
        country = first;
        slug = second;
      } else if (isCountryCode(second)) {
        slug = first;
        country = second;
      } else {
        slug = first;
      }

      if (!country) {
        const rows = await db.select().from(programs).where(eq(programs.slug, slug)).limit(1);
        return rows[0];
      }
      const rows = await db
        .select({ program: programs })
        .from(programs)
        .innerJoin(jurisdictions, eq(programs.jurisdictionId, jurisdictions.id))
        .where(and(eq(programs.slug, slug), eq(jurisdictions.country, country)))
        .limit(1);
      return rows[0]?.program;
    },

    async findById(id: string): Promise<
      | (Program & {
          benefits: (typeof benefits.$inferSelect)[];
          eligibilityRules: (typeof eligibilityRules.$inferSelect)[];
        })
      | undefined
    > {
      const programRows = await db.select().from(programs).where(eq(programs.id, id)).limit(1);
      if (programRows.length === 0) return undefined;

      const [benefitRows, ruleRows] = await Promise.all([
        db.select().from(benefits).where(eq(benefits.programId, id)),
        db.select().from(eligibilityRules).where(eq(eligibilityRules.programId, id)),
      ]);

      const program = programRows[0];
      if (!program) {
        return undefined;
      }

      return { ...program, benefits: benefitRows, eligibilityRules: ruleRows };
    },

    async findByJurisdiction(jurisdictionId: string): Promise<Program[]> {
      return db
        .select()
        .from(programs)
        .where(eq(programs.jurisdictionId, jurisdictionId))
        .orderBy(programs.name);
    },

    async create(data: NewProgram): Promise<Program> {
      const rows = await db.insert(programs).values(data).returning();
      const created = rows[0];
      if (!created) {
        throw new Error("Failed to create program");
      }
      return created;
    },

    async update(id: string, data: Partial<NewProgram>): Promise<Program> {
      const rows = await db
        .update(programs)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(programs.id, id))
        .returning();
      const updated = rows[0];
      if (!updated) {
        throw new Error(`Program not found: ${id}`);
      }
      return updated;
    },

    async createVersion(
      programId: string,
      data: Record<string, unknown>,
      changedFields?: string[],
      changedBy?: string,
    ): Promise<ProgramVersion> {
      const rows = await db
        .insert(programVersions)
        .values({ programId, data, changedFields, changedBy })
        .returning();
      const created = rows[0];
      if (!created) {
        throw new Error(`Failed to create program version for: ${programId}`);
      }
      return created;
    },

    async findVersions(programId: string): Promise<ProgramVersion[]> {
      return db
        .select()
        .from(programVersions)
        .where(eq(programVersions.programId, programId))
        .orderBy(desc(programVersions.createdAt));
    },

    async findCategoryIds(programId: string): Promise<string[]> {
      const rows = await db
        .select()
        .from(programCategories)
        .where(eq(programCategories.programId, programId));
      return rows.map((r) => r.categoryId);
    },
  };
}
