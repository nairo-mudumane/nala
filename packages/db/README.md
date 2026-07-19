# @nala/db

Camada de acesso a dados do Nala. Aqui vivem **toda a configuração do Drizzle**,
a **conexão ao PostgreSQL (18)** e **todos os schemas**.

Usa o driver nativo de PostgreSQL do Bun (`drizzle-orm/bun-sql`) — não há
dependência de `pg`/`postgres`.

## Uso

```ts
import { db, applications, eq } from "@nala/db";

const rows = await db.select().from(applications);

await db.insert(applications).values({ company: "Acme", role: "SWE" });
```

## Setup

1. Copia o exemplo de ambiente e preenche a `DATABASE_URL`:

   ```sh
   cp packages/db/.env.example packages/db/.env
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
```

Para adicionar uma tabela: cria `src/schema/<tabela>.ts` e reexporta-a em
`src/schema/index.ts`.
