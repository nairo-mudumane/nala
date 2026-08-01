import { getOrSyncUser } from "@nala/auth";
import { meSchema } from "@nala/schemas/user";
import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import { type AuthVariables, requireAuth } from "../auth";
import { ErrorSchema } from "../schemas";

export const meRoutes = new Hono<{ Variables: AuthVariables }>().get(
  "/",
  describeRoute({
    tags: ["System"],
    summary: "Current session user",
    description:
      "Requires a valid Clerk session token, sent as `Authorization: Bearer " +
      "<token>` or as Clerk's session cookie on a same-origin request.",
    security: [{ clerkSessionToken: [] }],
    responses: {
      200: {
        description: "Authenticated user.",
        content: { "application/json": { schema: resolver(meSchema) } },
      },
      401: {
        description: "No valid session.",
        content: { "application/json": { schema: resolver(ErrorSchema) } },
      },
    },
  }),
  requireAuth,
  async (c) => {
    // biome-ignore lint/style/noNonNullAssertion: requireAuth already rejected the null case.
    const user = await getOrSyncUser(c.var.userId!);

    return c.json({ user });
  },
);
