# @nala/db

Nala's data access layer. This is where **all the Drizzle configuration**, the
**PostgreSQL (18) connection**, and **all schemas** live.

It uses Bun's native PostgreSQL driver (`drizzle-orm/bun-sql`) — there is no
dependency on `pg`/`postgres`.

## Usage

```ts
import { db, user, eq } from "@nala/db";

const rows = await db.select().from(user);

const [row] = await db.select().from(user).where(eq(user.email, "a@b.com"));
```

## Setup

1. Copy the environment example **at the monorepo root** and fill in
   `DATABASE_URL` (there is a single `.env` for the whole workspace):

   ```sh
   cp .env.example .env
   ```

2. Generate and apply the migrations (run inside `packages/db`):

   ```sh
   cd packages/db
   bun run db:generate   # generates SQL from the schemas → ./drizzle
   bun run db:migrate    # applies the migrations to the database
   ```

## Commands (from `packages/db`)

| Command              | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `bun run db:generate`| Generates SQL migrations from the schemas.           |
| `bun run db:migrate` | Applies pending migrations.                          |
| `bun run db:push`    | Syncs the schema straight to the DB (dev/prototyping).|
| `bun run db:studio`  | Opens Drizzle Studio.                                |

## Structure

```
packages/db/
├── drizzle.config.ts   # Drizzle Kit config (dialect, schema, migrations)
├── drizzle/            # generated SQL migrations (committed)
└── src/
    ├── index.ts        # public API (db + schema + operators)
    ├── client.ts       # Drizzle client over Bun.SQL
    ├── env.ts          # DATABASE_URL validation
    └── schema/         # one file per table + barrel (index.ts)
        └── user.ts     # local mirror of the Clerk user
```

> **There are no authentication tables.** Identity lives at
> [Clerk](https://clerk.com) — no sessions, no credentials, no verification
> tokens. The `user` table is a **cache** of the Clerk user, keyed by the Clerk
> id (`user_...`), so the app's own tables can hold a real foreign key. Because
> that id comes from Clerk, `user` deliberately does **not** spread
> `TABLE_DEFAULTS` (which generates a local nanoid).
>
> It is written by the `user.*` webhooks handled in `core`, plus the
> `getOrSyncUser()` fallback in `@nala/auth`. To mirror an extra Clerk field,
> change `schema/user.ts`, `syncUserFromWebhook`, and `getOrSyncUser` together,
> then generate and apply the migration.

To add a table: create `src/schema/<table>.ts` and re-export it in
`src/schema/index.ts`.
