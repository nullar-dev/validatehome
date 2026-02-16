import { eq, or } from "drizzle-orm";
import { stackabilityConstraints } from "../schema/eligibility.js";
import { programs } from "../schema/program.js";
import type { DbClient } from "./types.js";

export type StackabilityConstraint = typeof stackabilityConstraints.$inferSelect;
export type NewStackabilityConstraint = typeof stackabilityConstraints.$inferInsert;

export function stackabilityRepo(db: DbClient) {
  return {
    async findByProgram(programId: string): Promise<StackabilityConstraint[]> {
      return db
        .select()
        .from(stackabilityConstraints)
        .where(
          or(
            eq(stackabilityConstraints.programAId, programId),
            eq(stackabilityConstraints.programBId, programId),
          ),
        );
    },

    async findByJurisdiction(jurisdictionId: string): Promise<StackabilityConstraint[]> {
      const programIds = await db
        .select({ id: programs.id })
        .from(programs)
        .where(eq(programs.jurisdictionId, jurisdictionId));

      if (programIds.length === 0) return [];

      const ids = programIds.map((p) => p.id);
      const allConstraints = await db.select().from(stackabilityConstraints);
      return allConstraints.filter((c) => ids.includes(c.programAId) || ids.includes(c.programBId));
    },

    async create(data: NewStackabilityConstraint): Promise<StackabilityConstraint> {
      const rows = await db.insert(stackabilityConstraints).values(data).returning();
      const created = rows[0];
      if (!created) {
        throw new Error("Failed to create stackability constraint");
      }
      return created;
    },
  };
}
