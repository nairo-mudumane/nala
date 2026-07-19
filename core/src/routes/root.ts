import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

export const rootRoutes = new Hono().get(
  "/",
  describeRoute({
    tags: ["System"],
    summary: "API root",
    responses: {
      200: {
        description: "Service name.",
        content: { "text/plain": { schema: { type: "string" } } },
      },
    },
  }),
  (c) => c.text("Nala Core API"),
);
