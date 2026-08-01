import { syncUserFromWebhook, verifyClerkWebhook } from "@nala/auth";
import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import { ErrorSchema } from "../schemas";

export const WEBHOOK_PATH = "/api/webhooks/clerk";

const WebhookResultSchema = z
  .object({
    received: z.literal(true),
    /** False for event types this endpoint acknowledges but does not act on. */
    applied: z.boolean(),
  })
  .meta({ id: "WebhookResult" });

/**
 * Clerk → Nala user sync.
 *
 * Mounted **before** `sessionMiddleware`: a webhook carries a Standard Webhooks
 * signature, not a session, and running session resolution on it would be a
 * wasted round trip to Clerk on every event.
 *
 * `verifyClerkWebhook` is the only trust boundary here — an unsigned or replayed
 * POST never reaches the database. A `400` makes Clerk retry with backoff, which
 * is what we want for a bad signature *and* for a transient database failure.
 */
export const webhookRoutes = new Hono().post(
  WEBHOOK_PATH,
  describeRoute({
    tags: ["Webhooks"],
    summary: "Clerk user events",
    description:
      "Receives `user.created`, `user.updated`, and `user.deleted` from Clerk " +
      "and mirrors them into the local `user` table. Authenticated by the " +
      "`svix-*` signature headers, not by a session — configure the endpoint " +
      "and its signing secret at https://dashboard.clerk.com → Webhooks.",
    responses: {
      200: {
        description: "Event verified and handled.",
        content: {
          "application/json": { schema: resolver(WebhookResultSchema) },
        },
      },
      400: {
        description: "Invalid signature, or the sync failed.",
        content: { "application/json": { schema: resolver(ErrorSchema) } },
      },
    },
  }),
  async (c) => {
    try {
      const event = await verifyClerkWebhook(c.req.raw);
      const applied = await syncUserFromWebhook(event);

      return c.json({ received: true as const, applied });
    } catch (error) {
      console.error("[core] Clerk webhook rejected:", error);

      return c.json({ error: "Webhook verification failed" }, 400);
    }
  },
);
