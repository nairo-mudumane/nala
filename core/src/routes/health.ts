import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";

export const HealthSchema = z
  .object({ status: z.literal("ok") })
  .meta({ id: "Health" });

export const healthRoutes = new Hono().get(
  "/health",
  describeRoute({
    tags: ["System"],
    summary: "Health check",
    responses: {
      200: {
        description: "Server running.",
        content: { "application/json": { schema: resolver(HealthSchema) } },
      },
    },
  }),
  (c) => c.json({ status: "ok" as const }),
);
