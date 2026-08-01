/**
 * The professional base profile as it travels over the wire.
 *
 * Mirrors the `jd_usr_profile` row in `@nala/db`, minus two things it
 * deliberately never exposes: `userId`, which is implied by the session and
 * tells the client nothing it does not already know, and `deletedAt`, which is
 * a storage detail — a soft-deleted profile is simply absent from the API.
 */
import { z } from "zod";

/** Language the documents generated from a profile are written in. */
export const profileLocaleSchema = z.enum(["en", "pt"]);

export type ProfileLocale = z.infer<typeof profileLocaleSchema>;

export const profileSchema = z
  .object({
    id: z.string().meta({ example: "V1StGXR8Z5jdHi6BmyT8s" }),
    /** How the user tells their profiles apart. */
    title: z.string().meta({ example: "Backend Engineer" }),
    /** Preselected when starting a new application. At most one per user. */
    isDefault: z.boolean(),
    fullName: z.string().nullable(),
    headline: z.string().nullable(),
    summary: z.string().nullable(),
    location: z.string().nullable(),
    locale: profileLocaleSchema,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Profile" });

export type Profile = z.infer<typeof profileSchema>;

/**
 * Ceilings kept generous — they exist to stop a runaway paste from reaching
 * the database, not to tell the user how to write about themselves.
 */
const LIMITS = { title: 80, fullName: 120, headline: 160, location: 120 };
const SUMMARY_LIMIT = 2000;

/**
 * Messages are user-facing. Keep them as literals here so they can be lifted
 * into translation files whole (REQUIREMENTS.MD §3), rather than assembled at
 * the call site.
 */
export const createProfileSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Give this profile a name.")
      .max(LIMITS.title, "Keep the name under 80 characters.")
      .meta({ example: "Backend Engineer" }),
    isDefault: z.boolean().optional(),
    fullName: z
      .string()
      .trim()
      .max(LIMITS.fullName, "Keep the full name under 120 characters.")
      .nullish(),
    headline: z
      .string()
      .trim()
      .max(LIMITS.headline, "Keep the headline under 160 characters.")
      .nullish(),
    summary: z
      .string()
      .trim()
      .max(SUMMARY_LIMIT, "Keep the summary under 2000 characters.")
      .nullish(),
    location: z
      .string()
      .trim()
      .max(LIMITS.location, "Keep the location under 120 characters.")
      .nullish(),
    locale: profileLocaleSchema.optional(),
  })
  .meta({ id: "CreateProfileInput" });

export type CreateProfileInput = z.input<typeof createProfileSchema>;

/**
 * Every field optional, including `title` — a partial update.
 *
 * The nullable fields keep a three-way meaning that the handler relies on:
 * **absent** leaves the column alone, **null** clears it, a string sets it. An
 * empty body is accepted and changes nothing.
 */
export const updateProfileSchema = createProfileSchema
  .partial()
  .meta({ id: "UpdateProfileInput" });

export type UpdateProfileInput = z.input<typeof updateProfileSchema>;

/** Response body of `GET /profiles`. */
export const profileListSchema = z
  .object({ profiles: z.array(profileSchema) })
  .meta({ id: "ProfileList" });

export type ProfileList = z.infer<typeof profileListSchema>;

/** Response body of every single-profile endpoint. */
export const profileResponseSchema = z
  .object({ profile: profileSchema })
  .meta({ id: "ProfileResponse" });

export type ProfileResponse = z.infer<typeof profileResponseSchema>;
