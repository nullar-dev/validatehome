import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { productCategories } from "./category.js";
import { jurisdictions } from "./jurisdiction.js";
import { programs } from "./program.js";

export const alertTypeEnum = pgEnum("alert_type", [
  "status_change",
  "capacity_threshold",
  "new_program",
]);

export const notifySubscriptions = pgTable(
  "notify_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userEmail: text("user_email").notNull(),
    programId: uuid("program_id").references(() => programs.id),
    jurisdictionId: uuid("jurisdiction_id").references(() => jurisdictions.id),
    categoryId: uuid("category_id").references(() => productCategories.id),
    alertType: alertTypeEnum("alert_type").notNull(),
    thresholdPct: integer("threshold_pct"),
    confirmed: boolean("confirmed").notNull().default(false),
    confirmToken: text("confirm_token"),
    unsubscribeToken: text("unsubscribe_token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notify_subscriptions_email_idx").on(table.userEmail),
    index("notify_subscriptions_program_idx").on(table.programId),
  ],
);
