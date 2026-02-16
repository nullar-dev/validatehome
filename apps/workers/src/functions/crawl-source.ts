import { inngest } from "../inngest.js";

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
  async ({ event, step }) => {
    const { sourceId, url } = event.data as { sourceId: string; url: string };

    const snapshot = await step.run("fetch-page", async () => {
      // Placeholder: will use Crawlee + Playwright
      return {
        sourceId,
        url,
        crawledAt: new Date().toISOString(),
        status: "pending" as const,
      };
    });

    await step.run("store-snapshot", async () => {
      // Placeholder: store raw HTML + screenshot to R2, create CrawlSnapshot record
      return { snapshotId: "placeholder", ...snapshot };
    });

    await step.run("generate-diff", async () => {
      // Placeholder: compare with previous snapshot, generate diff
      return { diffGenerated: false };
    });

    return { success: true, sourceId };
  },
);
