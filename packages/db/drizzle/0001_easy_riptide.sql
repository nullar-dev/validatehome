ALTER TABLE "program_versions" DROP CONSTRAINT "program_versions_program_id_programs_id_fk";
--> statement-breakpoint
ALTER TABLE "program_versions" ADD CONSTRAINT "program_versions_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "stackability_constraints_program_pair_uq" ON "stackability_constraints" USING btree ("program_a_id","program_b_id");--> statement-breakpoint
CREATE UNIQUE INDEX "geo_mappings_postal_code_country_uq" ON "geo_mappings" USING btree ("postal_code","country");