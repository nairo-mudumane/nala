# Nala — Guia Técnico (AGENTS)

> [!IMPORTANT]
> **Pré-requisito de leitura — ler ANTES de qualquer trabalho técnico.**
> Este ficheiro cobre apenas o **como** (arquitetura, convenções, comandos). O **o quê** e o **porquê** vivem em **[REQUIREMENTS.MD](REQUIREMENTS.MD)** (requisitos de negócio).
>
> Fluxo obrigatório: **1)** lê [REQUIREMENTS.MD](REQUIREMENTS.MD) → **2)** lê este ficheiro → **3)** só depois escreves ou alteras código.
> Nenhuma decisão técnica deve ser tomada sem o contexto de negócio. Se ainda não leste os requisitos, para e lê-os primeiro.

## 1. Arquitetura do Repositório

O projeto é um **monorepo gerido com [Bun workspaces](https://bun.com/docs/install/workspaces) + [Turborepo](https://turborepo.dev)**.

### 1.1 Estrutura

```
nala/
├── package.json          # raiz do workspace (bun@1.3.3), scripts turbo
├── turbo.json            # pipeline de tasks (build, dev, typecheck)
├── biome.json            # lint + format (Biome) — config única para todo o monorepo
├── tsconfig.json         # estende @nala/typescript-config
├── web/                  # aplicação frontend Next.js (package: "web")
├── core/                 # backend Hono sobre Bun (package: "core", porta 3001)
└── packages/
    ├── db/               # @nala/db — Drizzle + conexão PostgreSQL (v18) + schemas
    ├── auth/             # @nala/auth — Better Auth (servidor + cliente React)
    ├── ui/               # @nala/ui — componentes shadcn/ui partilhados
    └── typescript-config/# @nala/typescript-config
```

Há **um único `.env` na raiz** para todo o monorepo (`cp .env.example .env`).
O `core` e os scripts de `packages/*` consomem-no via `bun --env-file=...`; o
`web` lê-o pelo carregamento nativo do Next através de um symlink
`web/.env → ../.env`, criado automaticamente pelo `postinstall`. Não criar
`.env` com conteúdo próprio por pacote.

> O `bun --env-file` **não** funciona para o `web`: o `next dev` arranca um
> servidor Node que não herda essas variáveis (verificado empiricamente). O
> symlink é o que faz o Next carregá-las nativamente.

### 1.2 Convenções de workspaces

- Pacotes internos são referenciados pelo nome com o protocolo `workspace:*` (ex.: `"@nala/ui": "workspace:*"`). **Nunca** usar caminhos relativos entre pacotes.
- A aplicação vive em `web/` (na raiz); todo o código partilhado vive em `packages/*`.
- Ao criar um novo pacote partilhado, coloca-o em `packages/<nome>` com `name` no formato `@nala/<nome>` — o workspace deteta-o automaticamente (glob `packages/*`).
- Importar código partilhado sempre pelo nome do pacote (ex.: `import { Button } from "@nala/ui/components/button"`), nunca por caminho relativo.

### 1.3 Comandos (correr sempre a partir da raiz)

- `bun install` — instala/religa todo o workspace.
- `bun run dev` — arranca a app em modo dev (turbo).
- `bun run build` — build de produção de todos os pacotes.
- `bun run typecheck` — via turbo, em todos os pacotes.
- `bun run lint` — Biome analisa todo o monorepo (uma passagem única a partir da raiz, sem turbo).
- `bun run format` — Biome formata e escreve (`biome format --write .`).
- `bun run check` — Biome corre lint + format + fixes seguros num só comando (`biome check --write .`).

### 1.3.1 Lint & Format (Biome)

O lint e a formatação são geridos por **[Biome](https://biomejs.dev)** (`@biomejs/biome`, fixado em `2.5.4`), com **uma config única na raiz** (`biome.json`) para todo o monorepo — substitui ESLint + Prettier. Convenções impostas:

- Ponto e vírgula (`;`) no fim de cada linha (`semicolons: "always"`).
- Aspas duplas, incluindo em importações (`quoteStyle: "double"`).
- Proíbe variáveis e importações não utilizadas (`noUnusedVariables`/`noUnusedImports` como `error`).
- **Não** reordena importações (`assist.actions.source.organizeImports: "off"`).
- Indentação de 2 espaços, largura de linha 80, fim de linha `lf`.

Biome respeita o `.gitignore` (`vcs.useIgnoreFile`), pelo que `node_modules`, `.next`, `dist` e `.turbo` são ignorados automaticamente. Não há configs por pacote — corre sempre a partir da raiz.

Apps:

- **`web`** — frontend Next.js (porta 3000).
- **`core`** — backend Hono a correr sobre o runtime Bun (porta 3001). Ponto de entrada `core/src/index.ts` exporta `{ port, fetch }` (servido diretamente pelo Bun, sem adaptador). Corre isolado com `bun run --hot core/src/index.ts` ou via `bun run dev` (turbo arranca ambas as apps).

### 1.3.2 Documentação da API (OpenAPI + Scalar)

O `core` publica um spec **OpenAPI 3.1** e serve a UI do **[Scalar](https://scalar.com)**:

- `GET /docs` — UI do Scalar (`@scalar/hono-api-reference`).
- `GET /openapi.json` — spec gerado em runtime.

O spec resulta da **fusão de duas fontes** (`core/src/openapi.ts`):

1. As rotas próprias do `core`, anotadas com `describeRoute()` do **`hono-openapi`** (v1) e schemas **Zod v4** de `core/src/schemas.ts` (via `resolver()`).
2. Os endpoints do Better Auth, obtidos de `auth.api.generateOpenAPISchema()` (plugin `openAPI()` em `packages/auth/src/server.ts`). Os paths vêm relativos à base de auth, por isso são prefixados com `/api/auth`, re-tagueados como `Autenticação`, e os schemas são renomeados com o prefixo `Auth` (`User` → `AuthUser`) para não colidirem com os das rotas próprias — os `$ref` são reescritos em conjunto.

> O plugin do Better Auth corre com `disableDefaultReference: true`: a referência dele em `/api/auth/reference` fica desligada para haver **uma única UI** (`/docs`) com toda a API. O catch-all `/api/auth/*` é excluído do `generateSpecs` porque os paths reais entram pelo fragmento de auth.

**Ao adicionar uma rota nova ao `core`:** cria `core/src/routes/<rota>.ts` (ver §1.3.3), envolve o handler com `describeRoute({ tags, summary, responses })` e usa uma `tag` **já declarada** em `DOCUMENTATION.tags` (`routes/docs.ts`) — uma tag não declarada aparece como grupo solto no Scalar. Sem `describeRoute` a rota aparece no spec sem documentação.

`hono-openapi` declara as suas dependências como **peer deps** — `@hono/standard-validator`, `@standard-community/standard-json`, `@standard-community/standard-openapi`, `openapi-types`, `@types/json-schema` estão explícitas no `core/package.json`. Sem elas o arranque rebenta com `Cannot find module '@hono/standard-validator'`.

### 1.3.3 Organização das rotas do `core`

**Todas as rotas vivem em `core/src/routes/*`, uma por ficheiro.** O `core/src/index.ts` limita-se a criar a app, aplicar middleware global (CORS, sessão) e montar os routers — nunca define handlers.

```
core/src/
├── index.ts          # app + middleware global + montagem dos routers
├── auth.ts           # middleware de auth (sessionMiddleware, requireAuth) — não são rotas
├── schemas.ts        # schemas Zod partilhados por várias rotas (ex.: ErrorSchema)
└── routes/
    ├── index.ts      # barril — reexporta todos os routers
    ├── root.ts       # GET /
    ├── health.ts     # GET /health
    ├── me.ts         # GET /me (protegida)
    ├── auth.ts       # catch-all /api/auth/* (handler do Better Auth)
    └── docs.ts       # GET /docs (Scalar) + GET /openapi.json
```

- Cada ficheiro exporta um `new Hono()` com o nome `<rota>Routes`, montado em `index.ts` com `app.route("/", <rota>Routes)` — o path completo é declarado dentro do próprio router.
- Rotas protegidas tipam o router como `new Hono<{ Variables: AuthVariables }>()` e aplicam `requireAuth` no handler.
- **Schemas Zod específicos de uma rota vivem no ficheiro dessa rota**; só o que é partilhado vai para `core/src/schemas.ts`.
- Depois de adicionar um router, reexporta-o em `routes/index.ts`.

> **Ordem de montagem em `index.ts` (importa):** `authRoutes` **antes** do `sessionMiddleware` (senão o handler do Better Auth corre com a sessão já resolvida), e `mountDocs(app)` **por último** — o `generateSpecs` percorre as rotas já registadas na app.

### 1.4 Componentes shadcn/ui

Os componentes shadcn são **código-fonte** que vive no pacote `@nala/ui` (`packages/ui/src/components`), não uma dependência externa. A versão do CLI está fixada em `shadcn@4.13.1` (ver `packages/ui/package.json`) — usa-a explicitamente para manter consistência.

- **Adicionar um componente:** `bun x shadcn@4.13.1 add <componente> -c packages/ui`
- **Adicionar todos:** `bun x shadcn@4.13.1 add --all --yes -c packages/ui`
- **Sobrescrever existentes:** juntar a flag `--overwrite` (`-o`).
- O alvo é **sempre** `packages/ui` (via `-c packages/ui` ou correndo dentro dessa pasta) — nunca a app `web`.
- Após adicionar, corre `bun install` (deps novas) e `bun run typecheck`.
- Depois de instalar, importa na app por `@nala/ui/components/<componente>`.
- **Tooltip:** requer envolver a app com `<TooltipProvider>` em `web/app/layout.tsx`.

### 1.5 Base de dados (`@nala/db`)

Toda a camada de dados vive no pacote **`@nala/db`** (`packages/db`): configuração do **[Drizzle ORM](https://orm.drizzle.team)** (`drizzle-orm` fixado em `0.45.2`, `drizzle-kit` em `0.31.10`), a **conexão ao PostgreSQL (18)** e **todos os schemas**. Nenhum outro pacote define schemas ou abre conexões à BD — importam sempre de `@nala/db`.

- **Driver:** usa o PostgreSQL nativo do Bun via `drizzle-orm/bun-sql` (`Bun.SQL`) — **sem** `pg`/`postgres` em runtime. O `pg` existe apenas como `devDependency` para as ferramentas do `drizzle-kit` (`db:push`/`db:studio`); migrações em produção correm com o migrator nativo de Bun.
- **Conexão:** `DATABASE_URL` é validada em `src/env.ts`. Vive no **`.env` único da raiz** do monorepo (`cp .env.example .env`) — os scripts de BD/`core` passam-no com `--env-file`, e o `web` lê-o via symlink `web/.env` (ver §1.1).
- **Importar:** `import { db, user, eq } from "@nala/db"` — o pacote reexporta o cliente `db`, os schemas/tipos e os operadores do `drizzle-orm`. Nunca por caminho relativo.
- **Adicionar uma tabela:** cria `src/schema/<tabela>.ts` e reexporta-a em `src/schema/index.ts` (barril único apontado pelo `drizzle.config.ts` e pelo cliente).
- **Convenção de nomes:** chaves em `camelCase` no TS → colunas em `snake_case` na BD (`casing: "snake_case"`, definido no cliente e no `drizzle.config.ts`).
- **Comandos (correr a partir de `packages/db`):**
  - `bun run db:generate` — gera migrações SQL a partir dos schemas → `packages/db/drizzle` (commitar).
  - `bun run db:migrate` — aplica migrações pendentes (migrator nativo de Bun, sem `pg`).
  - `bun run db:push` — sincroniza o schema direto na BD (dev/prototipagem).
  - `bun run db:studio` — abre o Drizzle Studio.

<!-- BEGIN:nextjs-agent-rules -->

### 1.6 Autenticação (`@nala/auth`)

Toda a autenticação vive no pacote **`@nala/auth`** (`packages/auth`), assente no **[Better Auth](https://better-auth.com)** (`better-auth` fixado em `1.6.23`) com o `drizzleAdapter` sobre o `@nala/db`.

**Separação de responsabilidades:** as **tabelas** (`user`, `session`, `account`, `verification`) vivem em `@nala/db` (`src/schema/auth.ts`), a **lógica** vive em `@nala/auth`. Assim há um único `drizzle.config.ts` e uma única pasta de migrações em todo o monorepo — nunca criar um segundo setup de Drizzle dentro de `packages/auth`.

- **Servidor de auth:** é a app `core` (Hono, porta 3001). Monta o handler em `/api/auth/*` (`core/src/auth.ts`) e é o único endpoint HTTP de autenticação. O `web` **não** tem `app/api/auth/[...all]/route.ts`.
- **Entradas do pacote:**
  - `@nala/auth` — instância `auth` + tipos (`Auth`, `AuthSession`, `AuthUser`). **Só servidor.**
  - `@nala/auth/client` — `authClient` (`better-auth/react`) para Client Components.
- **No Hono (`core`):** `sessionMiddleware` popula `c.var.user`/`c.var.session`; `requireAuth` protege rotas (401). Ver `/me` em `core/src/index.ts` como exemplo.
- **No Next.js (`web`):**
  - Servidor (Server Components / Actions): `getSession()` / `requireSession()` de `web/lib/auth.ts`. Fazem `fetch` a `core` (`/api/auth/get-session`) reencaminhando os cookies, memoizado por pedido com `cache()` do React.
  - Browser: `authClient.useSession()`, `authClient.signIn.email(...)`, etc., a partir de `@nala/auth/client` (aponta para `NEXT_PUBLIC_AUTH_URL`).

  > **Nunca importar `@nala/auth` (raiz) nem `@nala/db` dentro do `web`.** O Next corre em **Node** e o `@nala/db` usa `drizzle-orm/bun-sql`, que precisa do módulo nativo `bun:sql` — o import rebenta em runtime com `Cannot find module 'bun:sql'`. Só o `core` (Bun) fala com a BD. Importar **tipos** com `import type` é seguro (é apagado na compilação).

- **IDs:** `advanced.database.generateId` usa `nanoid(21)`, alinhado com `TABLE_DEFAULTS` de `packages/db/src/utils.ts`. Qualquer tabela nova deve espalhar `...TABLE_DEFAULTS` para herdar `id`/`createdAt`/`updatedAt`. Isto afeta **só os IDs das linhas** — o `token` de sessão continua a ser gerado pelo CSPRNG interno do Better Auth (`generateId(32)`).
- **Hashing de passwords:** `Bun.password` com `argon2id` (ver `emailAndPassword.password` em `server.ts`), a substituir o `scrypt` por omissão do Better Auth. Depende do runtime Bun — outra razão para o hashing só acontecer no `core`.
- **Resolução de módulos:** `@nala/auth` e `@nala/db` estendem `@nala/typescript-config/library.json` (`moduleResolution: "Bundler"`) e usam imports relativos **sem extensão**. Com o `.js` do NodeNext o Turbopack não resolve os ficheiros `.ts` e o build do `web` falha com `Module not found`.
- **Alterar a config do Better Auth** (plugins, campos extra) exige refletir o schema:
  1. edita `packages/auth/src/server.ts`;
  2. corre `bun run auth:verify` (em `packages/auth`) — compara a config com o schema Drizzle e falha se houver tabelas/colunas em falta;
  3. atualiza `packages/db/src/schema/auth.ts` até passar;
  4. corre `bun run db:generate` e `bun run db:migrate` (em `packages/db`).

  > O `@better-auth/cli generate` **não** funciona neste projeto: carrega a config com jiti/Node e rebenta ao importar `drizzle-orm/bun-sql` (depende do módulo nativo `bun:sql`). Usar `auth:verify` no lugar dele.

### 1.7 Esta NÃO é a Next.js que conheces

Esta versão tem breaking changes — APIs, convenções e estrutura de ficheiros podem diferir do teu conhecimento de treino. Lê o guia relevante em `web/node_modules/next/dist/docs/` antes de escrever código. Presta atenção a avisos de deprecação.
<!-- END:nextjs-agent-rules -->
