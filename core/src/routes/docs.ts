import { auth } from "@nala/auth";
import { Scalar } from "@scalar/hono-api-reference";
import type { Hono } from "hono";
import { type GenerateSpecOptions, generateSpecs } from "hono-openapi";
import type { AuthVariables } from "../auth";

export const OPENAPI_JSON_PATH = "/openapi.json";
export const DOCS_PATH = "/docs";

const AUTH_TAG = "Autenticação";
const AUTH_SCHEMA_PREFIX = "Auth";

const DOCUMENTATION: GenerateSpecOptions["documentation"] = {
  openapi: "3.1.0",
  info: {
    title: "Nala Core API",
    version: "0.0.1",
    description:
      "API do Nala — gestão estratégica de candidaturas profissionais. " +
      "A autenticação é feita por cookie de sessão (Better Auth); os " +
      "endpoints protegidos devolvem 401 sem sessão válida.",
  },
  servers: [{ url: "http://localhost:3001", description: "Local" }],
  tags: [
    { name: "Sistema", description: "Estado e metadados do serviço." },
    { name: AUTH_TAG, description: "Endpoints do Better Auth (/api/auth/*)." },
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
 * Converte o schema do Better Auth (paths relativos a `/api/auth`, schemas em
 * nomes genéricos) para um fragmento fundível no spec global do `core`.
 *
 * O Better Auth tipa este schema de forma mais frouxa do que o `openapi-types`
 * (ex.: `type: string` em vez do literal `"apiKey"`), daí o cast no retorno —
 * o conteúdo é JSON gerado em runtime, validado pelo próprio Scalar.
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
 * Monta o `GET /openapi.json` (spec das rotas do `core` fundido com o do
 * Better Auth) e a UI do Scalar em `GET /docs`.
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
