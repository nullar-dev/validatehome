import { Hono } from "hono";

export const calculatorRoutes = new Hono().get("/", (c) => {
  const zip = c.req.query("zip");
  const category = c.req.query("category");
  const cost = c.req.query("cost");

  if (!zip || !category) {
    return c.json(
      {
        success: false,
        error: "Missing required parameters: zip, category",
        code: "MISSING_PARAMS",
      },
      400,
    );
  }

  const stickerPrice = cost ? Number(cost) : 0;

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
