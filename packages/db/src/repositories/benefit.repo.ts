import { and, eq, inArray } from "drizzle-orm";
import { benefits } from "../schema/benefit.js";
import { programCategories } from "../schema/category.js";
import { geoMappings } from "../schema/geo.js";
import { programs } from "../schema/program.js";
import type { CountryCode } from "./jurisdiction.repo.js";
import type { DbClient } from "./types.js";

export type Benefit = typeof benefits.$inferSelect;
export type NewBenefit = typeof benefits.$inferInsert;

export function benefitRepo(db: DbClient) {
  return {
    async findByProgram(programId: string): Promise<Benefit[]> {
      if (!programId?.trim()) {
        return [];
      }
      return db.select().from(benefits).where(eq(benefits.programId, programId));
    },

    async findEligibleByLocation(
      postalCode: string,
      country: CountryCode,
      categoryId?: string,
    ): Promise<(Benefit & { programName: string; programSlug: string })[]> {
      if (!postalCode?.trim()) {
        return [];
      }
      const mappings = await db
        .select()
        .from(geoMappings)
        .where(and(eq(geoMappings.postalCode, postalCode), eq(geoMappings.country, country)))
        .limit(1);

      const mapping = mappings[0];
      if (!mapping?.jurisdictionIds?.length) {
        return [];
      }

      const conditions = [inArray(programs.jurisdictionId, mapping.jurisdictionIds)];
      if (categoryId) {
        conditions.push(eq(programCategories.categoryId, categoryId));
      }

      let query = db
        .select({
          benefit: benefits,
          programName: programs.name,
          programSlug: programs.slug,
        })
        .from(benefits)
        .innerJoin(programs, eq(benefits.programId, programs.id))
        .$dynamic();

      if (categoryId) {
        query = query.innerJoin(programCategories, eq(programCategories.programId, programs.id));
      }

      const rows = await query.where(and(...conditions));

      return rows.map((r) => ({
        ...r.benefit,
        programName: r.programName,
        programSlug: r.programSlug,
      }));
    },

    async create(data: NewBenefit): Promise<Benefit> {
      const rows = await db.insert(benefits).values(data).returning();
      const created = rows[0];
      if (!created) {
        throw new Error("Failed to create benefit");
      }
      return created;
    },

    async createMany(data: NewBenefit[]): Promise<Benefit[]> {
      if (data.length === 0) return [];
      return db.insert(benefits).values(data).returning();
    },
  };
}
