import { createHash, randomUUID } from "node:crypto";

export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function createIngestionKey(sourceId: string, contentHash: string, fetchedAt: Date): string {
  const bucketedTimestamp = new Date(fetchedAt);
  bucketedTimestamp.setSeconds(0, 0);
  return createHash("sha256")
    .update(`${sourceId}:${contentHash}:${bucketedTimestamp.toISOString()}`)
    .digest("hex");
}

export function createTraceId(): string {
  return randomUUID();
}
