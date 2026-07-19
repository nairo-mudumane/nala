# Nala — Technical Guide (AGENTS)

> [!IMPORTANT]
> **Required reading — read BEFORE any technical work.**
> This file covers only the **how** (architecture, conventions, commands). The **what** and the **why** live in **[REQUIREMENTS.MD](REQUIREMENTS.MD)** (business requirements).
>
> Mandatory flow: **1)** read [REQUIREMENTS.MD](REQUIREMENTS.MD) → **2)** read this file → **3)** only then write or change code.
> No technical decision should be made without the business context. If you have not read the requirements yet, stop and read them first.

## 1. Repository Architecture

The project is a **monorepo managed with [Bun workspaces](https://bun.com/docs/install/workspaces) + [Turborepo](https://turborepo.dev)**.

### 1.1 Structure

```
nala/
├── package.json          # workspace root (bun@1.3.3), turbo scripts
├── turbo.json            # task pipeline (build, dev, typecheck)
├── biome.json            # lint + format (Biome) — single config for the whole monorepo
├── tsconfig.json         # extends @nala/typescript-config
├── web/                  # Next.js frontend app (package: "web")
├── core/                 # Hono backend on Bun (package: "core", port 3001)
└── packages/
    ├── db/               # @nala/db — Drizzle + PostgreSQL (v18) connection + schemas
    ├── auth/             # @nala/auth — Better Auth (server + React client)
    ├── ui/               # @nala/ui — shared shadcn/ui components
    └── typescript-config/# @nala/typescript-config
```

There is **a single `.env` at the root** for the whole monorepo (`cp .env.example .env`).
`core` and the `packages/*` scripts consume it via `bun --env-file=...`; `web`
reads it through Next's native loading via a symlink
`web/.env → ../.env`, created automatically by `postinstall`. Do not create a
per-package `.env` with its own contents.

> `bun --env-file` does **not** work for `web`: `next dev` starts a Node server
> that does not inherit those variables (verified empirically). The symlink is
> what makes Next load them natively.

### 1.2 Workspace conventions

- Internal packages are referenced by name with the `workspace:*` protocol (e.g. `"@nala/ui": "workspace:*"`). **Never** use relative paths between packages.
- The application lives in `web/` (at the root); all shared code lives in `packages/*`.
- When creating a new shared package, place it in `packages/<name>` with `name` in the format `@nala/<name>` — the workspace detects it automatically (glob `packages/*`).
- Always import shared code by the package name (e.g. `import { Button } from "@nala/ui/components/button"`), never by relative path.

### 1.3 Commands (always run from the root)

- `bun install` — installs/relinks the whole workspace.
- `bun run dev` — starts the app in dev mode (turbo).
- `bun run build` — production build of all packages.
- `bun run typecheck` — via turbo, across all packages.
- `bun run lint` — Biome analyzes the whole monorepo (a single pass from the root, without turbo).
- `bun run format` — Biome formats and writes (`biome format --write .`).
- `bun run check` — Biome runs lint + format + safe fixes in one command (`biome check --write .`).

### 1.3.1 Lint & Format (Biome)

Linting and formatting are managed by **[Biome](https://biomejs.dev)** (`@biomejs/biome`, pinned at `2.5.4`), with **a single config at the root** (`biome.json`) for the whole monorepo — it replaces ESLint + Prettier. Enforced conventions:

- Semicolon (`;`) at the end of every line (`semicolons: "always"`).
- Double quotes, including in imports (`quoteStyle: "double"`).
- Forbids unused variables and imports (`noUnusedVariables`/`noUnusedImports` as `error`).
- Does **not** reorder imports (`assist.actions.source.organizeImports: "off"`).
- 2-space indentation, line width 80, line ending `lf`.

Biome respects `.gitignore` (`vcs.useIgnoreFile`), so `node_modules`, `.next`, `dist`, and `.turbo` are ignored automatically. There are no per-package configs — always run from the root.

Apps:

- **`web`** — Next.js frontend (port 3000).
- **`core`** — Hono backend running on the Bun runtime (port 3001). The entry point `core/src/index.ts` exports `{ port, fetch }` (served directly by Bun, without an adapter). Run it standalone with `bun run --hot core/src/index.ts` or via `bun run dev` (turbo starts both apps).

### 1.3.2 API Documentation (OpenAPI + Scalar)

`core` publishes an **OpenAPI 3.1** spec and serves the **[Scalar](https://scalar.com)** UI:

- `GET /docs` — Scalar UI (`@scalar/hono-api-reference`).
- `GET /openapi.json` — spec generated at runtime.

The spec is the **merge of two sources** (`core/src/openapi.ts`):

1. `core`'s own routes, annotated with `describeRoute()` from **`hono-openapi`** (v1) and **Zod v4** schemas from `core/src/schemas.ts` (via `resolver()`).
2. The Better Auth endpoints, obtained from `auth.api.generateOpenAPISchema()` (the `openAPI()` plugin in `packages/auth/src/server.ts`). Their paths come relative to the auth base, so they are prefixed with `/api/auth`, re-tagged as `Authentication`, and the schemas are renamed with the `Auth` prefix (`User` → `AuthUser`) so they do not collide with those of the own routes — the `$ref`s are rewritten along with them.

> The Better Auth plugin runs with `disableDefaultReference: true`: its own reference at `/api/auth/reference` is switched off so there is **a single UI** (`/docs`) covering the whole API. The catch-all `/api/auth/*` is excluded from `generateSpecs` because the real paths come in through the auth fragment.

**When adding a new route to `core`:** create `core/src/routes/<route>.ts` (see §1.3.3), wrap the handler with `describeRoute({ tags, summary, responses })`, and use a `tag` **already declared** in `DOCUMENTATION.tags` (`routes/docs.ts`) — an undeclared tag shows up as a stray group in Scalar. Without `describeRoute` the route appears in the spec undocumented.

`hono-openapi` declares its dependencies as **peer deps** — `@hono/standard-validator`, `@standard-community/standard-json`, `@standard-community/standard-openapi`, `openapi-types`, `@types/json-schema` are explicit in `core/package.json`. Without them startup blows up with `Cannot find module '@hono/standard-validator'`.

### 1.3.3 Organization of `core`'s routes

**All routes live in `core/src/routes/*`, one per file.** `core/src/index.ts` only creates the app, applies global middleware (CORS, session), and mounts the routers — it never defines handlers.

```
core/src/
├── index.ts          # app + global middleware + router mounting
├── auth.ts           # auth middleware (sessionMiddleware, requireAuth) — not routes
├── schemas.ts        # Zod schemas shared by several routes (e.g. ErrorSchema)
└── routes/
    ├── index.ts      # barrel — re-exports every router
    ├── root.ts       # GET /
    ├── health.ts     # GET /health
    ├── me.ts         # GET /me (protected)
    ├── auth.ts       # catch-all /api/auth/* (Better Auth handler)
    └── docs.ts       # GET /docs (Scalar) + GET /openapi.json
```

- Each file exports a `new Hono()` named `<route>Routes`, mounted in `index.ts` with `app.route("/", <route>Routes)` — the full path is declared inside the router itself.
- Protected routes type the router as `new Hono<{ Variables: AuthVariables }>()` and apply `requireAuth` on the handler.
- **Zod schemas specific to one route live in that route's file**; only what is shared goes to `core/src/schemas.ts`.
- After adding a router, re-export it in `routes/index.ts`.

> **Mounting order in `index.ts` (it matters):** `authRoutes` **before** `sessionMiddleware` (otherwise the Better Auth handler runs with the session already resolved), and `mountDocs(app)` **last** — `generateSpecs` walks the routes already registered on the app.

### 1.4 shadcn/ui components

The shadcn components are **source code** living in the `@nala/ui` package (`packages/ui/src/components`), not an external dependency. The CLI version is pinned at `shadcn@4.13.1` (see `packages/ui/package.json`) — use it explicitly to stay consistent.

- **Add a component:** `bun x shadcn@4.13.1 add <component> -c packages/ui`
- **Add all of them:** `bun x shadcn@4.13.1 add --all --yes -c packages/ui`
- **Overwrite existing ones:** add the `--overwrite` flag (`-o`).
- The target is **always** `packages/ui` (via `-c packages/ui` or by running inside that folder) — never the `web` app.
- After adding, run `bun install` (new deps) and `bun run typecheck`.
- Once installed, import it in the app via `@nala/ui/components/<component>`.
- **Tooltip:** requires wrapping the app with `<TooltipProvider>` in `web/app/layout.tsx`.

### 1.5 Database (`@nala/db`)

The whole data layer lives in the **`@nala/db`** package (`packages/db`): the **[Drizzle ORM](https://orm.drizzle.team)** configuration (`drizzle-orm` pinned at `0.45.2`, `drizzle-kit` at `0.31.10`), the **PostgreSQL (18) connection**, and **all schemas**. No other package defines schemas or opens DB connections — they always import from `@nala/db`.

- **Driver:** uses Bun's native PostgreSQL support via `drizzle-orm/bun-sql` (`Bun.SQL`) — **no** `pg`/`postgres` at runtime. `pg` exists only as a `devDependency` for the `drizzle-kit` tooling (`db:push`/`db:studio`); production migrations run with Bun's native migrator.
- **Connection:** `DATABASE_URL` is validated in `src/env.ts`. It lives in the monorepo's **single root `.env`** (`cp .env.example .env`) — the DB/`core` scripts pass it with `--env-file`, and `web` reads it via the `web/.env` symlink (see §1.1).
- **Importing:** `import { db, user, eq } from "@nala/db"` — the package re-exports the `db` client, the schemas/types, and the `drizzle-orm` operators. Never by relative path.
- **Adding a table:** create `src/schema/<table>.ts` and re-export it in `src/schema/index.ts` (the single barrel pointed at by `drizzle.config.ts` and the client).
- **Naming convention:** `camelCase` keys in TS → `snake_case` columns in the DB (`casing: "snake_case"`, set on the client and in `drizzle.config.ts`).
- **Commands (run from `packages/db`):**
  - `bun run db:generate` — generates SQL migrations from the schemas → `packages/db/drizzle` (commit them).
  - `bun run db:migrate` — applies pending migrations (Bun's native migrator, without `pg`).
  - `bun run db:push` — syncs the schema straight to the DB (dev/prototyping).
  - `bun run db:studio` — opens Drizzle Studio.

<!-- BEGIN:nextjs-agent-rules -->

### 1.6 Authentication (`@nala/auth`)

All authentication lives in the **`@nala/auth`** package (`packages/auth`), built on **[Better Auth](https://better-auth.com)** (`better-auth` pinned at `1.6.23`) with the `drizzleAdapter` over `@nala/db`.

**Separation of responsibilities:** the **tables** (`user`, `session`, `account`, `verification`) live in `@nala/db` (`src/schema/auth.ts`), the **logic** lives in `@nala/auth`. That keeps a single `drizzle.config.ts` and a single migrations folder across the whole monorepo — never create a second Drizzle setup inside `packages/auth`.

- **Auth server:** it is the `core` app (Hono, port 3001). It mounts the handler at `/api/auth/*` (`core/src/auth.ts`) and is the only HTTP authentication endpoint. `web` does **not** have `app/api/auth/[...all]/route.ts`.
- **Package entry points:**
  - `@nala/auth` — the `auth` instance + types (`Auth`, `AuthSession`, `AuthUser`). **Server only.**
  - `@nala/auth/client` — `authClient` (`better-auth/react`) for Client Components.
- **In Hono (`core`):** `sessionMiddleware` populates `c.var.user`/`c.var.session`; `requireAuth` protects routes (401). See `/me` in `core/src/index.ts` as an example.
- **In Next.js (`web`):**
  - Server (Server Components / Actions): `getSession()` / `requireSession()` from `web/lib/auth.ts`. They `fetch` `core` (`/api/auth/get-session`) forwarding the cookies, memoized per request with React's `cache()`.
  - Browser: `authClient.useSession()`, `authClient.signIn.email(...)`, etc., from `@nala/auth/client` (which points at `NEXT_PUBLIC_AUTH_URL`).

  > **Never import `@nala/auth` (root) or `@nala/db` inside `web`.** Next runs on **Node** and `@nala/db` uses `drizzle-orm/bun-sql`, which needs the native `bun:sql` module — the import blows up at runtime with `Cannot find module 'bun:sql'`. Only `core` (Bun) talks to the DB. Importing **types** with `import type` is safe (it is erased at compile time).

- **IDs:** `advanced.database.generateId` uses `nanoid(21)`, aligned with `TABLE_DEFAULTS` from `packages/db/src/utils.ts`. Any new table should spread `...TABLE_DEFAULTS` to inherit `id`/`createdAt`/`updatedAt`. This affects **only row IDs** — the session `token` is still generated by Better Auth's internal CSPRNG (`generateId(32)`).
- **Password hashing:** `Bun.password` with `argon2id` (see `emailAndPassword.password` in `server.ts`), replacing Better Auth's default `scrypt`. It depends on the Bun runtime — another reason hashing only happens in `core`.
- **Module resolution:** `@nala/auth` and `@nala/db` extend `@nala/typescript-config/library.json` (`moduleResolution: "Bundler"`) and use relative imports **without an extension**. With NodeNext's `.js` extension Turbopack does not resolve the `.ts` files and the `web` build fails with `Module not found`.
- **Changing the Better Auth config** (plugins, extra fields) requires reflecting the schema:
  1. edit `packages/auth/src/server.ts`;
  2. run `bun run auth:verify` (in `packages/auth`) — it compares the config against the Drizzle schema and fails if tables/columns are missing;
  3. update `packages/db/src/schema/auth.ts` until it passes;
  4. run `bun run db:generate` and `bun run db:migrate` (in `packages/db`).

  > `@better-auth/cli generate` does **not** work in this project: it loads the config with jiti/Node and blows up when importing `drizzle-orm/bun-sql` (which depends on the native `bun:sql` module). Use `auth:verify` in its place.

### 1.7 This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may differ from your training knowledge. Read the relevant guide in `web/node_modules/next/dist/docs/` before writing code. Pay attention to deprecation warnings.
<!-- END:nextjs-agent-rules -->
