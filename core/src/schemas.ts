import { z } from "zod";

export const ErrorSchema = z
  .object({ error: z.string().meta({ example: "Not authenticated" }) })
  .meta({ id: "Error" });

/**
 * A rejected request body, in the one shape every validated route returns.
 *
 * `error` is the summary a toast can show; `issues` carries the per-field
 * messages a form binds under its inputs — `path` is dotted (`"title"`,
 * `"links.0.url"`) and empty when the problem is with the body as a whole.
 * Produced by `validationHook` in `core/src/validation.ts`.
 */
export const ValidationErrorSchema = z
  .object({
    error: z.string().meta({ example: "Some fields need attention." }),
    issues: z.array(
      z.object({
        path: z.string().meta({ example: "title" }),
        message: z.string().meta({ example: "Give this profile a name." }),
      }),
    ),
  })
  .meta({ id: "ValidationError" });

export type ValidationError = z.infer<typeof ValidationErrorSchema>;
