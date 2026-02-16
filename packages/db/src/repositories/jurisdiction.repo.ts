import { and, eq, sql } from "drizzle-orm";
import { geoMappings } from "../schema/geo.js";
import { type countryEnum, jurisdictions } from "../schema/jurisdiction.js";
import type { DbClient, PaginatedResult, PaginationOptions } from "./types.js";
import { paginate } from "./types.js";

export type CountryCode = (typeof countryEnum.enumValues)[number];

export type Jurisdiction = typeof jurisdictions.$inferSelect;
export type NewJurisdiction = typeof jurisdictions.$inferInsert;

export function jurisdictionRepo(db: DbClient) {
  return {
    async findAll(
      options?: PaginationOptions,
    ): Promise<PaginatedResult<Jurisdiction> | Jurisdiction[]> {
      if (!options) {
        return db.select().from(jurisdictions).orderBy(jurisdictions.name);
      }
      const offset = (options.page - 1) * options.limit;
      const [data, countResult] = await Promise.all([
        db
          .select()
          .from(jurisdictions)
          .orderBy(jurisdictions.name)
          .limit(options.limit)
          .offset(offset),
        db.select({ count: sql<number>`count(*)::int` }).from(jurisdictions),
      ]);
      return paginate(data, countResult[0]?.count ?? 0, options);
    },

    async findById(id: string): Promise<Jurisdiction | undefined> {
      const rows = await db.select().from(jurisdictions).where(eq(jurisdictions.id, id)).limit(1);
      return rows[0];
    },

    async findByCountry(country: CountryCode): Promise<Jurisdiction[]> {
      return db
        .select()
        .from(jurisdictions)
        .where(eq(jurisdictions.country, country))
        .orderBy(jurisdictions.name);
    },

    async findByPostalCode(postalCode: string, country: CountryCode): Promise<Jurisdiction[]> {
      const mappings = await db
        .select()
        .from(geoMappings)
        .where(and(eq(geoMappings.postalCode, postalCode), eq(geoMappings.country, country)))
        .limit(1);

      const mapping = mappings[0];
      if (!mapping || !mapping.jurisdictionIds.length) {
        return [];
      }

      const ids = mapping.jurisdictionIds;
      return db.select().from(jurisdictions).where(sql`${jurisdictions.id} = ANY(${ids})`);
    },

    async create(data: NewJurisdiction): Promise<Jurisdiction> {
      const rows = await db.insert(jurisdictions).values(data).returning();
      const created = rows[0];
      if (!created) {
        throw new Error("Failed to create jurisdiction");
      }
      return created;
    },
  };
}
