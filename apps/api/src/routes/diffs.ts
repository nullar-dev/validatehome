import { diffs } from "@validatehome/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { type Context, Hono } from "hono";
import { db } from "../db.js";

type JsonRecord = Record<string, unknown>;
type ReviewAction = "approved" | "rejected";
type DiffStatusFilter = "pending" | "approved" | "rejected";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(Math.trunc(parsed), 1);
}

function getStatusFilter(value: string | undefined): DiffStatusFilter | null {
  if (!value) {
    return null;
  }
  if (value === "pending" || value === "approved" || value === "rejected") {
    return value;
  }
  return null;
}

function toDiffPayload(changes: unknown): { oldValue: string; newValue: string } {
  if (!changes || typeof changes !== "object") {
    return { oldValue: "N/A", newValue: "N/A" };
  }

  const record = changes as JsonRecord;
  const oldValue =
    typeof record.oldValue === "string"
      ? record.oldValue
      : typeof record.old === "string"
        ? record.old
        : "N/A";
  const newValue =
    typeof record.newValue === "string"
      ? record.newValue
      : typeof record.new === "string"
        ? record.new
        : "N/A";

  return { oldValue, newValue };
}

function toChangeType(diffType: string): "status" | "budget" | "deadline" | "benefit" {
  if (diffType === "visual") return "status";
  if (diffType === "semantic") return "benefit";
  return "budget";
}

async function markDiffReviewed(id: string, action: ReviewAction, actor: string): Promise<boolean> {
  const [updated] = await db
    .update(diffs)
    .set({ reviewed: true, reviewedBy: `${actor}:${action}`, reviewedAt: new Date() })
    .where(eq(diffs.id, id))
    .returning();

  return Boolean(updated);
}

async function handleReviewAction(c: Context, action: ReviewAction) {
  const id = c.req.param("id");

  if (!UUID_PATTERN.test(id)) {
    return c.json({ error: "Invalid diff id format" }, 400);
  }

  const apiKey = c.get("apiKey") as
    | {
        id: string;
        tier: "free" | "pro" | "enterprise";
      }
    | undefined;
  if (!apiKey || apiKey.tier !== "enterprise") {
    return c.json({ error: "Forbidden" }, 403);
  }

  const updated = await markDiffReviewed(id, action, `apikey:${apiKey.id}`);

  if (!updated) {
    return c.json({ error: "Diff not found" }, 404);
  }

  return c.json({ success: true, data: { id } });
}

export const diffRoutes = new Hono()
  .get("/", async (c) => {
    const status = c.req.query("status");
    const statusFilter = getStatusFilter(status);
    if (status && statusFilter === null) {
      return c.json({ error: "Invalid status filter" }, 400);
    }

    const page = toPositiveInt(c.req.query("page"), 1);
    const limit = Math.min(toPositiveInt(c.req.query("limit"), 20), 100);
    const start = Math.max(Number(c.req.query("_start") ?? (page - 1) * limit), 0);
    const end = Math.max(Number(c.req.query("_end") ?? start + limit), start + 1);
    const resolvedLimit = Math.min(Math.max(end - start, 1), 100);

    const whereClause =
      statusFilter === "pending"
        ? eq(diffs.reviewed, false)
        : statusFilter === "approved" || statusFilter === "rejected"
          ? eq(diffs.reviewed, true)
          : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(diffs)
      .where(whereClause ?? sql`true`);

    const rows = await db
      .select()
      .from(diffs)
      .where(whereClause ?? sql`true`)
      .orderBy(desc(diffs.createdAt))
      .limit(resolvedLimit)
      .offset(start);

    const data = rows
      .map((row) => {
        const values = toDiffPayload(row.changesJson);
        const reviewedBy = row.reviewedBy ?? "";
        const statusValue = !row.reviewed
          ? "pending"
          : reviewedBy.includes(":rejected")
            ? "rejected"
            : "approved";

        if (statusFilter === "approved" && statusValue !== "approved") {
          return null;
        }
        if (statusFilter === "rejected" && statusValue !== "rejected") {
          return null;
        }

        return {
          id: row.id,
          programId: row.sourceId,
          programName: `Source ${row.sourceId.slice(0, 8)}`,
          changeType: toChangeType(row.diffType),
          oldValue: values.oldValue,
          newValue: values.newValue,
          confidence: Math.max(0, Math.min(1, row.significanceScore / 100)),
          createdAt: row.createdAt.toISOString(),
          status: statusValue,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    c.header("x-total-count", String(countResult?.count ?? data.length));
    c.header("Access-Control-Expose-Headers", "x-total-count");

    return c.json({ data, total: countResult?.count ?? data.length });
  })
  .post("/:id/approve", async (c) => {
    return handleReviewAction(c, "approved");
  })
  .post("/:id/reject", async (c) => {
    return handleReviewAction(c, "rejected");
  });
