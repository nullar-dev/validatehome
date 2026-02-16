import {
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { programs } from "./program.js";

export const benefitTypeEnum = pgEnum("benefit_type", [
  "tax_credit",
  "rebate",
  "grant",
  "loan",
  "financing",
]);

export const currencyEnum = pgEnum("currency", ["USD", "GBP", "AUD", "CAD"]);

export const benefits = pgTable(
  "benefits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    programId: uuid("program_id")
      .references(() => programs.id)
      .notNull(),
    type: benefitTypeEnum("type").notNull(),
    maxAmount: numeric("max_amount", { precision: 12, scale: 2 }),
    percentage: integer("percentage"),
    incomeCap: numeric("income_cap", { precision: 12, scale: 2 }),
    perUnitAmount: numeric("per_unit_amount", { precision: 12, scale: 2 }),
    currency: currencyEnum("currency").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("benefits_program_idx").on(table.programId),
    index("benefits_type_idx").on(table.type),
  ],
);
