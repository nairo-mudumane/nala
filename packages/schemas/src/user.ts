import { z } from "zod";

/**
 * The user as it travels over the wire.
 *
 * Shared on purpose: `core` serialises `GET /me` from this definition (and
 * publishes it in the OpenAPI spec through `resolver()`), and `web` types the
 * response against the very same schema instead of restating its shape.
 *
 * It mirrors the local `user` row in `@nala/db`, which is itself a mirror of
 * the Clerk user — never a superset. Anything Clerk knows but this table does
 * not (phone numbers, OAuth links, metadata) is read from Clerk's API, not
 * bolted on here.
 */
export const userSchema = z
  .object({
    /** Clerk user id. */
    id: z.string().meta({ example: "user_2abcDEF456ghiJKL789mnoPQR" }),
    email: z.email(),
    /** Null until the user fills in a first or last name at Clerk. */
    name: z.string().nullable(),
    /** Avatar served by Clerk's CDN. */
    imageUrl: z.string().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "User" });

export type User = z.infer<typeof userSchema>;

/** Response body of `GET /me`. */
export const meSchema = z.object({ user: userSchema }).meta({ id: "Me" });

export type Me = z.infer<typeof meSchema>;
