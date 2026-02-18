import { createWorkerDb } from "../db.js";
import { inngest } from "../inngest.js";
import { listDueSources } from "../pipeline/source-registry.js";

export const scheduleCrawls = inngest.createFunction(
  {
    id: "schedule-crawls",
  },
  { cron: "*/30 * * * *" },
  async ({ step }) => {
    const db = createWorkerDb();
    try {
      const dueSources = await step.run("load-due-sources", async () => listDueSources(db));
      await step.run("emit-crawl-events", async () => {
        for (const source of dueSources) {
          await inngest.send({
            name: "crawl/source.scheduled",
            data: { sourceId: source.id },
          });
        }
      });
      return { scheduledCount: dueSources.length };
    } finally {
      await db.close();
    }
  },
);
