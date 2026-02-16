import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { programs } from "./program.js";

export const eligibilityRuleTypeEnum = pgEnum("eligibility_rule_type", [
  "income",
  "property_type",
  "geo",
  "equipment",
  "contractor",
]);

export const eligibilityRules = pgTable(
  "eligibility_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    programId: uuid("program_id")
      .references(() => programs.id)
      .notNull(),
    ruleType: eligibilityRuleTypeEnum("rule_type").notNull(),
    criteriaJson: jsonb("criteria_json").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("eligibility_rules_program_idx").on(table.programId),
    index("eligibility_rules_program_type_idx").on(table.programId, table.ruleType),
  ],
);

export const stackabilityConstraintTypeEnum = pgEnum("stackability_constraint_type", [
  "cannot_combine",
  "reduces_amount",
  "order_matters",
]);

export const stackabilityConstraints = pgTable(
  "stackability_constraints",
  {
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
  },
  (table) => [
    index("stackability_constraints_program_a_idx").on(table.programAId),
    index("stackability_constraints_program_b_idx").on(table.programBId),
    uniqueIndex("stackability_constraints_program_pair_uq").on(table.programAId, table.programBId),
  ],
);
