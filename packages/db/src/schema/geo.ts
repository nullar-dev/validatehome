import { index, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { countryEnum } from "./jurisdiction.js";

export const geoMappings = pgTable(
  "geo_mappings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postalCode: text("postal_code").notNull(),
    country: countryEnum("country").notNull(),
    jurisdictionIds: text("jurisdiction_ids").array().notNull(),
    city: text("city"),
    stateProvince: text("state_province"),
    lat: numeric("lat", { precision: 10, scale: 7 }),
    lng: numeric("lng", { precision: 10, scale: 7 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("geo_mappings_postal_code_country_uq").on(table.postalCode, table.country),
    index("geo_mappings_postal_code_country_idx").on(table.postalCode, table.country),
    index("geo_mappings_state_province_idx").on(table.stateProvince),
  ],
);
