export interface ProblemDetail {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly instance?: string;
  readonly traceId?: string;
  readonly errorCode?: string;
  readonly [key: string]: unknown;
}

export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code?: string;
}

export interface ValidationProblemDetail extends ProblemDetail {
  readonly errors?: readonly ValidationError[];
}

export type HttpProblemDetail = ProblemDetail | ValidationProblemDetail;

export const PROBLEM_TYPES = {
  BAD_REQUEST: "https://validatehome.com/problems/bad-request",
  UNAUTHORIZED: "https://validatehome.com/problems/unauthorized",
  FORBIDDEN: "https://validatehome.com/problems/forbidden",
  NOT_FOUND: "https://validatehome.com/problems/not-found",
  CONFLICT: "https://validatehome.com/problems/conflict",
  UNPROCESSABLE_ENTITY: "https://validatehome.com/problems/unprocessable-entity",
  INTERNAL_SERVER_ERROR: "https://validatehome.com/problems/internal-server-error",
  SERVICE_UNAVAILABLE: "https://validatehome.com/problems/service-unavailable",
  VALIDATION_ERROR: "https://validatehome.com/problems/validation-error",
  RATE_LIMIT_EXCEEDED: "https://validatehome.com/problems/rate-limit-exceeded",
} as const;

export function createProblemDetail(params: {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  traceId?: string;
  errorCode?: string;
  extensions?: Record<string, unknown>;
}): ProblemDetail {
  return {
    type: params.type,
    title: params.title,
    status: params.status,
    detail: params.detail,
    instance: params.instance,
    traceId: params.traceId,
    errorCode: params.errorCode,
    ...params.extensions,
  };
}

export function createBadRequestProblem(detail: string, traceId?: string): ProblemDetail {
  return createProblemDetail({
    type: PROBLEM_TYPES.BAD_REQUEST,
    title: "Bad Request",
    status: 400,
    detail,
    traceId,
  });
}

export function createNotFoundProblem(detail: string, traceId?: string): ProblemDetail {
  return createProblemDetail({
    type: PROBLEM_TYPES.NOT_FOUND,
    title: "Not Found",
    status: 404,
    detail,
    traceId,
  });
}

export function createValidationProblem(
  errors: readonly ValidationError[],
  traceId?: string,
): ValidationProblemDetail {
  return createProblemDetail({
    type: PROBLEM_TYPES.VALIDATION_ERROR,
    title: "Validation Error",
    status: 422,
    detail: "Request validation failed",
    traceId,
    extensions: { errors },
  }) as ValidationProblemDetail;
}

export function createInternalErrorProblem(detail: string, traceId?: string): ProblemDetail {
  return createProblemDetail({
    type: PROBLEM_TYPES.INTERNAL_SERVER_ERROR,
    title: "Internal Server Error",
    status: 500,
    detail,
    traceId,
  });
}

export function createUnauthorizedProblem(detail: string, traceId?: string): ProblemDetail {
  return createProblemDetail({
    type: PROBLEM_TYPES.UNAUTHORIZED,
    title: "Unauthorized",
    status: 401,
    detail,
    traceId,
  });
}

export function createForbiddenProblem(detail: string, traceId?: string): ProblemDetail {
  return createProblemDetail({
    type: PROBLEM_TYPES.FORBIDDEN,
    title: "Forbidden",
    status: 403,
    detail,
    traceId,
  });
}

export function createConflictProblem(detail: string, traceId?: string): ProblemDetail {
  return createProblemDetail({
    type: PROBLEM_TYPES.CONFLICT,
    title: "Conflict",
    status: 409,
    detail,
    traceId,
  });
}

export function createServiceUnavailableProblem(detail: string, traceId?: string): ProblemDetail {
  return createProblemDetail({
    type: PROBLEM_TYPES.SERVICE_UNAVAILABLE,
    title: "Service Unavailable",
    status: 503,
    detail,
    traceId,
  });
}

export function createTooManyRequestsProblem(detail: string, traceId?: string): ProblemDetail {
  return createProblemDetail({
    type: PROBLEM_TYPES.RATE_LIMIT_EXCEEDED,
    title: "Too Many Requests",
    status: 429,
    detail,
    traceId,
  });
}

export function isProblemDetail(obj: unknown): obj is ProblemDetail {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.type === "string" &&
    typeof o.title === "string" &&
    typeof o.status === "number" &&
    typeof o.detail === "string"
  );
}
