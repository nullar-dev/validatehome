import { desc, eq } from "drizzle-orm";
import { verifications } from "../schema/verification.js";
import type { DbClient } from "./types.js";

export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;

export function verificationRepo(db: DbClient) {
  return {
    async create(data: NewVerification): Promise<Verification> {
      const rows = await db.insert(verifications).values(data).returning();
      const created = rows[0];
      if (!created) {
        throw new Error("Failed to create verification");
      }
      return created;
    },

    async findLatestByProgram(programId: string): Promise<Verification | undefined> {
      const rows = await db
        .select()
        .from(verifications)
        .where(eq(verifications.programId, programId))
        .orderBy(desc(verifications.verifiedAt))
        .limit(1);
      return rows[0];
    },

    async findByProgram(programId: string): Promise<Verification[]> {
      return db
        .select()
        .from(verifications)
        .where(eq(verifications.programId, programId))
        .orderBy(desc(verifications.verifiedAt));
    },
  };
}
