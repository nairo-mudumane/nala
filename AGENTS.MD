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
├── web/                  # TanStack Start frontend app on Bun (package: "web", port 3000)
├── core/                 # Hono backend on Bun (package: "core", port 3001)
└── packages/
    ├── db/               # @nala/db — Drizzle + PostgreSQL (v18) connection + schemas
    ├── auth/             # @nala/auth — Clerk integration (server only)
    ├── schemas/          # @nala/schemas — Zod schemas shared by web + core
    ├── ui/               # @nala/ui — shared shadcn/ui components + design tokens + fonts
    └── typescript-config/# @nala/typescript-config
```

There is **a single `.env` at the root** for the whole monorepo (`cp .env.example .env`).
`core` and the `packages/*` scripts consume it via `bun --env-file=...`; `web`
reads it through the symlink `web/.env → ../.env`, created automatically by
`postinstall`. Do not create a per-package `.env` with its own contents.

> **Two mechanisms feed `web`, and they are not interchangeable.** Vite exposes
> only `VITE_`-prefixed variables, and only through `import.meta.env` (inlined
> into both bundles at build time). Everything else — `CLERK_SECRET_KEY`,
> `CORE_URL` — is read from `process.env` at runtime, which Vite never
> populates. `web/vite.config.ts` therefore calls `loadEnv(mode, …, "")` and
> copies the root `.env` into `process.env` **without overwriting real
> environment variables**, so dev works from the file and production works from
> whatever the host injects. Anything a browser must see needs the `VITE_`
> prefix; anything secret must never have it.

### 1.2 Workspace conventions

- Internal packages are referenced by name with the `workspace:*` protocol (e.g. `"@nala/ui": "workspace:*"`). **Never** use relative paths between packages.
- The application lives in `web/` (at the root); all shared code lives in `packages/*`.
- When creating a new shared package, place it in `packages/<name>` with `name` in the format `@nala/<name>` — the workspace detects it automatically (glob `packages/*`).
- Always import shared code by the package name (e.g. `import { Button } from "@nala/ui/components/button"`), never by relative path.

### 1.3 Commands (always run from the root)

- `bun install` — installs/relinks the whole workspace.
- `bun run dev` — starts the app in dev mode (turbo).

> **Restart `bun run dev` after any workspace change** — adding or removing a `packages/*` package, or deleting/renaming a module. `core` runs under `bun --hot`, which patches modules in place but does **not** re-resolve the dependency graph: a long-running process keeps a stale graph and then throws at runtime. The symptom is misleading — endpoints return **`500` on every request** while the exact same code in a freshly started process works fine. If something breaks right after a package-level change, restart before debugging anything else.
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

Biome respects `.gitignore` (`vcs.useIgnoreFile`), so `node_modules`, `.output`, `dist`, and `.turbo` are ignored automatically. Generated files are excluded by pattern in `biome.json` (`!**/*.gen.ts`, which covers `web/src/routeTree.gen.ts`). There are no per-package configs — always run from the root.

Apps:

- **`web`** — TanStack Start frontend (port 3000).
- **`core`** — Hono backend running on the Bun runtime (port 3001). The entry point `core/src/index.ts` exports `{ port, fetch }` (served directly by Bun, without an adapter). Run it standalone with `bun run --hot core/src/index.ts` or via `bun run dev` (turbo starts both apps).

### 1.3.2 API Documentation (OpenAPI + Scalar)

`core` publishes an **OpenAPI 3.1** spec and serves the **[Scalar](https://scalar.com)** UI:

- `GET /docs` — Scalar UI (`@scalar/hono-api-reference`).
- `GET /openapi.json` — spec generated at runtime.

The spec has a **single source** (`core/src/routes/docs.ts`): `core`'s own routes, annotated with `describeRoute()` from **`hono-openapi`** (v1) and **Zod v4** schemas (via `resolver()`) — either from `@nala/schemas` when they cross the app boundary, or from `core/src/schemas.ts` when they do not.

> There are no sign-in endpoints to document: authentication happens at Clerk, which publishes its own API reference. What `core` declares instead is the `clerkSessionToken` security scheme (HTTP bearer) in `DOCUMENTATION.components.securitySchemes`; protected routes opt in with `security: [{ clerkSessionToken: [] }]`.

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
    ├── webhooks.ts   # POST /api/webhooks/clerk (signature-authenticated)
    └── docs.ts       # GET /docs (Scalar) + GET /openapi.json
```

