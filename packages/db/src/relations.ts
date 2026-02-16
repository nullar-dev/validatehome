import { relations } from "drizzle-orm";
import { benefits } from "./schema/benefit.js";
import { productCategories, programCategories } from "./schema/category.js";
import { crawlSnapshots, diffs, sources } from "./schema/crawl.js";
import { eligibilityRules, stackabilityConstraints } from "./schema/eligibility.js";
import { jurisdictions } from "./schema/jurisdiction.js";
import { notifySubscriptions } from "./schema/notification.js";
import { programs, programVersions } from "./schema/program.js";
import { verifications } from "./schema/verification.js";

// --- Jurisdictions ---

export const jurisdictionsRelations = relations(jurisdictions, ({ one, many }) => ({
  parent: one(jurisdictions, {
    fields: [jurisdictions.parentId],
    references: [jurisdictions.id],
    relationName: "jurisdictionHierarchy",
  }),
  children: many(jurisdictions, { relationName: "jurisdictionHierarchy" }),
  programs: many(programs),
  sources: many(sources),
  notifySubscriptions: many(notifySubscriptions),
}));

// --- Programs ---

export const programsRelations = relations(programs, ({ one, many }) => ({
  jurisdiction: one(jurisdictions, {
    fields: [programs.jurisdictionId],
    references: [jurisdictions.id],
  }),
  benefits: many(benefits),
  eligibilityRules: many(eligibilityRules),
  verifications: many(verifications),
  programVersions: many(programVersions),
  programCategories: many(programCategories),
  notifySubscriptions: many(notifySubscriptions),
  stackabilityConstraintsA: many(stackabilityConstraints, {
    relationName: "programA",
  }),
  stackabilityConstraintsB: many(stackabilityConstraints, {
    relationName: "programB",
  }),
}));

export const programVersionsRelations = relations(programVersions, ({ one }) => ({
  program: one(programs, {
    fields: [programVersions.programId],
    references: [programs.id],
  }),
}));

// --- Categories ---

export const productCategoriesRelations = relations(productCategories, ({ many }) => ({
  programCategories: many(programCategories),
  notifySubscriptions: many(notifySubscriptions),
}));

export const programCategoriesRelations = relations(programCategories, ({ one }) => ({
  program: one(programs, {
    fields: [programCategories.programId],
    references: [programs.id],
  }),
  category: one(productCategories, {
    fields: [programCategories.categoryId],
    references: [productCategories.id],
  }),
}));

// --- Benefits ---

export const benefitsRelations = relations(benefits, ({ one }) => ({
  program: one(programs, {
    fields: [benefits.programId],
    references: [programs.id],
  }),
}));

// --- Eligibility & Stackability ---

export const eligibilityRulesRelations = relations(eligibilityRules, ({ one }) => ({
  program: one(programs, {
    fields: [eligibilityRules.programId],
    references: [programs.id],
  }),
}));

export const stackabilityConstraintsRelations = relations(stackabilityConstraints, ({ one }) => ({
  programA: one(programs, {
    fields: [stackabilityConstraints.programAId],
    references: [programs.id],
    relationName: "programA",
  }),
  programB: one(programs, {
    fields: [stackabilityConstraints.programBId],
    references: [programs.id],
    relationName: "programB",
  }),
}));

// --- Crawl Pipeline ---

export const sourcesRelations = relations(sources, ({ one, many }) => ({
  jurisdiction: one(jurisdictions, {
    fields: [sources.jurisdictionId],
    references: [jurisdictions.id],
  }),
  crawlSnapshots: many(crawlSnapshots),
  diffs: many(diffs),
}));

export const crawlSnapshotsRelations = relations(crawlSnapshots, ({ one }) => ({
  source: one(sources, {
    fields: [crawlSnapshots.sourceId],
    references: [sources.id],
  }),
}));

export const diffsRelations = relations(diffs, ({ one }) => ({
  source: one(sources, {
    fields: [diffs.sourceId],
    references: [sources.id],
  }),
  oldSnapshot: one(crawlSnapshots, {
    fields: [diffs.oldSnapshotId],
    references: [crawlSnapshots.id],
    relationName: "oldSnapshot",
  }),
  newSnapshot: one(crawlSnapshots, {
    fields: [diffs.newSnapshotId],
    references: [crawlSnapshots.id],
    relationName: "newSnapshot",
  }),
}));

// --- Verifications ---

export const verificationsRelations = relations(verifications, ({ one }) => ({
  program: one(programs, {
    fields: [verifications.programId],
    references: [programs.id],
  }),
}));

// --- Notifications ---

export const notifySubscriptionsRelations = relations(notifySubscriptions, ({ one }) => ({
  program: one(programs, {
    fields: [notifySubscriptions.programId],
    references: [programs.id],
  }),
  jurisdiction: one(jurisdictions, {
    fields: [notifySubscriptions.jurisdictionId],
    references: [jurisdictions.id],
  }),
  category: one(productCategories, {
    fields: [notifySubscriptions.categoryId],
    references: [productCategories.id],
  }),
}));
