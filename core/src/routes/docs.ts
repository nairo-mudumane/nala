import { Scalar } from "@scalar/hono-api-reference";
import type { Hono } from "hono";
import { type GenerateSpecOptions, generateSpecs } from "hono-openapi";
import type { AuthVariables } from "../auth";

export const OPENAPI_JSON_PATH = "/openapi.json";
export const DOCS_PATH = "/docs";

/**
 * Authentication happens at Clerk, not here, so there are no sign-in endpoints
 * to document — only the bearer token every protected route expects. Routes
 * opt in with `security: [{ clerkSessionToken: [] }]` in their `describeRoute`.
 */
const SECURITY_SCHEMES: NonNullable<
  NonNullable<GenerateSpecOptions["documentation"]>["components"]
>["securitySchemes"] = {
  clerkSessionToken: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description:
      "Short-lived Clerk session token. `web` mints it server-side with " +
      "`getToken()` and forwards it; in Scalar, paste one from the Clerk " +
      "dashboard or from `window.Clerk.session.getToken()` in the browser.",
  },
};

const DOCUMENTATION: GenerateSpecOptions["documentation"] = {
  openapi: "3.1.0",
  info: {
    title: "Nala Core API",
    version: "0.0.1",
    description:
      "Nala API — strategic job-application management. " +
      "Authentication is handled by Clerk: protected endpoints expect a Clerk " +
      "session token and return 401 without a valid one.",
  },
  servers: [{ url: "http://localhost:3001", description: "Local" }],
  components: { securitySchemes: SECURITY_SCHEMES },
  tags: [
    { name: "System", description: "Service status and metadata." },
    {
      name: "Profiles",
      description:
        "The user's professional base profiles — the material tailored " +
        "résumés are generated from.",
    },
    {
      name: "Webhooks",
      description: "Events pushed in by Clerk (signature-authenticated).",
    },
  ],
};

type OpenAPIDocument = Awaited<ReturnType<typeof generateSpecs>>;
type SchemaMap = NonNullable<
  NonNullable<OpenAPIDocument["components"]>["schemas"]
>;

/**
 * Moves schema definitions out of the local `$defs` blocks and into
 * `components.schemas`.
 *
 * `resolver()` names a schema after its `.meta({ id })` and emits a
 * `$ref: "#/components/schemas/<id>"` for it — but it leaves the definition
 * itself in a JSON-Schema `$defs` block next to the reference, which is not
 * where the `$ref` points. Left alone, every one of those references dangles
 * and Scalar renders the field as unresolved.
 *
 * Hoisting them is enough to close the gap: the `$ref`s already use the right
 * path, so nothing has to be rewritten. First definition of a given name wins —
 * two routes referencing the same schema produce identical copies.
 */
function hoistSchemaDefs(spec: OpenAPIDocument): OpenAPIDocument {
  const schemas: SchemaMap = {};

  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk);
    if (node === null || typeof node !== "object") return node;

    const { $defs, ...rest } = node as Record<string, unknown>;

    if ($defs && typeof $defs === "object") {
      for (const [name, definition] of Object.entries($defs)) {
        // A definition can itself carry `$defs`, so walk it on the way in.
        schemas[name] ??= walk(definition) as SchemaMap[string];
      }
    }

    return Object.fromEntries(
      Object.entries(rest).map(([key, value]) => [key, walk(value)]),
    );
  };

  const hoisted = walk(spec) as OpenAPIDocument;

  return {
    ...hoisted,
    components: {
      ...hoisted.components,
      schemas: { ...hoisted.components?.schemas, ...schemas },
    },
  };
}

/**
 * Mounts `GET /openapi.json` and the Scalar UI at `GET /docs`.
 *
 * Single source: whatever `describeRoute()` declares on the routes already
 * registered on the app — hence `mountDocs` last in `index.ts`. Clerk hosts and
 * documents its own API, so there is no external fragment to merge in.
 */
export function mountDocs(app: Hono<{ Variables: AuthVariables }>) {
  app.get(OPENAPI_JSON_PATH, async (c) => {
    const spec = await generateSpecs(app, {
      documentation: DOCUMENTATION,
      exclude: [OPENAPI_JSON_PATH, DOCS_PATH],
    });

    return c.json(hoistSchemaDefs(spec));
  });

  app.get(
    DOCS_PATH,
    Scalar({
      url: OPENAPI_JSON_PATH,
      pageTitle: "Nala Core API",
      theme: "default",
    }),
  );
}
