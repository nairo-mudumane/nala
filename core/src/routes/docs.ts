import { auth } from "@nala/auth";
import { Scalar } from "@scalar/hono-api-reference";
import type { Hono } from "hono";
import { type GenerateSpecOptions, generateSpecs } from "hono-openapi";
import type { AuthVariables } from "../auth";

export const OPENAPI_JSON_PATH = "/openapi.json";
export const DOCS_PATH = "/docs";

const AUTH_TAG = "Authentication";
const AUTH_SCHEMA_PREFIX = "Auth";

const DOCUMENTATION: GenerateSpecOptions["documentation"] = {
  openapi: "3.1.0",
  info: {
    title: "Nala Core API",
    version: "0.0.1",
    description:
      "Nala API — strategic job-application management. " +
      "Authentication is done with a session cookie (Better Auth); " +
      "protected endpoints return 401 without a valid session.",
  },
  servers: [{ url: "http://localhost:3001", description: "Local" }],
  tags: [
    { name: "System", description: "Service status and metadata." },
    { name: AUTH_TAG, description: "Better Auth endpoints (/api/auth/*)." },
  ],
};

type OpenAPIDocument = Awaited<ReturnType<typeof generateSpecs>>;
type Components = NonNullable<OpenAPIDocument["components"]>;

type AuthFragment = {
  paths: NonNullable<OpenAPIDocument["paths"]>;
  schemas: NonNullable<Components["schemas"]>;
  securitySchemes: NonNullable<Components["securitySchemes"]>;
};

/**
 * Converts the Better Auth schema (paths relative to `/api/auth`, schemas under
 * generic names) into a fragment that can be merged into `core`'s global spec.
 *
 * Better Auth types this schema more loosely than `openapi-types` does
 * (e.g. `type: string` instead of the `"apiKey"` literal), hence the cast on
 * the return — the content is JSON generated at runtime, validated by Scalar
 * itself.
 */
async function buildAuthFragment(): Promise<AuthFragment> {
  const schema = await auth.api.generateOpenAPISchema();

  const rewriteRefs = <T>(value: T): T =>
    JSON.parse(
      JSON.stringify(value).replaceAll(
        '"#/components/schemas/',
        `"#/components/schemas/${AUTH_SCHEMA_PREFIX}`,
      ),
    );

  const paths: Record<string, unknown> = {};

  for (const [path, item] of Object.entries(rewriteRefs(schema.paths))) {
    const operations = Object.fromEntries(
      Object.entries(item as Record<string, { tags?: string[] }>).map(
        ([method, operation]) => [method, { ...operation, tags: [AUTH_TAG] }],
      ),
    );

    paths[`/api/auth${path}`] = operations;
  }

  const schemas = Object.fromEntries(
    Object.entries(rewriteRefs(schema.components?.schemas ?? {})).map(
      ([name, definition]) => [`${AUTH_SCHEMA_PREFIX}${name}`, definition],
    ),
  );

  return {
    paths,
    schemas,
    securitySchemes: schema.components?.securitySchemes ?? {},
  } as AuthFragment;
}

/**
 * Mounts `GET /openapi.json` (the spec of `core`'s routes merged with Better
 * Auth's) and the Scalar UI at `GET /docs`.
 */
export function mountDocs(app: Hono<{ Variables: AuthVariables }>) {
  app.get(OPENAPI_JSON_PATH, async (c) => {
    const [spec, authFragment] = await Promise.all([
      generateSpecs(app, {
        documentation: DOCUMENTATION,
        exclude: [OPENAPI_JSON_PATH, DOCS_PATH, "/api/auth/*"],
      }),
      buildAuthFragment(),
    ]);

    const merged: OpenAPIDocument = {
      ...spec,
      paths: { ...spec.paths, ...authFragment.paths },
      components: {
        ...spec.components,
        schemas: { ...spec.components?.schemas, ...authFragment.schemas },
        securitySchemes: {
          ...spec.components?.securitySchemes,
          ...authFragment.securitySchemes,
        },
      },
    };

    return c.json(merged);
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
