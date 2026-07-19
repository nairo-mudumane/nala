# @nala/auth

Nala's authentication, built on [Better Auth](https://better-auth.com) + Drizzle
(`@nala/db`).

The **tables** live in `@nala/db` (`src/schema/auth.ts`); only the **logic**
lives here. That keeps a single `drizzle.config.ts` and a single migrations
folder in the monorepo.

The **auth server is the `core` app** (Hono, port 3001), which mounts the handler
at `/api/auth/*`. `web` does not expose any auth routes.

## Entry points

| Import                | Where                      | What                               |
| --------------------- | -------------------------- | ---------------------------------- |
| `@nala/auth`          | server (Hono, RSC)         | `auth` instance + types            |
| `@nala/auth/client`   | browser (Client Component) | `authClient` (`better-auth/react`) |

## Usage in Hono (`core`)

```ts
import { authRoutes, requireAuth, sessionMiddleware } from "./auth.js";

app.route("/", authRoutes);      // /api/auth/*
app.use("*", sessionMiddleware); // populates c.var.user / c.var.session

app.get("/me", requireAuth, (c) => c.json({ user: c.var.user }));
```

## Usage in Next.js (`web`)

Server (Server Component, Server Action) — over HTTP to `core`, memoized per
request:

```ts
import { getSession, requireSession } from "@/lib/auth";

const session = await getSession();      // null if not authenticated
const { user } = await requireSession(); // redirects to /sign-in
```

Browser:

```tsx
"use client";
import { authClient } from "@nala/auth/client";

const { data: session, isPending } = authClient.useSession();

await authClient.signUp.email({ name, email, password });
await authClient.signIn.email({ email, password });
await authClient.signOut();
```

## Environment variables

They live in the monorepo's **root** `.env` (see `.env.example`; `web` reads it
through a `web/.env → ../.env` symlink created in `postinstall`):
`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `AUTH_TRUSTED_ORIGINS`,
`NEXT_PUBLIC_AUTH_URL` and, optionally, `AUTH_COOKIE_DOMAIN`.

> **`web` never imports `@nala/auth` (root) or `@nala/db` at runtime.** Next
> runs on Node and `@nala/db` uses `drizzle-orm/bun-sql`, which needs the native
> `bun:sql` module. Importing types with `import type` is safe.

## Changing the config

`@better-auth/cli generate` does not run here (it loads the config with
jiti/Node and blows up when importing `drizzle-orm/bun-sql`). Instead:

```sh
bun run auth:verify   # compares the Better Auth config against the Drizzle schema
```

Once `packages/db/src/schema/auth.ts` is aligned, generate and apply the
migrations in `packages/db` (`bun run db:generate` → `bun run db:migrate`).
