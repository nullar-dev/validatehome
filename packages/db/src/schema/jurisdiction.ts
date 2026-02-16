import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const jurisdictionLevelEnum = pgEnum("jurisdiction_level", [
  "federal",
  "state",
  "local",
  "utility",
]);

export const countryEnum = pgEnum("country", ["US", "UK", "AU", "CA"]);

export const jurisdictions = pgTable("jurisdictions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  isoCode: text("iso_code"),
  country: countryEnum("country").notNull(),
  parentId: uuid("parent_id").references((): AnyPgColumn => jurisdictions.id),
  level: jurisdictionLevelEnum("level").notNull(),
  geoBoundary: jsonb("geo_boundary"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
