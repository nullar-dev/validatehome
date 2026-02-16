import {
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { jurisdictions } from "./jurisdiction.js";

export const programStatusEnum = pgEnum("program_status", [
  "open",
  "waitlist",
  "reserved",
  "funded",
  "closed",
  "coming_soon",
]);

export const programs = pgTable(
  "programs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jurisdictionId: uuid("jurisdiction_id")
      .references(() => jurisdictions.id)
      .notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    programUrl: text("program_url"),
    status: programStatusEnum("status").notNull().default("open"),
    budgetTotal: numeric("budget_total", { precision: 15, scale: 2 }),
    budgetRemaining: numeric("budget_remaining", { precision: 15, scale: 2 }),
    budgetPctUsed: integer("budget_pct_used"),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    applicationDeadline: timestamp("application_deadline", { withTimezone: true }),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    canonicalSourceUrl: text("canonical_source_url"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("programs_jurisdiction_idx").on(table.jurisdictionId),
    index("programs_status_idx").on(table.status),
    index("programs_name_idx").on(table.name),
  ],
);

export const programVersions = pgTable(
  "program_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    programId: uuid("program_id")
      .references(() => programs.id, { onDelete: "cascade" })
      .notNull(),
    data: jsonb("data").notNull(),
    changedFields: jsonb("changed_fields"),
    changedBy: text("changed_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("program_versions_program_created_idx").on(table.programId, table.createdAt)],
);
