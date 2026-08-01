import { z } from "zod";

/**
 * Auth input schemas.
 *
 * Shared on purpose: `web` drives react-hook-form with these via
 * `zodResolver`, and `core` can validate the same payloads server-side from
 * the identical definition. Client-side validation is a UX affordance only —
 * never the trust boundary: the credentials themselves are checked by Clerk,
 * which these schemas only feed.
 *
 * Error messages are user-facing, so they live here as literals ready to be
 * lifted into translation files later (REQUIREMENTS.MD §3).
 */

export const MAX_NAME_LENGTH = 80;

export const emailSchema = z
  .string()
  .trim()
  .min(1, { message: "Email is required." })
  .pipe(z.email({ message: "Enter a valid email address." }))
  // Clerk identifies accounts by email and links social connections on an exact
  // match — so normalise case here rather than at each call site.
  .transform((value) => value.toLowerCase());

/**
 * Optional because email-link sign-up does not need it; when omitted the user
 * is created at Clerk with no name at all. An untouched input submits `""`,
 * which is why the empty string is allowed through rather than failing `min`.
 */
export const optionalNameSchema = z
  .string()
  .trim()
  .max(MAX_NAME_LENGTH, {
    message: `Name must be ${MAX_NAME_LENGTH} characters or fewer.`,
  })
  .optional();

/** Existing account: email is all we need to mail a sign-in link. */
export const signInSchema = z.object({
  email: emailSchema,
});

/** New account: same as sign-in, plus an optional display name. */
export const signUpSchema = z.object({
  email: emailSchema,
  name: optionalNameSchema,
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;

/**
 * The form is rendered from one component in both modes, so react-hook-form
 * needs a single value type covering either shape.
 */
export type AuthFormValues = SignInValues & Partial<SignUpValues>;
