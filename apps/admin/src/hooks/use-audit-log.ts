import { useState } from "react";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: "create" | "update" | "delete" | "view";
  resource: string;
  resourceId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  ipAddress?: string;
  userAgent?: string;
}

export interface UseAuditLogOptions {
  resource: string;
}

export function useAuditLog(_options: UseAuditLogOptions) {
  const [isLogging, setIsLogging] = useState(false);

  const logAction = async (
    action: AuditLogEntry["action"],
    resourceId: string,
    changes?: AuditLogEntry["changes"],
  ) => {
    setIsLogging(true);
    try {
      const entry: AuditLogEntry = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: "current-user",
        action,
        resource: _options.resource,
        resourceId: resourceId,
        changes,
        ipAddress: typeof window !== "undefined" ? "browser" : "server",
        userAgent: typeof window !== "undefined" ? navigator.userAgent : "server",
      };
      void entry;
    } catch {
      // Silent fail for audit logging
    } finally {
      setIsLogging(false);
    }
  };

  const logCreate = (resourceId: string) => {
    return logAction("create", resourceId);
  };

  const logUpdate = (resourceId: string) => {
    return logAction("update", resourceId);
  };

  const logDelete = (resourceId: string) => {
    return logAction("delete", resourceId);
  };

  const logView = (resourceId: string) => {
    return logAction("view", resourceId);
  };

  return {
    logCreate,
    logUpdate,
    logDelete,
    logView,
    isLogging,
  };
}
