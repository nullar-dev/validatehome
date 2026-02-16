import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { programs } from "./program.js";

export const verificationMethodEnum = pgEnum("verification_method", [
  "auto_crawl",
  "manual_review",
  "api_check",
]);

export const verifications = pgTable("verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  programId: uuid("program_id")
    .references(() => programs.id)
    .notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }).defaultNow().notNull(),
  verifiedBy: text("verified_by").notNull(),
  verificationMethod: verificationMethodEnum("verification_method").notNull(),
  confidenceScore: integer("confidence_score"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
