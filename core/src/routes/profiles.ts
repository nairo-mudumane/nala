import {
  and,
  count,
  type Database,
  db,
  desc,
  eq,
  isNull,
  jdUsrProfile,
  type JdUsrProfile,
  ne,
  type NewJdUsrProfile,
} from "@nala/db";
import {
  createProfileSchema,
  type Profile,
  profileListSchema,
  profileResponseSchema,
  updateProfileSchema,
} from "@nala/schemas/profile";
import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import { z } from "zod";
import { type AuthVariables, requireAuth } from "../auth";
import { ErrorSchema, ValidationErrorSchema } from "../schemas";
import { validationHook } from "../validation";

const ProfileParamsSchema = z.object({
  id: z.string().min(1).meta({ example: "V1StGXR8Z5jdHi6BmyT8s" }),
});

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

/** Every read and write is scoped to the owner's rows that are not deleted. */
const liveProfiles = (userId: string) =>
  and(eq(jdUsrProfile.userId, userId), isNull(jdUsrProfile.deletedAt));

/**
 * Drops the default flag from the user's other profiles.
 *
 * Runs *before* the row that is taking over is written, never after: the
 * partial unique index is checked per statement, so writing the new default
 * first would collide with the old one.
 */
async function clearDefaults(
  tx: Transaction,
  userId: string,
  exceptId?: string,
) {
  await tx
    .update(jdUsrProfile)
    .set({ isDefault: false })
    .where(
      and(
        liveProfiles(userId),
        eq(jdUsrProfile.isDefault, true),
        exceptId ? ne(jdUsrProfile.id, exceptId) : undefined,
      ),
    );
}

/**
 * Promotes the most recently touched profile when the user is left without a
 * default. A no-op when one already exists, or when nothing is left to promote.
 */
async function ensureDefault(tx: Transaction, userId: string) {
  const [current] = await tx
    .select({ id: jdUsrProfile.id })
    .from(jdUsrProfile)
    .where(and(liveProfiles(userId), eq(jdUsrProfile.isDefault, true)))
    .limit(1);

  if (current) return;

  const [next] = await tx
    .select({ id: jdUsrProfile.id })
    .from(jdUsrProfile)
    .where(liveProfiles(userId))
    .orderBy(desc(jdUsrProfile.updatedAt))
    .limit(1);

  if (!next) return;

  await tx
    .update(jdUsrProfile)
    .set({ isDefault: true })
    .where(eq(jdUsrProfile.id, next.id));
}

/**
 * Row → wire. Written out field by field on purpose: spreading the row would
 * ship `userId` and `deletedAt` the first time someone adds a column.
 */
