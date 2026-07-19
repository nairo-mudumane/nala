# @nala/db

Camada de acesso a dados do Nala. Aqui vivem **toda a configuração do Drizzle**,
a **conexão ao PostgreSQL (18)** e **todos os schemas**.

Usa o driver nativo de PostgreSQL do Bun (`drizzle-orm/bun-sql`) — não há
dependência de `pg`/`postgres`.

## Uso

```ts
import { db, user, eq } from "@nala/db";

const rows = await db.select().from(user);

const [row] = await db.select().from(user).where(eq(user.email, "a@b.com"));
```

## Setup

1. Copia o exemplo de ambiente **na raiz do monorepo** e preenche a
   `DATABASE_URL` (há um único `.env` para todo o workspace):

   ```sh
   cp .env.example .env
   ```

2. Gera e aplica migrações (correr dentro de `packages/db`):

   ```sh
   cd packages/db
   bun run db:generate   # gera SQL a partir dos schemas → ./drizzle
   bun run db:migrate    # aplica as migrações à base de dados
   ```

## Comandos (a partir de `packages/db`)

| Comando              | Descrição                                             |
| -------------------- | ----------------------------------------------------- |
| `bun run db:generate`| Gera migrações SQL a partir dos schemas.              |
| `bun run db:migrate` | Aplica as migrações pendentes.                        |
| `bun run db:push`    | Sincroniza o schema direto na BD (dev/prototipagem).  |
| `bun run db:studio`  | Abre o Drizzle Studio.                                |

## Estrutura

```
packages/db/
├── drizzle.config.ts   # config do Drizzle Kit (dialeto, schema, migrações)
├── drizzle/            # migrações SQL geradas (commitadas)
└── src/
    ├── index.ts        # API pública (db + schema + operadores)
    ├── client.ts       # cliente Drizzle sobre Bun.SQL
    ├── env.ts          # validação de DATABASE_URL
    └── schema/         # um ficheiro por tabela + barril (index.ts)
        └── auth.ts     # tabelas do Better Auth (geridas por @nala/auth)
```

> As tabelas de autenticação (`user`, `session`, `account`, `verification`)
> vivem aqui, mas o seu formato é ditado pelo `@nala/auth`. Depois de mexer na
> config do Better Auth, corre `bun run auth:verify` em `packages/auth` antes
> de gerar migrações.

Para adicionar uma tabela: cria `src/schema/<tabela>.ts` e reexporta-a em
`src/schema/index.ts`.
