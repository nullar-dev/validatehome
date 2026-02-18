CREATE TYPE "public"."crawl_error_class" AS ENUM('transient', 'permanent', 'policy_blocked');--> statement-breakpoint
CREATE TYPE "public"."crawl_job_status" AS ENUM('pending', 'running', 'succeeded', 'failed', 'policy_blocked');--> statement-breakpoint
CREATE TYPE "public"."rule_event_type" AS ENUM('stackable', 'not_stackable', 'conditional');--> statement-breakpoint
CREATE TYPE "public"."rule_level" AS ENUM('federal', 'state', 'provincial', 'local', 'utility');--> statement-breakpoint
CREATE TABLE "crawl_dlq" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid,
	"source_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"error_class" "crawl_error_class" NOT NULL,
	"payload" jsonb NOT NULL,
	"first_failed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_failed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"replay_count" integer DEFAULT 0 NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crawl_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"status" "crawl_job_status" DEFAULT 'pending' NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"error_class" "crawl_error_class",
	"error_message" text,
	"review_required" boolean DEFAULT false NOT NULL,
	"review_reasons" jsonb,
	"trace_id" text,
	"metadata" jsonb,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_usage_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" text NOT NULL,
	"session_id" text NOT NULL,
	"annual_used_amount" numeric(12, 2),
	"lifetime_used_amount" numeric(12, 2),
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stacking_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" text NOT NULL,
	"jurisdiction" text NOT NULL,
	"level" "rule_level",
	"conditions" jsonb NOT NULL,
	"event_type" "rule_event_type" NOT NULL,
	"event_params" jsonb NOT NULL,
	"source" text,
	"source_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stacking_rules_rule_id_unique" UNIQUE("rule_id")
);
--> statement-breakpoint
DROP INDEX "geo_mappings_postal_code_country_idx";--> statement-breakpoint
ALTER TABLE "crawl_snapshots" ADD COLUMN "fetch_status" text DEFAULT 'fetched' NOT NULL;--> statement-breakpoint
ALTER TABLE "crawl_snapshots" ADD COLUMN "ingestion_key" text;--> statement-breakpoint
ALTER TABLE "crawl_dlq" ADD CONSTRAINT "crawl_dlq_job_id_crawl_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."crawl_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_dlq" ADD CONSTRAINT "crawl_dlq_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_jobs" ADD CONSTRAINT "crawl_jobs_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "crawl_dlq_source_created_idx" ON "crawl_dlq" USING btree ("source_id","created_at");--> statement-breakpoint
CREATE INDEX "crawl_dlq_resolved_idx" ON "crawl_dlq" USING btree ("resolved_at");--> statement-breakpoint
CREATE INDEX "crawl_dlq_job_idx" ON "crawl_dlq" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "crawl_jobs_source_created_idx" ON "crawl_jobs" USING btree ("source_id","created_at");--> statement-breakpoint
CREATE INDEX "crawl_jobs_status_created_idx" ON "crawl_jobs" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "crawl_jobs_trace_id_idx" ON "crawl_jobs" USING btree ("trace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "program_usage_program_session_idx" ON "program_usage_tracking" USING btree ("program_id","session_id");--> statement-breakpoint
CREATE INDEX "stacking_rules_jurisdiction_idx" ON "stacking_rules" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX "stacking_rules_active_idx" ON "stacking_rules" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "crawl_snapshots_ingestion_key_uq" ON "crawl_snapshots" USING btree ("ingestion_key");