- Each file exports a `new Hono()` named `<route>Routes`, mounted in `index.ts` with `app.route("/", <route>Routes)` — the full path is declared inside the router itself.
- Protected routes type the router as `new Hono<{ Variables: AuthVariables }>()` and apply `requireAuth` on the handler.
- **Zod schemas specific to one route live in that route's file**; only what is shared goes to `core/src/schemas.ts`.
- After adding a router, re-export it in `routes/index.ts`.

> **Mounting order in `index.ts` (it matters):** `webhookRoutes` and `healthRoutes` **before** `sessionMiddleware` — neither carries a session, and resolving one would mean a pointless round trip to Clerk on every event and every health check. `mountDocs(app)` goes **last**: `generateSpecs` walks the routes already registered on the app.

### 1.4 shadcn/ui components

The shadcn components are **source code** living in the `@nala/ui` package (`packages/ui/src/components`), not an external dependency. The CLI version is pinned at `shadcn@4.13.1` (see `packages/ui/package.json`) — use it explicitly to stay consistent.

- **Add a component:** `bun x shadcn@4.13.1 add <component> -c packages/ui`
- **Add all of them:** `bun x shadcn@4.13.1 add --all --yes -c packages/ui`
- **Overwrite existing ones:** add the `--overwrite` flag (`-o`).
- The target is **always** `packages/ui` (via `-c packages/ui` or by running inside that folder) — never the `web` app.
- After adding, run `bun install` (new deps) and `bun run typecheck`.
- Once installed, import it in the app via `@nala/ui/components/<component>`.
- **Tooltip:** requires wrapping the app with `<TooltipProvider>` in `web/src/app/__root.tsx`.

