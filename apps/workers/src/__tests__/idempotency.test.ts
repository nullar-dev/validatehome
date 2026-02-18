import { describe, expect, it } from "vitest";
import { createIngestionKey, hashContent } from "../pipeline/idempotency.js";

describe("idempotency", () => {
  it("produces stable hash for same content", () => {
    expect(hashContent("hello")).toBe(hashContent("hello"));
  });

  it("produces same ingestion key in same minute bucket", () => {
    const a = createIngestionKey("source-1", "hash-1", new Date("2026-02-17T10:20:15Z"));
    const b = createIngestionKey("source-1", "hash-1", new Date("2026-02-17T10:20:59Z"));
    expect(a).toBe(b);
  });

  it("produces different key when content differs", () => {
    const a = createIngestionKey("source-1", "hash-a", new Date("2026-02-17T10:20:15Z"));
    const b = createIngestionKey("source-1", "hash-b", new Date("2026-02-17T10:20:15Z"));
    expect(a).not.toBe(b);
  });
});