function toProfile(row: JdUsrProfile): Profile {
  return {
    id: row.id,
    title: row.title,
    isDefault: row.isDefault,
    fullName: row.fullName,
    headline: row.headline,
    summary: row.summary,
    location: row.location,
    locale: row.locale,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const NOT_FOUND = { error: "Profile not found." } as const;

const UNAUTHORIZED_RESPONSE = {
  401: {
    description: "No valid session.",
    content: { "application/json": { schema: resolver(ErrorSchema) } },
  },
} as const;

const NOT_FOUND_RESPONSE = {
  404: {
    description: "No live profile with this id belongs to the session user.",
    content: { "application/json": { schema: resolver(ErrorSchema) } },
  },
} as const;

const INVALID_BODY_RESPONSE = {
  400: {
    description: "The body failed validation.",
    content: {
      "application/json": { schema: resolver(ValidationErrorSchema) },
    },
  },
} as const;

export const profileRoutes = new Hono<{ Variables: AuthVariables }>()
  .get(
    "/",
    describeRoute({
      tags: ["Profiles"],
      summary: "List the session user's profiles",
      description:
        "Live profiles only — soft-deleted ones are never returned. The " +
        "default profile comes first, then the most recently updated.",
      security: [{ clerkSessionToken: [] }],
      responses: {
        200: {
          description: "The user's profiles, possibly none.",
          content: {
            "application/json": { schema: resolver(profileListSchema) },
          },
        },
        ...UNAUTHORIZED_RESPONSE,
      },
    }),
    requireAuth,
    async (c) => {
      // biome-ignore lint/style/noNonNullAssertion: requireAuth already rejected the null case.
      const userId = c.var.userId!;

      const rows = await db
        .select()
        .from(jdUsrProfile)
        .where(liveProfiles(userId))
        .orderBy(desc(jdUsrProfile.isDefault), desc(jdUsrProfile.updatedAt));

      return c.json({ profiles: rows.map(toProfile) });
    },
  )
  .post(
    "/",
    describeRoute({
      tags: ["Profiles"],
      summary: "Create a profile",
      description:
        "The user's first profile always becomes the default, whatever " +
        "`isDefault` says — there is no state where profiles exist without " +
        "one. Passing `isDefault: true` later moves the flag off the current " +
        "default in the same transaction.",
      security: [{ clerkSessionToken: [] }],
      responses: {
        201: {
          description: "The created profile.",
          content: {
            "application/json": { schema: resolver(profileResponseSchema) },
          },
        },
        ...INVALID_BODY_RESPONSE,
        ...UNAUTHORIZED_RESPONSE,
      },
    }),
    requireAuth,
    validator("json", createProfileSchema, validationHook),
    async (c) => {
      // biome-ignore lint/style/noNonNullAssertion: requireAuth already rejected the null case.
      const userId = c.var.userId!;
      const input = c.req.valid("json");

      const created = await db.transaction(async (tx) => {
        const [existing] = await tx
          .select({ live: count() })
          .from(jdUsrProfile)
          .where(liveProfiles(userId));

        const isDefault = input.isDefault === true || existing?.live === 0;

        if (isDefault) await clearDefaults(tx, userId);

        const [row] = await tx
          .insert(jdUsrProfile)
          .values({
            userId,
            title: input.title,
            isDefault,
            fullName: input.fullName ?? null,
            headline: input.headline ?? null,
            summary: input.summary ?? null,
            location: input.location ?? null,
            locale: input.locale,
          })
          .returning();

        return row;
      });

      // `.returning()` on a single-row insert always yields the row.
      // biome-ignore lint/style/noNonNullAssertion: see above.
      return c.json({ profile: toProfile(created!) }, 201);
    },
  )
  .get(
    "/:id",
    describeRoute({
      tags: ["Profiles"],
      summary: "Read one profile",
      security: [{ clerkSessionToken: [] }],
      responses: {
        200: {
          description: "The profile.",
          content: {
            "application/json": { schema: resolver(profileResponseSchema) },
          },
        },
        ...UNAUTHORIZED_RESPONSE,
        ...NOT_FOUND_RESPONSE,
      },
    }),
    requireAuth,
    validator("param", ProfileParamsSchema, validationHook),
    async (c) => {
      // biome-ignore lint/style/noNonNullAssertion: requireAuth already rejected the null case.
      const userId = c.var.userId!;
      const { id } = c.req.valid("param");

      const [row] = await db
        .select()
        .from(jdUsrProfile)
        .where(and(eq(jdUsrProfile.id, id), liveProfiles(userId)))
        .limit(1);

      if (!row) return c.json(NOT_FOUND, 404);

      return c.json({ profile: toProfile(row) });
    },
  )
  .patch(
    "/:id",
    describeRoute({
      tags: ["Profiles"],
      summary: "Update a profile",
      description:
        "Partial: an absent field is left alone, an explicit `null` clears " +
        "it. An empty body is accepted and changes nothing. Sending " +
        "`isDefault: false` on the only live profile leaves it default — the " +
        "way to move the flag is to set it on another profile.",
      security: [{ clerkSessionToken: [] }],
      responses: {
        200: {
          description: "The updated profile.",
          content: {
            "application/json": { schema: resolver(profileResponseSchema) },
          },
        },
        ...INVALID_BODY_RESPONSE,
        ...UNAUTHORIZED_RESPONSE,
        ...NOT_FOUND_RESPONSE,
      },
    }),
    requireAuth,
    validator("param", ProfileParamsSchema, validationHook),
    validator("json", updateProfileSchema, validationHook),
    async (c) => {
      // biome-ignore lint/style/noNonNullAssertion: requireAuth already rejected the null case.
      const userId = c.var.userId!;
      const { id } = c.req.valid("param");
      const patch = c.req.valid("json");

      const updated = await db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(jdUsrProfile)
          .where(and(eq(jdUsrProfile.id, id), liveProfiles(userId)))
          .limit(1);

        if (!existing) return null;

        // Built key by key: `undefined` means "not sent", and spreading the
        // parsed body would write those over real columns.
        const values: Partial<NewJdUsrProfile> = {};
        if (patch.title !== undefined) values.title = patch.title;
        if (patch.isDefault !== undefined) values.isDefault = patch.isDefault;
        if (patch.fullName !== undefined) values.fullName = patch.fullName;
        if (patch.headline !== undefined) values.headline = patch.headline;
        if (patch.summary !== undefined) values.summary = patch.summary;
        if (patch.location !== undefined) values.location = patch.location;
        if (patch.locale !== undefined) values.locale = patch.locale;

        if (Object.keys(values).length === 0) return existing;

        if (patch.isDefault === true) await clearDefaults(tx, userId, id);

        const [row] = await tx
          .update(jdUsrProfile)
          .set(values)
          .where(eq(jdUsrProfile.id, id))
          .returning();

        if (patch.isDefault !== false) return row;

        // Giving up the flag may have left the user without a default, and
        // this very row can be the one promoted back — so re-read it.
        await ensureDefault(tx, userId);

        const [fresh] = await tx
          .select()
          .from(jdUsrProfile)
          .where(eq(jdUsrProfile.id, id))
          .limit(1);

        return fresh ?? row;
      });

      if (!updated) return c.json(NOT_FOUND, 404);

      return c.json({ profile: toProfile(updated) });
    },
  )
  .delete(
    "/:id",
    describeRoute({
      tags: ["Profiles"],
      summary: "Delete a profile",
      description:
        "Soft delete: the row is kept with `deletedAt` set so documents " +
        "already generated from it still resolve, and it stops appearing in " +
        "every endpoint here. Deleting the default promotes the most " +
        "recently updated of the remaining profiles.",
      security: [{ clerkSessionToken: [] }],
      responses: {
        204: { description: "Deleted." },
        ...UNAUTHORIZED_RESPONSE,
        ...NOT_FOUND_RESPONSE,
      },
    }),
    requireAuth,
    validator("param", ProfileParamsSchema, validationHook),
    async (c) => {
      // biome-ignore lint/style/noNonNullAssertion: requireAuth already rejected the null case.
      const userId = c.var.userId!;
      const { id } = c.req.valid("param");

      const deleted = await db.transaction(async (tx) => {
        const [row] = await tx
          .update(jdUsrProfile)
          .set({ deletedAt: new Date(), isDefault: false })
          .where(and(eq(jdUsrProfile.id, id), liveProfiles(userId)))
          .returning();

        if (!row) return null;

        await ensureDefault(tx, userId);

        return row;
      });

      if (!deleted) return c.json(NOT_FOUND, 404);

      return c.body(null, 204);
    },
  );
