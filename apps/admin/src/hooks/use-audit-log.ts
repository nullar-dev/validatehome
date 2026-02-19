import { getStoredApiKey } from "../auth-provider";

export type AuditAction =
  | "program.create"
  | "program.update"
  | "program.delete"
  | "program.view"
  | "diff.approve"
  | "diff.reject"
  | "diff.view"
  | "rule.test";

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  success: boolean;
}

function generateAuditId(): string {
  return `audit-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

async function persistAuditEntry(entry: AuditEntry): Promise<void> {
  try {
    const apiKey = getStoredApiKey();
    const response = await fetch("/v1/audit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey ?? ""}`,
      },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      // biome-ignore lint/suspicious/noConsole: audit logging requires visibility
      console.error("[Audit] Failed to persist to API:", response.statusText);
    }
  } catch {
    // biome-ignore lint/suspicious/noConsole: audit logging requires visibility
    console.error("[Audit] Could not reach audit API endpoint");
  }
}

export function useAuditLog() {
  const logAction = async (
    action: AuditAction,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, unknown>,
    success = true,
  ): Promise<void> => {
    const entry: AuditEntry = {
      id: generateAuditId(),
      timestamp: new Date().toISOString(),
      userId: "admin-user",
      action,
      resourceType,
      resourceId,
      details,
      success,
    };

    // biome-ignore lint/suspicious/noConsole: audit logging requires visibility
    console.info("[Audit]", entry);

    await persistAuditEntry(entry);
  };

  return {
    logAction,
    logProgramCreate: (programId: string, details?: Record<string, unknown>) =>
      logAction("program.create", "program", programId, details),
    logProgramUpdate: (programId: string, details?: Record<string, unknown>) =>
      logAction("program.update", "program", programId, details),
    logProgramDelete: (programId: string, details?: Record<string, unknown>) =>
      logAction("program.delete", "program", programId, details),
    logProgramView: (programId: string, details?: Record<string, unknown>) =>
      logAction("program.view", "program", programId, details),
    logDiffApprove: (diffId: string, details?: Record<string, unknown>) =>
      logAction("diff.approve", "diff", diffId, details),
    logDiffReject: (diffId: string, details?: Record<string, unknown>) =>
      logAction("diff.reject", "diff", diffId, details),
    logDiffView: (diffId: string, details?: Record<string, unknown>) =>
      logAction("diff.view", "diff", diffId, details),
    logRuleTest: (details?: Record<string, unknown>) =>
      logAction("rule.test", "rule", undefined, details),
  };
}
