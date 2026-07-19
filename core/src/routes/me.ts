import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import { type AuthVariables, requireAuth } from "../auth";
import { ErrorSchema } from "../schemas";

export const UserSchema = z
  .object({
    id: z.string().meta({ example: "V1StGXR8_Z5jdHi6B-myT" }),
    name: z.string(),
    email: z.email(),
    emailVerified: z.boolean(),
    image: z.string().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "User" });

export const MeSchema = z.object({ user: UserSchema }).meta({ id: "Me" });

/** Protected route — returns the current session's user. */
export const meRoutes = new Hono<{ Variables: AuthVariables }>().get(
  "/me",
  describeRoute({
    tags: ["System"],
    summary: "Current session user",
    description:
      "Requires a valid session cookie, obtained via `/api/auth/sign-in/email`.",
    responses: {
      200: {
        description: "Authenticated user.",
        content: { "application/json": { schema: resolver(MeSchema) } },
      },
      401: {
        description: "No valid session.",
        content: { "application/json": { schema: resolver(ErrorSchema) } },
      },
    },
  }),
  requireAuth,
  (c) => c.json({ user: c.var.user }),
);
