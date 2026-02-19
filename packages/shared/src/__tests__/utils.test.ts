import { describe, expect, it } from "vitest";
import {
  calculateSavingsPercentage,
  clamp,
  createBadRequestProblem,
  createConflictProblem,
  createForbiddenProblem,
  createInternalErrorProblem,
  createNotFoundProblem,
  createProblemDetail,
  createServiceUnavailableProblem,
  createTooManyRequestsProblem,
  createUnauthorizedProblem,
  createValidationProblem,
  formatCurrency,
  getCurrencyForCountry,
  isProblemDetail,
  isValidPostalCode,
  normalizePostalCode,
  PROBLEM_TYPES,
  slugify,
} from "../index.js";

describe("isValidPostalCode", () => {
  it("validates US ZIP codes", () => {
    expect(isValidPostalCode("90210", "US")).toBe(true);
    expect(isValidPostalCode("90210-1234", "US")).toBe(true);
    expect(isValidPostalCode("9021", "US")).toBe(false);
    expect(isValidPostalCode("ABCDE", "US")).toBe(false);
  });

  it("validates UK postcodes", () => {
    expect(isValidPostalCode("SW1A 1AA", "UK")).toBe(true);
    expect(isValidPostalCode("EC1A 1BB", "UK")).toBe(true);
    expect(isValidPostalCode("M1 1AE", "UK")).toBe(true);
    expect(isValidPostalCode("12345", "UK")).toBe(false);
  });

  it("validates AU postcodes", () => {
    expect(isValidPostalCode("2000", "AU")).toBe(true);
    expect(isValidPostalCode("200", "AU")).toBe(false);
    expect(isValidPostalCode("20000", "AU")).toBe(false);
  });

  it("validates CA postal codes", () => {
    expect(isValidPostalCode("K1A 0B1", "CA")).toBe(true);
    expect(isValidPostalCode("K1A0B1", "CA")).toBe(true);
    expect(isValidPostalCode("12345", "CA")).toBe(false);
  });
});

describe("normalizePostalCode", () => {
  it("normalizes UK postcodes with consistent spacing and handles short codes", () => {
    expect(normalizePostalCode("sw1a1aa", "UK")).toBe("SW1A 1AA");
    expect(normalizePostalCode("SW1A  1AA", "UK")).toBe("SW1A 1AA");
    expect(normalizePostalCode("M1", "UK")).toBe("M1");
    expect(normalizePostalCode("  e1  ", "UK")).toBe("E1");
  });

  it("normalizes CA postal codes with consistent spacing and handles non-standard lengths", () => {
    expect(normalizePostalCode("k1a0b1", "CA")).toBe("K1A 0B1");
    expect(normalizePostalCode("K1A  0B1", "CA")).toBe("K1A 0B1");
    expect(normalizePostalCode("K1A", "CA")).toBe("K1A");
    expect(normalizePostalCode("K1A0B", "CA")).toBe("K1A0B");
  });

  it("trims and uppercases US ZIP codes", () => {
    expect(normalizePostalCode("  90210  ", "US")).toBe("90210");
  });
});

describe("slugify", () => {
  it("converts text to URL-friendly slug", () => {
    expect(slugify("IRS 25C Tax Credit")).toBe("irs-25c-tax-credit");
    expect(slugify("Hello  World")).toBe("hello-world");
    expect(slugify("Special!@#Characters")).toBe("specialcharacters");
  });
});

