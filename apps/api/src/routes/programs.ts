import { Hono } from "hono";

export const programRoutes = new Hono()
  .get("/", (c) => {
    const jurisdiction = c.req.query("jurisdiction");
    const category = c.req.query("category");
    const status = c.req.query("status");

    return c.json({
      success: true,
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 20,
        filters: { jurisdiction, category, status },
      },
    });
  })
  .get("/:id", (c) => {
    const id = c.req.param("id");

    return c.json({
      success: true,
      data: null,
      meta: { id },
    });
  })
  .get("/:id/history", (c) => {
    const id = c.req.param("id");

    return c.json({
      success: true,
      data: [],
      meta: { programId: id },
    });
  })
  .get("/changes", (c) => {
    const since = c.req.query("since");

    return c.json({
      success: true,
      data: [],
      meta: { since },
    });
  });
