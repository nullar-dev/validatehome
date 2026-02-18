import type { StackingRule } from "../types.js";

export interface RuleVersion {
  version: number;
  ruleId: string;
  jurisdiction: string;
  conditions: StackingRule["conditions"];
  event: StackingRule["event"];
  source?: string;
  sourceUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleHistoryEntry {
  version: number;
  changedAt: Date;
  changedBy?: string;
  changeType: "created" | "updated" | "deactivated";
  changes?: Record<string, { old: unknown; new: unknown }>;
}

export interface RuleFilter {
  jurisdiction?: string;
  isActive?: boolean;
  ruleId?: string;
  eventType?: "stackable" | "not_stackable" | "conditional";
}

export interface CreateRuleInput {
  ruleId: string;
  jurisdiction: string;
  conditions: StackingRule["conditions"];
  event: StackingRule["event"];
  source?: string;
  sourceUrl?: string;
}

export interface UpdateRuleInput {
  conditions?: StackingRule["conditions"];
  event?: StackingRule["event"];
  source?: string;
  sourceUrl?: string;
  isActive?: boolean;
}

export interface RuleService {
  getRules(filter?: RuleFilter): Promise<StackingRule[]>;
  getRuleById(ruleId: string): Promise<StackingRule | null>;
  createRule(input: CreateRuleInput, changedBy?: string): Promise<StackingRule>;
  updateRule(ruleId: string, input: UpdateRuleInput, changedBy?: string): Promise<StackingRule>;
  deactivateRule(ruleId: string, changedBy?: string): Promise<void>;
  getRuleHistory(ruleId: string): Promise<RuleHistoryEntry[]>;
  getRuleVersions(ruleId: string): Promise<RuleVersion[]>;
}

export interface InMemoryRuleServiceOptions {
  rules: StackingRule[];
}

export class InMemoryRuleService implements RuleService {
  private rules: Map<string, StackingRule>;
  private history: Map<string, RuleHistoryEntry[]>;

  constructor(options: InMemoryRuleServiceOptions) {
    this.rules = new Map();
    this.history = new Map();

    for (const rule of options.rules) {
      this.rules.set(rule.ruleId, rule);
      this.history.set(rule.ruleId, [
        {
          version: 1,
          changedAt: new Date(),
          changeType: "created",
        },
      ]);
    }
  }

  async getRules(filter?: RuleFilter): Promise<StackingRule[]> {
    let result = Array.from(this.rules.values());

    if (filter?.jurisdiction) {
      result = result.filter((r) => r.jurisdiction === filter.jurisdiction);
    }

    if (filter?.isActive !== undefined) {
      result = result.filter((r) => r.isActive !== undefined);
    }

    if (filter?.ruleId) {
      result = result.filter((r) => r.ruleId === filter.ruleId);
    }

    if (filter?.eventType) {
      result = result.filter((r) => r.event.type === filter.eventType);
    }

    return result;
  }

  async getRuleById(ruleId: string): Promise<StackingRule | null> {
    return this.rules.get(ruleId) ?? null;
  }

  async createRule(input: CreateRuleInput, changedBy?: string): Promise<StackingRule> {
    if (this.rules.has(input.ruleId)) {
      throw new Error(`Rule with ID ${input.ruleId} already exists`);
    }

    const rule: StackingRule = {
      ruleId: input.ruleId,
      jurisdiction: input.jurisdiction,
      conditions: input.conditions,
      event: input.event,
      isActive: true,
    };

    this.rules.set(rule.ruleId, rule);
    this.history.set(rule.ruleId, [
      {
        version: 1,
        changedAt: new Date(),
        changedBy,
        changeType: "created",
      },
    ]);

    return rule;
  }

  async updateRule(
    ruleId: string,
    input: UpdateRuleInput,
    changedBy?: string,
  ): Promise<StackingRule> {
    const existing = this.rules.get(ruleId);
    if (!existing) {
      throw new Error(`Rule with ID ${ruleId} not found`);
    }

    const changes: Record<string, { old: unknown; new: unknown }> = {};

    if (input.conditions) {
      changes.conditions = { old: existing.conditions, new: input.conditions };
    }

    if (input.event) {
      changes.event = { old: existing.event, new: input.event };
    }

    if (input.source) {
      changes.source = { old: existing.source, new: input.source };
    }

    const updated: StackingRule = {
      ...existing,
      conditions: input.conditions ?? existing.conditions,
      event: input.event ?? existing.event,
      source: input.source ?? existing.source,
      isActive: input.isActive ?? existing.isActive,
    };

    this.rules.set(ruleId, updated);

    const history = this.history.get(ruleId) || [];
    const newVersion = history.length + 1;
    history.push({
      version: newVersion,
      changedAt: new Date(),
      changedBy,
      changeType: "updated",
      changes: Object.keys(changes).length > 0 ? changes : undefined,
    });
    this.history.set(ruleId, history);

    return updated;
  }

  async deactivateRule(ruleId: string, changedBy?: string): Promise<void> {
    const existing = this.rules.get(ruleId);
    if (!existing) {
      throw new Error(`Rule with ID ${ruleId} not found`);
    }

    const updated: StackingRule = {
      ...existing,
      isActive: false,
    };

    this.rules.set(ruleId, updated);

    const history = this.history.get(ruleId) || [];
    const newVersion = history.length + 1;
    history.push({
      version: newVersion,
      changedAt: new Date(),
      changedBy,
      changeType: "deactivated",
    });
    this.history.set(ruleId, history);
  }

  async getRuleHistory(ruleId: string): Promise<RuleHistoryEntry[]> {
    return this.history.get(ruleId) || [];
  }

  async getRuleVersions(ruleId: string): Promise<RuleVersion[]> {
    const rule = this.rules.get(ruleId);
    const history = this.history.get(ruleId);

    if (!rule || !history) {
      return [];
    }

    return history.map((entry) => ({
      version: entry.version,
      ruleId: rule.ruleId,
      jurisdiction: rule.jurisdiction,
      conditions: rule.conditions,
      event: rule.event,
      source: rule.source,
      isActive: rule.isActive ?? true,
      createdAt: history[0]?.changedAt ?? new Date(),
      updatedAt: entry.changedAt,
    }));
  }
}

export function createRuleService(options?: InMemoryRuleServiceOptions): RuleService {
  return new InMemoryRuleService(options ?? { rules: [] });
}
