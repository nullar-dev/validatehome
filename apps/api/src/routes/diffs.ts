import { createDb } from "@validatehome/db";
import { diffs } from "@validatehome/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { type Context, Hono } from "hono";

const db = createDb(process.env.DATABASE_URL ?? "postgresql://localhost:5432/validatehome");

type JsonRecord = Record<string, unknown>;
type ReviewAction = "approved" | "rejected";

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

async function markDiffReviewed(id: string, action: ReviewAction): Promise<boolean> {
  const [updated] = await db
    .update(diffs)
    .set({ reviewed: true, reviewedBy: `admin:${action}`, reviewedAt: new Date() })
    .where(eq(diffs.id, id))
    .returning();

  return Boolean(updated);
}

async function handleReviewAction(c: Context, action: ReviewAction) {
  const id = c.req.param("id");
  const updated = await markDiffReviewed(id, action);

  if (!updated) {
    return c.json({ error: "Diff not found" }, 404);
  }

  return c.json({ success: true, data: { id } });
}

export const diffRoutes = new Hono()
  .get("/", async (c) => {
    const status = c.req.query("status");
    const page = Math.max(Number(c.req.query("page") ?? "1"), 1);
    const limit = Math.min(Math.max(Number(c.req.query("limit") ?? "20"), 1), 100);
    const start = Number(c.req.query("_start") ?? (page - 1) * limit);
    const end = Number(c.req.query("_end") ?? start + limit);
    const resolvedLimit = Math.min(Math.max(end - start, 1), 100);

    const whereClause =
      status === "pending"
        ? eq(diffs.reviewed, false)
        : status === "approved" || status === "rejected"
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

    const data = rows.map((row) => {
      const values = toDiffPayload(row.changesJson);
      const reviewedBy = row.reviewedBy ?? "";
      const statusValue = !row.reviewed
        ? "pending"
        : reviewedBy.includes(":rejected")
          ? "rejected"
          : "approved";

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
    });

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
