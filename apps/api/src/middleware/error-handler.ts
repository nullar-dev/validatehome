import {
  createProblemDetail,
  isProblemDetail,
  PROBLEM_TYPES,
  type ProblemDetail,
} from "@validatehome/shared";
import type { Context, Next } from "hono";

/**
 * Generates a unique trace ID for request tracking.
 * @returns A trace ID string with timestamp and random suffix
 */
function generateTraceId(): string {
  return `trace-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Configuration options for the error handler middleware.
 */
export interface ErrorHandlerConfig {
  /** Whether to include stack traces in error responses (default: false) */
  includeStackTrace?: boolean;
}

/**
 * Middleware that catches unhandled errors and converts them to RFC 9457 Problem Detail responses.
 * Also handles already-serialized JSON error responses to ensure consistent format.
 * @param config - Configuration options for error handling
 * @returns Hono middleware function
 */
export function errorHandler(config: ErrorHandlerConfig = {}) {
  return async (c: Context, next: Next) => {
    await next();

    if (!c.res.headers.get("content-type")) {
      return;
    }

    const contentType = c.res.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return;
    }

    if (!c.error) {
      return;
    }

    const traceId = c.get("traceId") || generateTraceId();

    const errorWithStatus = c.error as Error & { status?: number };
    const status = errorWithStatus.status || 500;
    const problemDetail = createErrorProblemDetail(
      errorWithStatus,
      status,
      traceId,
      config.includeStackTrace,
    );

    c.status(status as Parameters<typeof c.status>[0]);
    return c.json(problemDetail);
  };
}

function createErrorProblemDetail(
  error: Error & { status?: number },
  status: number,
  traceId: string,
  includeStackTrace?: boolean,
): ProblemDetail {
  const extensions: Record<string, unknown> = {};

  if (includeStackTrace && error.stack) {
    extensions.stack = error.stack;
  }

  let type: string = PROBLEM_TYPES.INTERNAL_SERVER_ERROR;
  let title = "Internal Server Error";

  switch (status) {
    case 400:
      type = PROBLEM_TYPES.BAD_REQUEST;
      title = "Bad Request";
      break;
    case 401:
      type = PROBLEM_TYPES.UNAUTHORIZED;
      title = "Unauthorized";
      break;
    case 403:
      type = PROBLEM_TYPES.FORBIDDEN;
      title = "Forbidden";
      break;
    case 404:
      type = PROBLEM_TYPES.NOT_FOUND;
      title = "Not Found";
      break;
    case 409:
      type = PROBLEM_TYPES.CONFLICT;
      title = "Conflict";
      break;
    case 422:
      type = PROBLEM_TYPES.UNPROCESSABLE_ENTITY;
      title = "Unprocessable Entity";
      break;
    case 429:
      type = PROBLEM_TYPES.RATE_LIMIT_EXCEEDED;
      title = "Rate Limit Exceeded";
      break;
    case 503:
      type = PROBLEM_TYPES.SERVICE_UNAVAILABLE;
      title = "Service Unavailable";
      break;
  }

  const detail = error.message || "An unexpected error occurred";

  return createProblemDetail({
    type,
    title,
    status,
    detail,
    traceId,
    errorCode: error.name,
    extensions,
  });
}

export function handleHonoError(error: unknown): ProblemDetail {
  const traceId = generateTraceId();

  if (isProblemDetail(error)) {
    return error;
  }

  const err = error as Error & { status?: number };
  return createErrorProblemDetail(err, err.status || 500, traceId, false);
}
