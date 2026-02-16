import { and, eq, inArray } from "drizzle-orm";
import { geoMappings } from "../schema/geo.js";
import { jurisdictions } from "../schema/jurisdiction.js";
import type { CountryCode } from "./jurisdiction.repo.js";
import type { DbClient } from "./types.js";

export type GeoMapping = typeof geoMappings.$inferSelect;
export type NewGeoMapping = typeof geoMappings.$inferInsert;

export function geoMappingRepo(db: DbClient) {
  return {
    async findByPostalCode(
      postalCode: string,
      country: CountryCode,
    ): Promise<GeoMapping | undefined> {
      const rows = await db
        .select()
        .from(geoMappings)
        .where(and(eq(geoMappings.postalCode, postalCode), eq(geoMappings.country, country)))
        .limit(1);
      return rows[0];
    },

    async bulkCreate(data: NewGeoMapping[]): Promise<GeoMapping[]> {
      if (data.length === 0) return [];

      const expectedIds = [...new Set(data.flatMap((row) => row.jurisdictionIds))];
      if (expectedIds.length > 0) {
        const found = await db
          .select({ id: jurisdictions.id })
          .from(jurisdictions)
          .where(inArray(jurisdictions.id, expectedIds));
        const foundIds = new Set(found.map((row) => row.id));
        const missing = expectedIds.filter((id) => !foundIds.has(id));
        if (missing.length > 0) {
          throw new Error(`Invalid jurisdictionIds: ${missing.join(", ")}`);
        }
      }

      const rows = await db.insert(geoMappings).values(data).returning();
      if (rows.length !== data.length) {
        throw new Error(
          `Partial geo mapping insert: expected ${data.length}, inserted ${rows.length}`,
        );
      }
      return rows;
    },

    async findByStateProvince(stateProvince: string, country: CountryCode): Promise<GeoMapping[]> {
      return db
        .select()
        .from(geoMappings)
        .where(and(eq(geoMappings.stateProvince, stateProvince), eq(geoMappings.country, country)));
    },
  };
}
