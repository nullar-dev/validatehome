import {
  crawlDlqRepo,
  crawlJobRepo,
  crawlSnapshotRepo,
  type Database,
  diffRepo,
  sourceRepo,
} from "@validatehome/db";
import { buildDiffRecords } from "./diff-runner.js";
import { fetchSourceWithRetry } from "./fetch-client.js";
import { createIngestionKey, createTraceId, hashContent } from "./idempotency.js";
import { runParsePipeline } from "./parse-runner.js";
import { getSourceOrThrow } from "./source-registry.js";
import { logStructuredEvent } from "./telemetry.js";
import type { CrawlErrorClass } from "./types.js";

export interface CrawlExecutionInput {
  readonly sourceId: string;
  readonly traceId?: string;
  readonly jobId?: string;
  readonly attempt?: number;
}

interface CrawlDependencies {
  readonly sourceRepository: ReturnType<typeof sourceRepo>;
  readonly snapshotRepository: ReturnType<typeof crawlSnapshotRepo>;
  readonly diffRepository: ReturnType<typeof diffRepo>;
  readonly jobRepository: ReturnType<typeof crawlJobRepo>;
  readonly dlqRepository: ReturnType<typeof crawlDlqRepo>;
}

function classifyFailure(error: Error): CrawlErrorClass {
  const message = error.message.toLowerCase();
  if (message.includes("policy blocked") || message.includes("blocked host")) {
    return "policy_blocked";
  }
  if (
    message.includes("timeout") ||
    message.includes("fetch failed") ||
    message.includes("network")
  ) {
    return "transient";
  }
  return "permanent";
}

async function createOrResumeJob(
  deps: CrawlDependencies,
  sourceId: string,
  input: CrawlExecutionInput,
  traceId: string,
) {
  if (input.jobId !== undefined) {
    return deps.jobRepository.markRunning(input.jobId);
  }
  return deps.jobRepository.create({
    sourceId,
    status: "running",
    attempt: input.attempt ?? 1,
    traceId,
    startedAt: new Date(),
  });
}

async function persistDiffs(
  deps: CrawlDependencies,
  sourceId: string,
  previousSnapshot: Awaited<ReturnType<ReturnType<typeof crawlSnapshotRepo>["findLatestBySource"]>>,
  newSnapshotId: string,
  currentContent: string,
): Promise<void> {
  if (!(previousSnapshot?.metadata && typeof previousSnapshot.metadata === "object")) {
    return;
  }

  const previousContent =
    "rawContent" in previousSnapshot.metadata &&
    typeof previousSnapshot.metadata.rawContent === "string"
      ? previousSnapshot.metadata.rawContent
      : "";

  const diffRecords = buildDiffRecords(previousContent, currentContent);
  for (const record of diffRecords) {
    await deps.diffRepository.create({
      sourceId,
      oldSnapshotId: previousSnapshot.id,
      newSnapshotId,
      diffType: record.diffType,
      significanceScore: record.significanceScore,
      changesJson: record.changesJson,
    });
  }
}

async function handleExecutionError(
  deps: CrawlDependencies,
  sourceId: string,
  jobId: string,
  traceId: string,
  attempt: number,
  error: unknown,
  durationMs: number,
): Promise<{ readonly success: false; readonly traceId: string; readonly jobId: string }> {
  const message = error instanceof Error ? error.message : "Unknown error";
  const typedError = error instanceof Error ? error : new Error(message);
  const errorClass = classifyFailure(typedError);

  if (errorClass === "policy_blocked") {
    await deps.jobRepository.markPolicyBlocked(jobId, message);
  } else {
    await deps.jobRepository.markFailed(jobId, errorClass, message);
  }

  await deps.dlqRepository.create({
    sourceId,
    jobId,
    reason: message,
    errorClass,
    payload: {
      sourceId,
      traceId,
      attempt,
    },
  });

  logStructuredEvent({
    traceId,
    sourceId,
    stage: "crawl-execute",
    durationMs,
    result: "error",
    details: { errorClass, message },
  });

  return { success: false, traceId, jobId };
}

export async function executeCrawl(
  db: Database,
  input: CrawlExecutionInput,
): Promise<{
  readonly success: boolean;
  readonly traceId: string;
  readonly jobId: string;
}> {
  const traceId = input.traceId ?? createTraceId();
  const source = await getSourceOrThrow(db, input.sourceId);
  const deps: CrawlDependencies = {
    sourceRepository: sourceRepo(db),
    snapshotRepository: crawlSnapshotRepo(db),
    diffRepository: diffRepo(db),
    jobRepository: crawlJobRepo(db),
    dlqRepository: crawlDlqRepo(db),
  };

  const job = await createOrResumeJob(deps, source.id, input, traceId);

  const startedAt = Date.now();
  try {
    const previousSnapshot = await deps.snapshotRepository.findLatestBySource(source.id);
    const fetched = await fetchSourceWithRetry(source);

    await deps.sourceRepository.markCrawled(source.id, fetched.etag, fetched.lastModified);

    if (fetched.notModified) {
      await deps.jobRepository.markSucceeded(job.id, false, [], {
        stage: "fetch",
        status: 304,
        fetchStatus: 304,
        robotsReason: fetched.robotsReason,
      });
      logStructuredEvent({
        traceId,
        sourceId: source.id,
        stage: "fetch",
        durationMs: Date.now() - startedAt,
        result: "ok",
        details: { status: 304 },
      });
      return { success: true, traceId, jobId: job.id };
    }

    const contentHash = hashContent(fetched.content);
    const ingestionKey = createIngestionKey(source.id, contentHash, fetched.fetchedAt);
    const snapshot = await deps.snapshotRepository.createIdempotent({
      sourceId: source.id,
      crawledAt: fetched.fetchedAt,
      httpStatus: fetched.statusCode,
      fetchStatus: fetched.notModified ? "not_modified" : "fetched",
      contentHash,
      ingestionKey,
      rawHtmlPath: `artifacts/${source.id}/${fetched.fetchedAt.toISOString()}/${contentHash}.html`,
      metadata: {
        traceId,
        etag: fetched.etag,
        lastModified: fetched.lastModified,
        robotsReason: fetched.robotsReason,
        rawContent: fetched.content,
      },
    });

    const parseOutcome = await runParsePipeline(source, fetched.content);

    await persistDiffs(deps, source.id, previousSnapshot, snapshot.id, fetched.content);

    await deps.jobRepository.markSucceeded(
      job.id,
      parseOutcome.reviewRequired,
      parseOutcome.reviewReasons,
      {
        quality: parseOutcome.quality,
        snapshotId: snapshot.id,
        fetchStatus: fetched.statusCode,
      },
    );

    logStructuredEvent({
      traceId,
      sourceId: source.id,
      stage: "crawl-execute",
      durationMs: Date.now() - startedAt,
      result: "ok",
      details: {
        reviewRequired: parseOutcome.reviewRequired,
        quality: parseOutcome.quality,
      },
    });

    return {
      success: true,
      traceId,
      jobId: job.id,
    };
  } catch (error) {
    return handleExecutionError(
      deps,
      source.id,
      job.id,
      traceId,
      input.attempt ?? 1,
      error,
      Date.now() - startedAt,
    );
  }
}
