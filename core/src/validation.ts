/**
 * Shared error handling for `validator()` from `hono-openapi`.
 *
 * Without a hook the validator answers with Standard Schema's raw issue array,
 * which is neither the `{ error }` shape the rest of `core` returns nor
 * something a form can bind to. This turns it into one envelope carrying both:
 * `error` for a toast, `issues` for per-field messages under the inputs.
 *
 * The messages come straight from the Zod schemas in `@nala/schemas`, which is
 * why they are written as user-facing literals there (REQUIREMENTS.MD §3).
 */
import type { Context } from "hono";
import type { ValidationError } from "./schemas";

/**
 * Structural mirror of `StandardSchemaV1.Issue`.
 *
 * `@standard-schema/spec` is a transitive dependency here, not a declared one —
 * importing its types would make `core` depend on a package it never installed.
 */
type ValidationIssue = {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }>;
};

type ValidationResult =
  | { success: true }
  | { success: false; error: readonly ValidationIssue[] };

/** `["links", 0, "url"]` → `"links.0.url"`; empty for a whole-body issue. */
function formatPath(path: ValidationIssue["path"]): string {
  if (!path) return "";

  return path
    .map((segment) =>
      typeof segment === "object" ? String(segment.key) : String(segment),
    )
    .join(".");
}

export function validationHook(result: ValidationResult, c: Context) {
  if (result.success) return;

  const body: ValidationError = {
    error: "Some fields need attention.",
    issues: result.error.map((issue) => ({
      path: formatPath(issue.path),
      message: issue.message,
    })),
  };

  return c.json(body, 400);
}
