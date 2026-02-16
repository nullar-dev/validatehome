import { and, eq } from "drizzle-orm";
import { geoMappings } from "../schema/geo.js";
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
      return db.insert(geoMappings).values(data).returning();
    },

    async findByStateProvince(stateProvince: string, country: CountryCode): Promise<GeoMapping[]> {
      return db
        .select()
        .from(geoMappings)
        .where(and(eq(geoMappings.stateProvince, stateProvince), eq(geoMappings.country, country)));
    },
  };
}
