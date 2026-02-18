import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { jurisdictions } from "./jurisdiction.js";

export const sourceTypeEnum = pgEnum("source_type", ["webpage", "pdf", "api_endpoint"]);

export const sources = pgTable(
  "sources",
  {
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
  },
  (table) => [
    index("sources_is_active_idx").on(table.isActive),
    index("sources_active_last_crawl_idx").on(table.isActive, table.lastCrawlAt),
    index("sources_jurisdiction_idx").on(table.jurisdictionId),
    index("sources_url_idx").on(table.url),
  ],
);

export const crawlSnapshots = pgTable(
  "crawl_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceId: uuid("source_id")
      .references(() => sources.id)
      .notNull(),
    crawledAt: timestamp("crawled_at", { withTimezone: true }).defaultNow().notNull(),
    httpStatus: integer("http_status"),
    fetchStatus: text("fetch_status").default("fetched").notNull(),
    contentHash: text("content_hash"),
    ingestionKey: text("ingestion_key"),
    rawHtmlPath: text("raw_html_path"),
    screenshotPath: text("screenshot_path"),
    pdfPath: text("pdf_path"),
    extractedText: text("extracted_text"),
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("crawl_snapshots_source_crawled_idx").on(table.sourceId, table.crawledAt),
    index("crawl_snapshots_content_hash_idx").on(table.contentHash),
    uniqueIndex("crawl_snapshots_ingestion_key_uq").on(table.ingestionKey),
  ],
);

export const diffTypeEnum = pgEnum("diff_type", ["text", "visual", "semantic"]);

export const diffs = pgTable(
  "diffs",
  {
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
  },
  (table) => [
    index("diffs_source_created_idx").on(table.sourceId, table.createdAt),
    index("diffs_reviewed_significance_idx").on(table.reviewed, table.significanceScore),
  ],
);

export const crawlJobStatusEnum = pgEnum("crawl_job_status", [
  "pending",
  "running",
  "succeeded",
  "failed",
  "policy_blocked",
]);

export const crawlErrorClassEnum = pgEnum("crawl_error_class", [
  "transient",
  "permanent",
  "policy_blocked",
]);

export const crawlJobs = pgTable(
  "crawl_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceId: uuid("source_id")
      .references(() => sources.id)
      .notNull(),
    status: crawlJobStatusEnum("status").notNull().default("pending"),
    attempt: integer("attempt").notNull().default(1),
    maxAttempts: integer("max_attempts").notNull().default(3),
    errorClass: crawlErrorClassEnum("error_class"),
    errorMessage: text("error_message"),
    reviewRequired: boolean("review_required").notNull().default(false),
    reviewReasons: jsonb("review_reasons"),
    traceId: text("trace_id"),
    metadata: jsonb("metadata"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("crawl_jobs_source_created_idx").on(table.sourceId, table.createdAt),
    index("crawl_jobs_status_created_idx").on(table.status, table.createdAt),
    index("crawl_jobs_trace_id_idx").on(table.traceId),
  ],
);

export const crawlDlq = pgTable(
  "crawl_dlq",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id").references(() => crawlJobs.id),
    sourceId: uuid("source_id")
      .references(() => sources.id)
      .notNull(),
    reason: text("reason").notNull(),
    errorClass: crawlErrorClassEnum("error_class").notNull(),
    payload: jsonb("payload").notNull(),
    firstFailedAt: timestamp("first_failed_at", { withTimezone: true }).defaultNow().notNull(),
    lastFailedAt: timestamp("last_failed_at", { withTimezone: true }).defaultNow().notNull(),
    replayCount: integer("replay_count").notNull().default(0),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("crawl_dlq_source_created_idx").on(table.sourceId, table.createdAt),
    index("crawl_dlq_resolved_idx").on(table.resolvedAt),
    index("crawl_dlq_job_idx").on(table.jobId),
  ],
);
