# @nala/auth

Autenticação do Nala, sobre [Better Auth](https://better-auth.com) + Drizzle
(`@nala/db`).

As **tabelas** vivem em `@nala/db` (`src/schema/auth.ts`); aqui vive só a
**lógica**. Isso mantém um único `drizzle.config.ts` e uma única pasta de
migrações no monorepo.

O **servidor de auth é a app `core`** (Hono, porta 3001), que monta o handler em
`/api/auth/*`. O `web` não expõe rotas de auth.

## Entradas

| Import                | Onde                      | O quê                                    |
| --------------------- | ------------------------- | ---------------------------------------- |
| `@nala/auth`          | servidor (Hono, RSC)      | instância `auth` + tipos                 |
| `@nala/auth/client`   | browser (Client Component)| `authClient` (`better-auth/react`)       |

## Uso no Hono (`core`)

```ts
import { authRoutes, requireAuth, sessionMiddleware } from "./auth.js";

app.route("/", authRoutes);      // /api/auth/*
app.use("*", sessionMiddleware); // popula c.var.user / c.var.session

app.get("/me", requireAuth, (c) => c.json({ user: c.var.user }));
```

## Uso no Next.js (`web`)

Servidor (Server Component, Server Action) — sem salto HTTP:

```ts
import { getSession, requireSession } from "@/lib/auth";

const session = await getSession();      // null se não autenticado
const { user } = await requireSession(); // redireciona para /sign-in
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

## Variáveis de ambiente

Vivem no `.env` **da raiz** do monorepo (ver `.env.example`):
`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `AUTH_TRUSTED_ORIGINS`,
`NEXT_PUBLIC_AUTH_URL` e, opcionalmente, `AUTH_COOKIE_DOMAIN`.

## Alterar a config

O `@better-auth/cli generate` não corre aqui (carrega a config com jiti/Node e
rebenta ao importar `drizzle-orm/bun-sql`). Em vez disso:

```sh
bun run auth:verify   # compara a config do Better Auth com o schema Drizzle
```

Depois de alinhar `packages/db/src/schema/auth.ts`, gera e aplica migrações em
`packages/db` (`bun run db:generate` → `bun run db:migrate`).
