import { and, eq, inArray } from "drizzle-orm";
import { programUsageTracking, stackingRules } from "../schema/stacking.js";
import type { DbClient } from "./types.js";

interface StackingRuleInput {
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
      const existing = await this.findByRuleId(data.ruleId);
      if (existing) {
        const rows = await db
          .update(stackingRules)
          .set({
            ...data,
            version: existing.version + 1,
            updatedAt: new Date(),
          })
          .where(eq(stackingRules.ruleId, data.ruleId))
          .returning();
        const updated = rows[0];
        if (!updated) {
          throw new Error(`Failed to update stacking rule: ${data.ruleId}`);
        }
        return updated;
      }
      return this.create(data);
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
      const existing = await this.findByProgramAndSession(data.programId, data.sessionId);
      if (existing) {
        const rows = await db
          .update(programUsageTracking)
          .set({
            ...data,
            lastUpdated: new Date(),
          })
          .where(eq(programUsageTracking.id, existing.id))
          .returning();
        const updated = rows[0];
        if (!updated) {
          throw new Error("Failed to update program usage");
        }
        return updated;
      }
      const rows = await db.insert(programUsageTracking).values(data).returning();
      const created = rows[0];
      if (!created) {
        throw new Error("Failed to create program usage");
      }
      return created;
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

      const currentAnnual = await this.getAnnualUsage(programId, sessionId);
      const currentLifetime = await this.getLifetimeUsage(programId, sessionId);

      return this.upsert({
        programId,
        sessionId,
        annualUsedAmount: String(currentAnnual + (isAnnual ? amount : 0)),
        lifetimeUsedAmount: String(currentLifetime + amount),
      });
    },
  };
}
