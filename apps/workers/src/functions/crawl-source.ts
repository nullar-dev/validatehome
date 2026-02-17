import { createWorkerDb } from "../db.js";
import { inngest } from "../inngest.js";
import { executeCrawl } from "../pipeline/crawl-executor.js";

export const crawlSource = inngest.createFunction(
  {
    id: "crawl-source",
    retries: 3,
    concurrency: [
      {
        limit: 5,
        scope: "fn",
      },
    ],
  },
  { event: "crawl/source.scheduled" },
  async ({ event }) => {
    const { sourceId } = event.data as { sourceId: string };
    const db = createWorkerDb();
    try {
      return await executeCrawl(db, { sourceId });
    } finally {
      await db.close();
    }
  },
);
