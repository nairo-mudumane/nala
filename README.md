# Nala

A strategic job-application management platform. See
[REQUIREMENTS.MD](REQUIREMENTS.MD) for the product context and
[AGENTS.MD](AGENTS.MD) for the technical guide.

A Bun workspaces + Turborepo monorepo:

| Package                   | What                                                       |
| ------------------------- | ---------------------------------------------------------- |
| `web`                     | TanStack Start app (Vite + Nitro on Bun), port 3000         |
| `core`                    | Hono backend on Bun, port 3001                              |
| `packages/db`             | Drizzle + PostgreSQL 18                                     |
| `packages/auth`           | Clerk integration (server only)                             |
| `packages/schemas`        | Zod schemas shared by `web` and `core`                      |
| `packages/ui`             | shadcn/ui components, design tokens, fonts                  |
| `packages/typescript-config` | Shared `tsconfig` bases                                  |

## Getting started

```bash
cp .env.example .env   # fill in the Clerk keys and DATABASE_URL
bun install
bun run dev            # web on :3000, core on :3001
```

There is **a single `.env` at the root** for the whole monorepo. `web` reaches
it through a `web/.env → ../.env` symlink created by `postinstall` — do not add
per-package `.env` files.

You will need a [Clerk](https://dashboard.clerk.com) application and a
PostgreSQL 18 database. Take the two API keys from Clerk → **API keys**, and the
signing secret from Clerk → **Webhooks**, after adding an endpoint that points
at `<core>/api/webhooks/clerk` and subscribes to `user.created`, `user.updated`,
and `user.deleted`. Then apply the migrations:

```bash
cd packages/db && bun run db:migrate
```

> Clerk cannot reach `localhost`, so that webhook does not fire in local
> development. Nothing breaks: `core` falls back to fetching the user from
> Clerk's API on their first authenticated request.

## Commands

Always from the root:

- `bun run dev` — both apps in watch mode.
- `bun run build` — production build of every package.
- `bun run typecheck` — `tsc --noEmit` across the workspace.
- `bun run check` — Biome lint + format with safe fixes.

## Adding UI components

shadcn components are source code inside `@nala/ui`, never installed into the
app:

```bash
bun x shadcn@4.13.1 add button -c packages/ui
```

Then import them by package name:

```tsx
import { Button } from "@nala/ui/components/button";
```
