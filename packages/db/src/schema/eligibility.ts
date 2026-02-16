import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { programs } from "./program.js";

export const eligibilityRuleTypeEnum = pgEnum("eligibility_rule_type", [
  "income",
  "property_type",
  "geo",
  "equipment",
  "contractor",
]);

export const eligibilityRules = pgTable("eligibility_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  programId: uuid("program_id")
    .references(() => programs.id)
    .notNull(),
  ruleType: eligibilityRuleTypeEnum("rule_type").notNull(),
  criteriaJson: jsonb("criteria_json").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const stackabilityConstraintTypeEnum = pgEnum("stackability_constraint_type", [
  "cannot_combine",
  "reduces_amount",
  "order_matters",
]);

export const stackabilityConstraints = pgTable("stackability_constraints", {
  id: uuid("id").defaultRandom().primaryKey(),
  programAId: uuid("program_a_id")
    .references(() => programs.id)
    .notNull(),
  programBId: uuid("program_b_id")
    .references(() => programs.id)
    .notNull(),
  constraintType: stackabilityConstraintTypeEnum("constraint_type").notNull(),
  explanation: text("explanation"),
  ruleJson: jsonb("rule_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
