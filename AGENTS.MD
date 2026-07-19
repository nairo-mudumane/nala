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
├── turbo.json            # pipeline de tasks (build, dev, lint, format, typecheck)
├── tsconfig.json         # estende @nala/typescript-config
├── web/                  # aplicação Next.js (package: "web")
└── packages/
    ├── ui/               # @nala/ui — componentes shadcn/ui partilhados
    ├── eslint-config/    # @nala/eslint-config
    └── typescript-config/# @nala/typescript-config
```

### 1.2 Convenções de workspaces

- Pacotes internos são referenciados pelo nome com o protocolo `workspace:*` (ex.: `"@nala/ui": "workspace:*"`). **Nunca** usar caminhos relativos entre pacotes.
- A aplicação vive em `web/` (na raiz); todo o código partilhado vive em `packages/*`.
- Ao criar um novo pacote partilhado, coloca-o em `packages/<nome>` com `name` no formato `@nala/<nome>` — o workspace deteta-o automaticamente (glob `packages/*`).
- Importar código partilhado sempre pelo nome do pacote (ex.: `import { Button } from "@nala/ui/components/button"`), nunca por caminho relativo.

### 1.3 Comandos (correr sempre a partir da raiz)

- `bun install` — instala/religa todo o workspace.
- `bun run dev` — arranca a app em modo dev (turbo).
- `bun run build` — build de produção de todos os pacotes.
- `bun run lint` / `bun run format` / `bun run typecheck` — via turbo, em todos os pacotes.

### 1.4 Componentes shadcn/ui

Os componentes shadcn são **código-fonte** que vive no pacote `@nala/ui` (`packages/ui/src/components`), não uma dependência externa. A versão do CLI está fixada em `shadcn@4.13.1` (ver `packages/ui/package.json`) — usa-a explicitamente para manter consistência.

- **Adicionar um componente:** `bun x shadcn@4.13.1 add <componente> -c packages/ui`
- **Adicionar todos:** `bun x shadcn@4.13.1 add --all --yes -c packages/ui`
- **Sobrescrever existentes:** juntar a flag `--overwrite` (`-o`).
- O alvo é **sempre** `packages/ui` (via `-c packages/ui` ou correndo dentro dessa pasta) — nunca a app `web`.
- Após adicionar, corre `bun install` (deps novas) e `bun run typecheck`.
- Depois de instalar, importa na app por `@nala/ui/components/<componente>`.
- **Tooltip:** requer envolver a app com `<TooltipProvider>` em `web/app/layout.tsx`.

<!-- BEGIN:nextjs-agent-rules -->
### 1.5 Esta NÃO é a Next.js que conheces

Esta versão tem breaking changes — APIs, convenções e estrutura de ficheiros podem diferir do teu conhecimento de treino. Lê o guia relevante em `web/node_modules/next/dist/docs/` antes de escrever código. Presta atenção a avisos de deprecação.
<!-- END:nextjs-agent-rules -->
