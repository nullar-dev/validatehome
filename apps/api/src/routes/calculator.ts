import { createBadRequestProblem } from "@validatehome/shared";
import { Hono } from "hono";

/** Calculator API routes for net-cost calculations */
export const calculatorRoutes = new Hono().get("/", (c) => {
  const zip = c.req.query("zip");
  const category = c.req.query("category");
  const cost = c.req.query("cost");

  if (!zip) {
    const problem = createBadRequestProblem("Missing required parameter: zip");
    return c.json(problem, 400);
  }

  if (!category) {
    const problem = createBadRequestProblem("Missing required parameter: category");
    return c.json(problem, 400);
  }

  const stickerPrice = cost ? Number(cost) : 0;

  if (Number.isNaN(stickerPrice)) {
    const problem = createBadRequestProblem("Invalid 'cost' parameter: must be a valid number");
    return c.json(problem, 400);
  }

  return c.json({
    success: true,
    data: {
      stickerPrice,
      netCost: stickerPrice,
      totalSavings: 0,
      savingsPct: 0,
      currency: "USD",
      incentivesApplied: [],
      stackingNotes: [],
      disclaimers: [
        "Estimates only. Actual amounts depend on final installation cost and eligibility verification.",
      ],
      lastVerified: new Date().toISOString(),
    },
  });
});
