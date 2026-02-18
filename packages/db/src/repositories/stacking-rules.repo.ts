import { and, eq, inArray, sql } from "drizzle-orm";
import { programUsageTracking, stackingRules } from "../schema/stacking.js";
import type { DbClient } from "./types.js";

export interface StackingRuleInput {
  readonly ruleId: string;
  readonly jurisdiction: string;
  readonly conditions: unknown;
  readonly event: {
    readonly type: "stackable" | "not_stackable" | "conditional";
    readonly params: {
      readonly source?: string;
    };
  };
}

export type StackingRuleRow = typeof stackingRules.$inferSelect;
export type NewStackingRule = typeof stackingRules.$inferInsert;

export interface StackingRulesRepo {
  findByJurisdiction(jurisdiction: string): Promise<StackingRuleRow[]>;
  findByJurisdictions(jurisdictions: string[]): Promise<StackingRuleRow[]>;
  findByRuleId(ruleId: string): Promise<StackingRuleRow | undefined>;
  findAll(): Promise<StackingRuleRow[]>;
  findAllActive(): Promise<StackingRuleRow[]>;
  create(data: NewStackingRule): Promise<StackingRuleRow>;
  upsert(data: NewStackingRule): Promise<StackingRuleRow>;
  deactivate(ruleId: string): Promise<void>;
  bulkUpsert(rules: StackingRuleInput[]): Promise<number>;
}

export interface ProgramUsageRepo {
  findByProgramAndSession(
    programId: string,
    sessionId: string,
  ): Promise<ProgramUsageRow | undefined>;
  upsert(data: NewProgramUsage): Promise<ProgramUsageRow>;
  getLifetimeUsage(programId: string, sessionId: string): Promise<number>;
  getAnnualUsage(programId: string, sessionId: string): Promise<number>;
  addUsage(
    programId: string,
    sessionId: string,
    amount: number,
    isAnnual?: boolean,
  ): Promise<ProgramUsageRow>;
}

export function stackingRulesRepo(db: DbClient): StackingRulesRepo {
  return {
    async findByJurisdiction(jurisdiction: string): Promise<StackingRuleRow[]> {
      return db
        .select()
        .from(stackingRules)
        .where(and(eq(stackingRules.jurisdiction, jurisdiction), eq(stackingRules.isActive, true)));
    },

    async findByJurisdictions(jurisdictions: string[]): Promise<StackingRuleRow[]> {
      return db
        .select()
        .from(stackingRules)
        .where(
          and(inArray(stackingRules.jurisdiction, jurisdictions), eq(stackingRules.isActive, true)),
        );
    },

    async findByRuleId(ruleId: string): Promise<StackingRuleRow | undefined> {
      const rows = await db.select().from(stackingRules).where(eq(stackingRules.ruleId, ruleId));
      return rows[0];
    },

    async findAll(): Promise<StackingRuleRow[]> {
      return db.select().from(stackingRules);
    },

    async findAllActive(): Promise<StackingRuleRow[]> {
      return db.select().from(stackingRules).where(eq(stackingRules.isActive, true));
    },

    async create(data: NewStackingRule): Promise<StackingRuleRow> {
      const rows = await db.insert(stackingRules).values(data).returning();
      const created = rows[0];
      if (!created) {
        throw new Error("Failed to create stacking rule");
      }
      return created;
    },

    async upsert(data: NewStackingRule): Promise<StackingRuleRow> {
      const rows = await db
        .insert(stackingRules)
        .values({
          ...data,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: stackingRules.ruleId,
          set: {
            ...data,
            version: sql`${stackingRules.version} + 1`,
            updatedAt: new Date(),
          },
          where: eq(stackingRules.isActive, true),
        })
        .returning();

      const result = rows[0];
      if (!result) {
        throw new Error(`Failed to upsert stacking rule: ${data.ruleId}`);
      }
      return result;
    },

    async deactivate(ruleId: string): Promise<void> {
      await db
        .update(stackingRules)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(stackingRules.ruleId, ruleId));
    },

    async bulkUpsert(rules: StackingRuleInput[]): Promise<number> {
      let count = 0;
      for (const rule of rules) {
        await this.upsert({
          ruleId: rule.ruleId,
          jurisdiction: rule.jurisdiction,
          conditions: rule.conditions as unknown as NewStackingRule["conditions"],
          eventType: rule.event.type,
          eventParams: rule.event.params as unknown as NewStackingRule["eventParams"],
          source: rule.event.params.source,
          isActive: true,
          version: 1,
        });
        count++;
      }
      return count;
    },
  };
}

export type ProgramUsageRow = typeof programUsageTracking.$inferSelect;
export type NewProgramUsage = typeof programUsageTracking.$inferInsert;

export function programUsageRepo(db: DbClient): ProgramUsageRepo {
  return {
    async findByProgramAndSession(
      programId: string,
      sessionId: string,
    ): Promise<ProgramUsageRow | undefined> {
      const rows = await db
        .select()
        .from(programUsageTracking)
        .where(
          and(
            eq(programUsageTracking.programId, programId),
            eq(programUsageTracking.sessionId, sessionId),
          ),
        );
      return rows[0];
    },

    async upsert(data: NewProgramUsage): Promise<ProgramUsageRow> {
      const rows = await db
        .insert(programUsageTracking)
        .values(data)
        .onConflictDoUpdate({
          target: [programUsageTracking.programId, programUsageTracking.sessionId],
          set: {
            ...data,
            lastUpdated: new Date(),
          },
        })
        .returning();

      const result = rows[0];
      if (!result) {
        throw new Error("Failed to upsert program usage");
      }
      return result;
    },

    async getLifetimeUsage(programId: string, sessionId: string): Promise<number> {
      const usage = await this.findByProgramAndSession(programId, sessionId);
      if (!usage?.lifetimeUsedAmount) return 0;
      const num = usage.lifetimeUsedAmount;
      return typeof num === "string" ? parseFloat(num) : Number(num);
    },

    async getAnnualUsage(programId: string, sessionId: string): Promise<number> {
      const usage = await this.findByProgramAndSession(programId, sessionId);
      if (!usage?.annualUsedAmount) return 0;
      const num = usage.annualUsedAmount;
      return typeof num === "string" ? parseFloat(num) : Number(num);
    },

    async addUsage(
      programId: string,
      sessionId: string,
      amount: number,
      isAnnual: boolean = true,
    ): Promise<ProgramUsageRow> {
      if (amount < 0) {
        throw new Error("Amount cannot be negative");
      }

      const rows = await db
        .insert(programUsageTracking)
        .values({
          programId,
          sessionId,
          annualUsedAmount: isAnnual ? String(amount) : "0",
          lifetimeUsedAmount: String(amount),
        })
        .onConflictDoUpdate({
          target: [programUsageTracking.programId, programUsageTracking.sessionId],
          set: {
            annualUsedAmount: isAnnual
              ? sql`COALESCE(${programUsageTracking.annualUsedAmount}::numeric, 0) + ${amount}`
              : programUsageTracking.annualUsedAmount,
            lifetimeUsedAmount: sql`COALESCE(${programUsageTracking.lifetimeUsedAmount}::numeric, 0) + ${amount}`,
            lastUpdated: new Date(),
          },
        })
        .returning();

      const result = rows[0];
      if (!result) {
        throw new Error("Failed to add usage");
      }
      return result;
    },
  };
}
