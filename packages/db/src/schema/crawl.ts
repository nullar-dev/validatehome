import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { jurisdictions } from "./jurisdiction.js";

export const sourceTypeEnum = pgEnum("source_type", ["webpage", "pdf", "api_endpoint"]);

export const sources = pgTable("sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  url: text("url").notNull(),
  jurisdictionId: uuid("jurisdiction_id").references(() => jurisdictions.id),
  sourceType: sourceTypeEnum("source_type").notNull().default("webpage"),
  crawlFrequencyMs: integer("crawl_frequency_ms").notNull().default(86400000),
  lastCrawlAt: timestamp("last_crawl_at", { withTimezone: true }),
  etag: text("etag"),
  lastModifiedHeader: text("last_modified_header"),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const crawlSnapshots = pgTable("crawl_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceId: uuid("source_id")
    .references(() => sources.id)
    .notNull(),
  crawledAt: timestamp("crawled_at", { withTimezone: true }).defaultNow().notNull(),
  httpStatus: integer("http_status"),
  contentHash: text("content_hash"),
  rawHtmlPath: text("raw_html_path"),
  screenshotPath: text("screenshot_path"),
  pdfPath: text("pdf_path"),
  extractedText: text("extracted_text"),
  metadata: jsonb("metadata"),
});

export const diffTypeEnum = pgEnum("diff_type", ["text", "visual", "semantic"]);

export const diffs = pgTable("diffs", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceId: uuid("source_id")
    .references(() => sources.id)
    .notNull(),
  oldSnapshotId: uuid("old_snapshot_id")
    .references(() => crawlSnapshots.id)
    .notNull(),
  newSnapshotId: uuid("new_snapshot_id")
    .references(() => crawlSnapshots.id)
    .notNull(),
  diffType: diffTypeEnum("diff_type").notNull(),
  changesJson: jsonb("changes_json"),
  significanceScore: integer("significance_score").notNull().default(0),
  reviewed: boolean("reviewed").notNull().default(false),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
