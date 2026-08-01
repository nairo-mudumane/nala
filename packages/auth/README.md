# @nala/auth

Nala's **server-side** Clerk integration, built on
[`@clerk/backend`](https://clerk.com/docs/references/backend/overview).

Identity lives at Clerk: credentials, sessions, email verification, and OAuth
links never touch this database. The only local trace of a user is the `user`
mirror table in `@nala/db` (`src/schema/user.ts`), kept in sync by the Clerk
webhooks — treat it as an eventually-consistent cache, never as the authority.

> **Server only.** This package reads `CLERK_SECRET_KEY`. `web` never imports
> it — the browser side uses `@clerk/tanstack-react-start` directly.

## Entry points

| Import                 | What                                                            |
| ---------------------- | --------------------------------------------------------------- |
| `@nala/auth`           | `clerk`, `authenticateRequest()`, `getOrSyncUser()`, `AuthState` |
| `@nala/auth/webhooks`  | `verifyClerkWebhook()`, `syncUserFromWebhook()`, `WebhookEvent`  |
| `@nala/auth/env`       | `TRUSTED_ORIGINS` + the validated environment variables          |

## Usage in Hono (`core`)

`web` and `core` sit on different origins, so Clerk's session cookie is not sent
along — the short-lived session token arrives as `Authorization: Bearer <token>`
and is verified against Clerk's JWKS.

```ts
import { authenticateRequest, getOrSyncUser } from "@nala/auth";

const state = await authenticateRequest(ctx.req.raw); // null when anonymous
if (!state) return ctx.json({ error: "Not authenticated" }, 401);

const user = await getOrSyncUser(state.userId); // local mirror, created on demand
```

`getOrSyncUser` doubles as the provisioning step: the first authenticated
request from a brand-new account inserts the row, which covers both the window
before the webhook lands and local development, where webhooks never reach
`localhost` without a tunnel.

## Usage in `web`

Not through this package. `web` uses **`@clerk/tanstack-react-start`**:

```tsx
// src/start.ts — required, or every server-side auth() call throws
import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
export const startInstance = createStart(() => ({
  requestMiddleware: [clerkMiddleware()],
}));
```

```ts
// src/lib/auth.ts — cheap "is there a session?" check, in a server function
const { isAuthenticated, userId } = await auth();
```

```ts
// src/lib/core.ts — the user as `core` knows them, for protected routes
const user = await requireUser(); // redirects to /get-started when anonymous
```

## Environment variables

They live in the monorepo's **root** `.env` (see `.env.example`; `web` reads it
through a `web/.env → ../.env` symlink created in `postinstall`):

| Variable                       | Side    | Notes                                        |
| ------------------------------ | ------- | -------------------------------------------- |
| `VITE_CLERK_PUBLISHABLE_KEY`   | public  | Inlined into the browser bundle by Vite       |
| `CLERK_SECRET_KEY`             | server  | Backend API key — never give it a `VITE_` prefix |
| `CLERK_WEBHOOK_SIGNING_SECRET` | server  | Verifies the `user.*` webhook payloads        |
| `AUTH_TRUSTED_ORIGINS`         | server  | CORS allow-list **and** Clerk's `authorizedParties` |

> **`web` never imports `@nala/auth` or `@nala/db` at runtime.** `@nala/db` uses
> `drizzle-orm/bun-sql`, which needs the native `bun:sql` module. Importing
> types with `import type` is safe.

## Webhooks

`core` exposes the endpoint; this package does the verifying and the syncing.

```ts
import { syncUserFromWebhook, verifyClerkWebhook } from "@nala/auth/webhooks";

const event = await verifyClerkWebhook(ctx.req.raw); // throws on a bad signature
const changed = await syncUserFromWebhook(event);
```

A failed verification must answer `400` so Clerk retries — and so an unsigned
POST can never write to the database.