`@nala/ui` also owns **typography**: `src/styles/globals.css` imports Inter and
Geist Mono from [Fontsource](https://fontsource.org) and binds them to
`--font-sans` / `--font-mono` in the `@theme` block. The fonts are self-hosted
(`.woff2` emitted into the build output) — there is no `next/font` and no call
out to Google Fonts. To change a typeface, swap the `@fontsource-variable/*`
dependency and those two variables; nothing in `web` needs to know.

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

### 1.6 The `web` app (TanStack Start)

`web` is a **[TanStack Start](https://tanstack.com/start) app built with Vite 8
and served by Nitro's `bun` preset** — Bun end to end, no Node runtime anywhere.
It replaced a Next.js App Router app; if something here looks like Next, it is a
leftover and should be fixed, not copied.

```
web/
├── vite.config.ts        # tanstackStart + viteReact + tailwindcss + nitro({ preset: "bun" })
├── public/               # served verbatim at the root (favicon.ico, …)
└── src/
    ├── start.ts          # createStart() — global request middleware (Clerk)
    ├── router.tsx        # getRouter() — one router instance per request
    ├── routeTree.gen.ts  # generated by the Start plugin; never edit, never lint
    ├── styles.css        # CSS entry: imports @nala/ui + registers web's Tailwind sources
    ├── app/              # file-based routes (routesDirectory)
    │   ├── __root.tsx    # document shell: <html>, ClerkProvider, ThemeProvider
    │   ├── index.tsx     # /
    │   ├── get-started.tsx
    │   └── jobs/
    │       ├── route.tsx # layout for /jobs/* — the guard lives here
    │       └── index.tsx # /jobs
    ├── components/       # app-level components (@/components/*)
    ├── hooks/            # zustand stores and hooks (@/hooks/*)
    └── lib/              # auth.ts (Clerk session), core.ts (calls into `core`)
```

- **Routing is file-based but not Next's.** `routesDirectory` is set to `app`
  purely to keep the old folder name; the conventions are TanStack Router's:
  `__root.tsx` instead of `layout.tsx`, `index.tsx` instead of `page.tsx`,
  `<dir>/route.tsx` for a nested layout (which must render `<Outlet />`),
  `$param.tsx` instead of `[param]`, `$.tsx` instead of `[...slug]`. Each file
  exports `const Route = createFileRoute("<path>")({ … })` — **the path string
  is written and maintained by the plugin**, so never hand-edit it.
- **`routeTree.gen.ts` is generated** on `vite dev` / `vite build`. It is
  committed, excluded from Biome (`!**/*.gen.ts`), and must never be edited.
  After adding or renaming a route, run a build (or start dev) so the types
  regenerate — until then `createFileRoute` reports the new path as invalid.
- **There is no `"use client"` / `"use server"`.** Every component runs in both
  places; there are no React Server Components here. What decides where code
  runs is `createServerFn()` — its handler body is stripped from the client
  bundle and becomes an RPC. Anything touching a secret belongs inside one.
- **Data and guards live on the route, not in the component.** `beforeLoad`
  runs before any child loader (server-side during SSR, over RPC on client
  navigations) and what it returns is merged into the route context, so
  children read it with `Route.useRouteContext()` instead of re-fetching. To
  bounce a visitor, `throw redirect({ to: "…" })` — only the router catches it.
- **Search params are typed.** Declare `validateSearch` on the route that owns
  them and type the result with optional keys (`{ job?: string }`), otherwise
  every `Link`/`redirect` to that route is forced to pass them. Read them with
  `Route.useSearch()`, or `useSearch({ from: "/jobs" })` from a component that
  is only ever mounted under that route.
- **Links:** `import { Link } from "@tanstack/react-router"` and use `to`, not
  `href`. `to` is checked against the generated route tree, so a typo is a type
  error. Use the callback form of `search` (`search={(prev) => …}`) to change
  one param without dropping the rest.
- **CSS:** `src/styles.css` is the single entry, referenced from `__root.tsx`
  as `import appCss from "../styles.css?url"` and injected through the route's
  `links`. It imports `@nala/ui/globals.css` (Tailwind, tokens, fonts) and adds
  `@source "./"` so Tailwind v4 scans `web`'s own files — without that line the
  classes used only here are silently dropped from the stylesheet.
- **Head tags** come from each route's `head()` (`meta`, `links`), rendered by
  `<HeadContent />` in `__root.tsx`. There is no `export const metadata`.
- **Build output** is `.output/` (`.output/public` for assets,
  `.output/server/index.mjs` for the server), started with
  `bun .output/server/index.mjs`. It is self-contained — the Dockerfile's
  runtime stage copies `.output` and nothing else, no `node_modules`.
- **This is not the Next.js you knew, and TanStack Start moves fast.** Before
  writing routing, server-function, or middleware code from memory, check the
  installed version's docs rather than assuming an API still exists.

### 1.7 Authentication (`@nala/auth`)

Identity lives at **[Clerk](https://clerk.com)**. The monorepo holds no
credentials, no sessions, no verification tokens — the only local trace of a
user is the mirror table described below.

**Separation of responsibilities:** `@nala/auth` (`packages/auth`) is the
**server-side** integration — verifying tokens, syncing users, handling
webhooks. `web` talks to Clerk through its own SDK and never imports this
package.

- **Package entry points** (`@clerk/backend`, **server only**):
  - `@nala/auth` — `clerk` (Backend API client), `authenticateRequest()`, `getOrSyncUser()`, `TRUSTED_ORIGINS`.
  - `@nala/auth/webhooks` — `verifyClerkWebhook()`, `syncUserFromWebhook()`.
  - `@nala/auth/env` — the validated environment variables.
- **In `web`:** the SDK is **`@clerk/tanstack-react-start`** — never
  `@clerk/nextjs`, which drags Next.js back in.
  - `<ClerkProvider>` wraps the document in `src/app/__root.tsx`.
  - `clerkMiddleware()` is registered once as a global request middleware in
    `src/start.ts`. Without it every server-side `auth()` call throws.
  - `src/lib/auth.ts` — `getAuthState()`, the cheap "is there a session?" check
    used by `/get-started`. It never leaves the process.
  - `src/lib/core.ts` — `coreFetch()` / `getCurrentUser()` / `requireUser()`,
    for routes that need the user themselves. `requireUser()` in a `beforeLoad`
    is the standard guard. It distinguishes **`anonymous`** (no Clerk session →
    redirect to `/get-started`) from **`unavailable`** (there *is* a session but
    `core` did not answer → throw, and let the route's `errorComponent` show
    it). Never collapse the two: redirecting a signed-in visitor to the entry
    page only sends them back, and the browser loops.
  - Signing out is `<UserButton />` from the SDK, in `/jobs`'s layout header —
    the app has no sign-out of its own.
  - Sign-in UI is Clerk's prebuilt `<SignIn withSignUp />` on `/get-started`,
    left on hash routing so the whole flow lives under one typed route.
- **In `core` (Hono):** verify the token with `authenticateRequest()` and
  resolve the local row with `getOrSyncUser()`. `web` and `core` sit on
  different origins, so Clerk's cookie is not sent along — the session token
  travels as `Authorization: Bearer <token>`, minted server-side by
  `coreFetch()`.
- **The `user` table is a cache, not the authority** (`@nala/db`,
  `src/schema/user.ts`). Its `id` is the Clerk user id, so it deliberately does
  **not** spread `TABLE_DEFAULTS` (which would generate a local nanoid). It is
  written by the `user.*` webhooks and by `getOrSyncUser()`'s lazy fallback —
  never treat it as the source of truth for identity.
- **Environment variables** (root `.env`, see §1.1):
  `VITE_CLERK_PUBLISHABLE_KEY` is public and inlined into the browser bundle;
  `CLERK_SECRET_KEY` and `CLERK_WEBHOOK_SIGNING_SECRET` are server-only and
  must **never** carry a `VITE_` prefix. `AUTH_TRUSTED_ORIGINS` is one list
  serving two purposes: the CORS allow-list and Clerk's `authorizedParties`.

  > **Never import `@nala/auth` or `@nala/db` inside `web`.** `@nala/db` uses
  > `drizzle-orm/bun-sql`, which needs the native `bun:sql` module, and
  > `@nala/auth` reads `CLERK_SECRET_KEY`. Only `core` talks to either.
  > Importing **types** with `import type` is safe (erased at compile time).

- **Module resolution:** `@nala/auth` and `@nala/db` extend
  `@nala/typescript-config/library.json` (`moduleResolution: "Bundler"`) and
  use relative imports **without an extension**.

### 1.8 Shared schemas (`@nala/schemas`)

Zod schemas that **cross the app boundary** live in **`@nala/schemas`** (`packages/schemas`), so `web` and `core` describe the same payload from one definition.

```
packages/schemas/src/
├── index.ts   # barrel
├── auth.ts    # auth input schemas
└── user.ts    # userSchema / meSchema — the user as it travels over the wire
```

- **Runtime-agnostic by design:** no DB, no Bun, no React imports — that is what lets both the TanStack Start app and the Hono backend depend on it. A server-only import here breaks the `web` build.
- **Where a schema belongs:** shared between apps → `@nala/schemas`. Used by several `core` routes only → `core/src/schemas.ts`. Used by one route only → that route's file (see §1.3.3).
- Zod is pinned at `4.4.3` across the monorepo — a second Zod copy produces confusing "two different Zod instances" type errors.
- `core` serialises its responses from these schemas and publishes them in the OpenAPI spec through `resolver()`; `web` parses the same response with `safeParse` instead of restating the shape.
- Validation messages are user-facing, so keep them as literals in the schema, ready to lift into translation files (REQUIREMENTS.MD §3).

**Forms in `web`:** this shadcn registry is **Base UI**-based, so there is **no
`form` component** (`shadcn add form` silently adds nothing). Use the **`Field`**
primitives instead — `Field`, `FieldLabel`, `FieldDescription`, `FieldError`,
`FieldSeparator` from `@nala/ui/components/field` — and put `noValidate` on the
`<form>` so Zod owns validation rather than the browser's native bubbles.
Client-side validation is a **UX affordance only, never the trust boundary** —
always re-validate on the server.

NOTES:

- after each instruction, run `bun format` in project's root directory
- always check if the changes made doesn't need a edit in all Dockerfiles