describe("clamp", () => {
  it("clamps values within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("calculateSavingsPercentage", () => {
  it("calculates correct percentage", () => {
    expect(calculateSavingsPercentage(10000, 7000)).toBe(30);
    expect(calculateSavingsPercentage(12000, 4200)).toBe(65);
  });

  it("handles zero sticker price", () => {
    expect(calculateSavingsPercentage(0, 0)).toBe(0);
  });

  it("handles full savings", () => {
    expect(calculateSavingsPercentage(10000, 0)).toBe(100);
  });
});

describe("getCurrencyForCountry", () => {
  it("returns correct currency", () => {
    expect(getCurrencyForCountry("US")).toBe("USD");
    expect(getCurrencyForCountry("UK")).toBe("GBP");
    expect(getCurrencyForCountry("AU")).toBe("AUD");
    expect(getCurrencyForCountry("CA")).toBe("CAD");
  });
});

describe("formatCurrency", () => {
  it("formats USD amounts", () => {
    const result = formatCurrency(12000, "USD", "US");
    expect(result).toContain("12,000");
  });

  it("formats GBP amounts", () => {
    const result = formatCurrency(5000, "GBP", "UK");
    expect(result).toContain("5,000");
  });
});

describe("createProblemDetail", () => {
  it("creates a problem detail with required fields", () => {
    const result = createProblemDetail({
      type: PROBLEM_TYPES.BAD_REQUEST,
      title: "Bad Request",
      status: 400,
      detail: "Invalid input",
    });

    expect(result.type).toBe(PROBLEM_TYPES.BAD_REQUEST);
    expect(result.title).toBe("Bad Request");
    expect(result.status).toBe(400);
    expect(result.detail).toBe("Invalid input");
  });

  it("includes optional fields when provided", () => {
    const result = createProblemDetail({
      type: PROBLEM_TYPES.BAD_REQUEST,
      title: "Bad Request",
      status: 400,
      detail: "Invalid input",
      instance: "/api/v1/programs",
      traceId: "trace-123",
      errorCode: "ERR_001",
    });

    expect(result.instance).toBe("/api/v1/programs");
    expect(result.traceId).toBe("trace-123");
    expect(result.errorCode).toBe("ERR_001");
  });

  it("spreads extensions into the object", () => {
    const result = createProblemDetail({
      type: PROBLEM_TYPES.BAD_REQUEST,
      title: "Bad Request",
      status: 400,
      detail: "Invalid input",
      extensions: { extraField: "value", nested: { a: 1 } },
    });

    expect(result.extraField).toBe("value");
    expect(result.nested).toEqual({ a: 1 });
  });
});

describe("isProblemDetail", () => {
  it("returns true for valid problem detail", () => {
    const obj = {
      type: "https://example.com/problem",
      title: "Bad Request",
      status: 400,
      detail: "Invalid input",
    };
    expect(isProblemDetail(obj)).toBe(true);
  });

  it("returns false for null", () => {
    expect(isProblemDetail(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isProblemDetail(undefined)).toBe(false);
  });

  it("returns false for non-object", () => {
    expect(isProblemDetail("string")).toBe(false);
    expect(isProblemDetail(123)).toBe(false);
  });

  it("returns false when missing required fields", () => {
    expect(isProblemDetail({ type: "test" })).toBe(false);
    expect(isProblemDetail({ title: "test" })).toBe(false);
    expect(isProblemDetail({ status: 400 })).toBe(false);
    expect(isProblemDetail({ detail: "test" })).toBe(false);
  });
});

describe("createBadRequestProblem", () => {
  it("creates 400 problem", () => {
    const result = createBadRequestProblem("Invalid input");
    expect(result.status).toBe(400);
    expect(result.type).toBe(PROBLEM_TYPES.BAD_REQUEST);
  });

  it("includes traceId when provided", () => {
    const result = createBadRequestProblem("Invalid input", "trace-123");
    expect(result.traceId).toBe("trace-123");
  });
});

describe("createNotFoundProblem", () => {
  it("creates 404 problem", () => {
    const result = createNotFoundProblem("Program not found");
    expect(result.status).toBe(404);
    expect(result.type).toBe(PROBLEM_TYPES.NOT_FOUND);
  });
});

describe("createUnauthorizedProblem", () => {
  it("creates 401 problem", () => {
    const result = createUnauthorizedProblem("Not authenticated");
    expect(result.status).toBe(401);
    expect(result.type).toBe(PROBLEM_TYPES.UNAUTHORIZED);
  });
});

describe("createForbiddenProblem", () => {
  it("creates 403 problem", () => {
    const result = createForbiddenProblem("Access denied");
    expect(result.status).toBe(403);
    expect(result.type).toBe(PROBLEM_TYPES.FORBIDDEN);
  });
});

describe("createConflictProblem", () => {
  it("creates 409 problem", () => {
    const result = createConflictProblem("Resource already exists");
    expect(result.status).toBe(409);
    expect(result.type).toBe(PROBLEM_TYPES.CONFLICT);
  });
});

describe("createServiceUnavailableProblem", () => {
  it("creates 503 problem", () => {
    const result = createServiceUnavailableProblem("Service temporarily unavailable");
    expect(result.status).toBe(503);
    expect(result.type).toBe(PROBLEM_TYPES.SERVICE_UNAVAILABLE);
  });
});

describe("createTooManyRequestsProblem", () => {
  it("creates 429 problem", () => {
    const result = createTooManyRequestsProblem("Rate limit exceeded");
    expect(result.status).toBe(429);
    expect(result.type).toBe(PROBLEM_TYPES.RATE_LIMIT_EXCEEDED);
  });
});

describe("createInternalErrorProblem", () => {
  it("creates 500 problem", () => {
    const result = createInternalErrorProblem("Internal server error");
    expect(result.status).toBe(500);
    expect(result.type).toBe(PROBLEM_TYPES.INTERNAL_SERVER_ERROR);
  });
});

describe("createValidationProblem", () => {
  it("creates 422 problem with errors", () => {
    const errors = [{ field: "name", message: "Name is required" }];
    const result = createValidationProblem(errors);
    expect(result.status).toBe(422);
    expect(result.type).toBe(PROBLEM_TYPES.VALIDATION_ERROR);
    expect(result.errors).toEqual(errors);
  });
});
