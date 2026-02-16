CREATE TYPE "public"."api_tier" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."benefit_type" AS ENUM('tax_credit', 'rebate', 'grant', 'loan', 'financing');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('USD', 'GBP', 'AUD', 'CAD');--> statement-breakpoint
CREATE TYPE "public"."diff_type" AS ENUM('text', 'visual', 'semantic');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('webpage', 'pdf', 'api_endpoint');--> statement-breakpoint
CREATE TYPE "public"."eligibility_rule_type" AS ENUM('income', 'property_type', 'geo', 'equipment', 'contractor');--> statement-breakpoint
CREATE TYPE "public"."stackability_constraint_type" AS ENUM('cannot_combine', 'reduces_amount', 'order_matters');--> statement-breakpoint
CREATE TYPE "public"."country" AS ENUM('US', 'UK', 'AU', 'CA');--> statement-breakpoint
CREATE TYPE "public"."jurisdiction_level" AS ENUM('federal', 'state', 'local', 'utility');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('status_change', 'capacity_threshold', 'new_program');--> statement-breakpoint
CREATE TYPE "public"."program_status" AS ENUM('open', 'waitlist', 'reserved', 'funded', 'closed', 'coming_soon');--> statement-breakpoint
CREATE TYPE "public"."verification_method" AS ENUM('auto_crawl', 'manual_review', 'api_check');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_name" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"tier" "api_tier" DEFAULT 'free' NOT NULL,
	"rate_limit" integer DEFAULT 100 NOT NULL,
	"monthly_quota" integer DEFAULT 3000 NOT NULL,
	"webhook_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "benefits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"type" "benefit_type" NOT NULL,
	"max_amount" numeric(12, 2),
	"percentage" integer,
	"income_cap" numeric(12, 2),
	"per_unit_amount" numeric(12, 2),
	"currency" "currency" NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "program_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"category_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crawl_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"crawled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"http_status" integer,
	"content_hash" text,
	"raw_html_path" text,
	"screenshot_path" text,
	"pdf_path" text,
	"extracted_text" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "diffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"old_snapshot_id" uuid NOT NULL,
	"new_snapshot_id" uuid NOT NULL,
	"diff_type" "diff_type" NOT NULL,
	"changes_json" jsonb,
	"significance_score" integer DEFAULT 0 NOT NULL,
	"reviewed" boolean DEFAULT false NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"jurisdiction_id" uuid,
	"source_type" "source_type" DEFAULT 'webpage' NOT NULL,
	"crawl_frequency_ms" integer DEFAULT 86400000 NOT NULL,
	"last_crawl_at" timestamp with time zone,
	"etag" text,
	"last_modified_header" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eligibility_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"rule_type" "eligibility_rule_type" NOT NULL,
	"criteria_json" jsonb NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stackability_constraints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_a_id" uuid NOT NULL,
	"program_b_id" uuid NOT NULL,
	"constraint_type" "stackability_constraint_type" NOT NULL,
	"explanation" text,
	"rule_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geo_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"postal_code" text NOT NULL,
	"country" "country" NOT NULL,
	"jurisdiction_ids" text[] NOT NULL,
	"city" text,
	"state_province" text,
	"lat" numeric(10, 7),
	"lng" numeric(10, 7),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jurisdictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"iso_code" text,
	"country" "country" NOT NULL,
	"parent_id" uuid,
	"level" "jurisdiction_level" NOT NULL,
	"geo_boundary" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notify_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_email" text NOT NULL,
	"program_id" uuid,
	"jurisdiction_id" uuid,
	"category_id" uuid,
	"alert_type" "alert_type" NOT NULL,
	"threshold_pct" integer,
	"confirmed" boolean DEFAULT false NOT NULL,
	"confirm_token" text,
	"unsubscribe_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"changed_fields" jsonb,
	"changed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jurisdiction_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"program_url" text,
	"status" "program_status" DEFAULT 'open' NOT NULL,
	"budget_total" numeric(15, 2),
	"budget_remaining" numeric(15, 2),
	"budget_pct_used" integer,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"application_deadline" timestamp with time zone,
	"last_verified_at" timestamp with time zone,
	"canonical_source_url" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "programs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_by" text NOT NULL,
	"verification_method" "verification_method" NOT NULL,
	"confidence_score" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "benefits" ADD CONSTRAINT "benefits_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_categories" ADD CONSTRAINT "program_categories_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_categories" ADD CONSTRAINT "program_categories_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawl_snapshots" ADD CONSTRAINT "crawl_snapshots_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diffs" ADD CONSTRAINT "diffs_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diffs" ADD CONSTRAINT "diffs_old_snapshot_id_crawl_snapshots_id_fk" FOREIGN KEY ("old_snapshot_id") REFERENCES "public"."crawl_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diffs" ADD CONSTRAINT "diffs_new_snapshot_id_crawl_snapshots_id_fk" FOREIGN KEY ("new_snapshot_id") REFERENCES "public"."crawl_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligibility_rules" ADD CONSTRAINT "eligibility_rules_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stackability_constraints" ADD CONSTRAINT "stackability_constraints_program_a_id_programs_id_fk" FOREIGN KEY ("program_a_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stackability_constraints" ADD CONSTRAINT "stackability_constraints_program_b_id_programs_id_fk" FOREIGN KEY ("program_b_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jurisdictions" ADD CONSTRAINT "jurisdictions_parent_id_jurisdictions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notify_subscriptions" ADD CONSTRAINT "notify_subscriptions_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notify_subscriptions" ADD CONSTRAINT "notify_subscriptions_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notify_subscriptions" ADD CONSTRAINT "notify_subscriptions_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_versions" ADD CONSTRAINT "program_versions_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_keys_prefix_idx" ON "api_keys" USING btree ("key_prefix");--> statement-breakpoint
CREATE INDEX "api_keys_active_idx" ON "api_keys" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "benefits_program_idx" ON "benefits" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "benefits_type_idx" ON "benefits" USING btree ("type");--> statement-breakpoint
CREATE INDEX "program_categories_program_idx" ON "program_categories" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "program_categories_category_idx" ON "program_categories" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "program_categories_program_category_unq" ON "program_categories" USING btree ("program_id","category_id");--> statement-breakpoint
CREATE INDEX "crawl_snapshots_source_crawled_idx" ON "crawl_snapshots" USING btree ("source_id","crawled_at");--> statement-breakpoint
CREATE INDEX "crawl_snapshots_content_hash_idx" ON "crawl_snapshots" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "diffs_source_created_idx" ON "diffs" USING btree ("source_id","created_at");--> statement-breakpoint
CREATE INDEX "diffs_reviewed_significance_idx" ON "diffs" USING btree ("reviewed","significance_score");--> statement-breakpoint
CREATE INDEX "sources_is_active_idx" ON "sources" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sources_active_last_crawl_idx" ON "sources" USING btree ("is_active","last_crawl_at");--> statement-breakpoint
CREATE INDEX "sources_jurisdiction_idx" ON "sources" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE INDEX "sources_url_idx" ON "sources" USING btree ("url");--> statement-breakpoint
CREATE INDEX "eligibility_rules_program_idx" ON "eligibility_rules" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "eligibility_rules_program_type_idx" ON "eligibility_rules" USING btree ("program_id","rule_type");--> statement-breakpoint
CREATE INDEX "stackability_constraints_program_a_idx" ON "stackability_constraints" USING btree ("program_a_id");--> statement-breakpoint
CREATE INDEX "stackability_constraints_program_b_idx" ON "stackability_constraints" USING btree ("program_b_id");--> statement-breakpoint
CREATE INDEX "geo_mappings_postal_code_country_idx" ON "geo_mappings" USING btree ("postal_code","country");--> statement-breakpoint
CREATE INDEX "geo_mappings_state_province_idx" ON "geo_mappings" USING btree ("state_province");--> statement-breakpoint
CREATE UNIQUE INDEX "jurisdictions_iso_code_unq" ON "jurisdictions" USING btree ("iso_code");--> statement-breakpoint
CREATE INDEX "jurisdictions_country_idx" ON "jurisdictions" USING btree ("country");--> statement-breakpoint
CREATE INDEX "jurisdictions_country_name_idx" ON "jurisdictions" USING btree ("country","name");--> statement-breakpoint
CREATE INDEX "jurisdictions_parent_idx" ON "jurisdictions" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "notify_subscriptions_email_idx" ON "notify_subscriptions" USING btree ("user_email");--> statement-breakpoint
CREATE INDEX "notify_subscriptions_program_idx" ON "notify_subscriptions" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "program_versions_program_created_idx" ON "program_versions" USING btree ("program_id","created_at");--> statement-breakpoint
CREATE INDEX "programs_jurisdiction_idx" ON "programs" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE INDEX "programs_status_idx" ON "programs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "programs_name_idx" ON "programs" USING btree ("name");--> statement-breakpoint
CREATE INDEX "verifications_program_verified_at_idx" ON "verifications" USING btree ("program_id","verified_at");