import type { Context, Next } from "hono";
import { z } from "zod";

export function validateBody<T extends z.ZodType>(schema: T) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const result = schema.safeParse(body);

      if (!result.success) {
        return c.json(
          {
            type: "https://validatehome.com/errors/validation",
            title: "Validation Error",
            status: 400,
            detail: "Request body validation failed",
            errors: result.error.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })),
          },
          400,
        );
      }

      c.set("validatedBody", result.data);
      await next();
    } catch {
      return c.json(
        {
          type: "https://validatehome.com/errors/invalid-json",
          title: "Invalid JSON",
          status: 400,
          detail: "Request body is not valid JSON",
        },
        400,
      );
    }
  };
}

export function validateQuery<T extends z.ZodType>(schema: T) {
  return async (c: Context, next: Next) => {
    const query = c.req.query();
    const result = schema.safeParse(query);

    if (!result.success) {
      return c.json(
        {
          type: "https://validatehome.com/errors/validation",
          title: "Validation Error",
          status: 400,
          detail: "Query parameter validation failed",
          errors: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        400,
      );
    }

    c.set("validatedQuery", result.data);
    await next();
  };
}

export const commonSchemas = {
  uuid: z.string().uuid(),
  country: z.enum(["US", "UK", "AU", "CA"]),
  status: z.enum(["open", "waitlist", "reserved", "funded", "closed", "coming_soon"]),
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  programCreate: z.object({
    name: z.string().min(1).max(255),
    slug: z
      .string()
      .min(1)
      .max(255)
      .regex(/^[a-z0-9-]+$/),
    jurisdictionId: z.string().uuid(),
    description: z.string().max(5000).optional(),
    status: z
      .enum(["open", "waitlist", "reserved", "funded", "closed", "coming_soon"])
      .default("open"),
    programUrl: z.string().url().optional(),
    budgetTotal: z
      .string()
      .regex(/^\d+(\.\d{2})?$/)
      .optional(),
    budgetRemaining: z
      .string()
      .regex(/^\d+(\.\d{2})?$/)
      .optional(),
    budgetPctUsed: z.number().int().min(0).max(100).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    applicationDeadline: z.string().datetime().optional(),
  }),
  programUpdate: z.object({
    name: z.string().min(1).max(255).optional(),
    slug: z
      .string()
      .min(1)
      .max(255)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    description: z.string().max(5000).optional(),
    status: z.enum(["open", "waitlist", "reserved", "funded", "closed", "coming_soon"]).optional(),
    programUrl: z.string().url().optional(),
    budgetTotal: z
      .string()
      .regex(/^\d+(\.\d{2})?$/)
      .optional(),
    budgetRemaining: z
      .string()
      .regex(/^\d+(\.\d{2})?$/)
      .optional(),
    budgetPctUsed: z.number().int().min(0).max(100).optional(),
    startDate: z.string().datetime().nullable().optional(),
    endDate: z.string().datetime().nullable().optional(),
    applicationDeadline: z.string().datetime().nullable().optional(),
  }),
};
