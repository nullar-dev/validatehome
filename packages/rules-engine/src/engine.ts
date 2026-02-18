import { Engine } from "json-rules-engine";
import type { ProgramFact, StackabilityResult, StackingRule } from "./types.js";

export function createRulesEngine(rules: readonly StackingRule[]) {
  const engine = new Engine([], { allowUndefinedFacts: true });

  for (const rule of rules) {
    engine.addRule({
      conditions: rule.conditions as Parameters<typeof engine.addRule>[0]["conditions"],
      event: rule.event,
      priority: 1,
    });
  }

  return engine;
}

export async function evaluateStackability(
  engine: Engine,
  programA: ProgramFact,
  programB: ProgramFact,
): Promise<StackabilityResult> {
  const facts = {
    "program_a.id": programA.id,
    "program_a.name": programA.name,
    "program_a.type": programA.type,
    "program_a.level": programA.level,
    "program_a.code": programA.code,
    "program_a.jurisdiction": programA.jurisdiction,
    "program_a.incomeRestricted": programA.incomeRestricted,
    "program_a.installationDate": programA.installationDate,
    "program_a.replacesExisting": programA.replacesExisting,
    "program_a.category": programA.category,
    "program_b.id": programB.id,
    "program_b.name": programB.name,
    "program_b.type": programB.type,
    "program_b.level": programB.level,
    "program_b.code": programB.code,
    "program_b.jurisdiction": programB.jurisdiction,
    "program_b.incomeRestricted": programB.incomeRestricted,
    "program_b.installationDate": programB.installationDate,
    "program_b.replacesExisting": programB.replacesExisting,
    "program_b.category": programB.category,
  };

  const { events } = await engine.run(facts);

  if (events.length === 0) {
    return {
      canStack: true,
      explanation: "No stacking restrictions found. Programs can be combined.",
    };
  }

  const event = events[0];
  if (!event) {
    return {
      canStack: true,
      explanation: "No stacking restrictions found. Programs can be combined.",
    };
  }

  const params = event.params as StackabilityResult;

  if (event.type === "not_stackable") {
    return {
      canStack: false,
      explanation: params.explanation,
      source: params.source,
    };
  }

  return {
    canStack: event.type === "stackable",
    explanation: params.explanation,
    order: params.order,
    cap: params.cap,
    reductionPct: params.reductionPct,
    source: params.source,
  };
}
