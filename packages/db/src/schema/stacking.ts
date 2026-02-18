import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { programs } from "./program.js";

export const ruleLevelEnum = pgEnum("rule_level", [
  "federal",
  "state",
  "provincial",
  "local",
  "utility",
]);

export const ruleEventTypeEnum = pgEnum("rule_event_type", [
  "stackable",
  "not_stackable",
  "conditional",
]);

export const stackingRules = pgTable(
  "stacking_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ruleId: text("rule_id").notNull().unique(),
    jurisdiction: text("jurisdiction").notNull(),
    level: ruleLevelEnum("level"),
    conditions: jsonb("conditions").notNull(),
    eventType: ruleEventTypeEnum("event_type").notNull(),
    eventParams: jsonb("event_params").notNull(),
    source: text("source"),
    sourceUrl: text("source_url"),
    isActive: boolean("is_active").default(true).notNull(),
    version: integer("version").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("stacking_rules_jurisdiction_idx").on(table.jurisdiction),
    index("stacking_rules_active_idx").on(table.isActive),
  ],
);

export const programUsageTracking = pgTable(
  "program_usage_tracking",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    programId: uuid("program_id")
      .notNull()
      .references(() => programs.id),
    sessionId: text("session_id").notNull(),
    annualUsedAmount: numeric("annual_used_amount", { precision: 12, scale: 2 }),
    lifetimeUsedAmount: numeric("lifetime_used_amount", { precision: 12, scale: 2 }),
    lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("program_usage_program_session_idx").on(table.programId, table.sessionId),
  ],
);
