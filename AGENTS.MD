# Nala - Gestão Estratégica de Candidaturas

O **Nala** é uma plataforma de gestão estratégica de candidaturas profissionais, desenhada para centralizar, organizar e otimizar o processo de procura de emprego, eliminando o esforço manual e garantindo controle total sobre cada interação profissional.

## 1. Proposta de Valor

- **Gestão de Contexto:** Acesso imediato a todos os detalhes de cada candidatura (Job Description e versão do CV enviado), facilitando a preparação para entrevistas.
- **Alinhamento Estratégico:** Aumento das taxas de sucesso através da adaptação inteligente do currículo para cada vaga específica.
- **Interoperabilidade:** Geração de documentos estruturados semanticamente, garantindo máxima legibilidade por sistemas automáticos de triagem (ATS) e facilidade de edição posterior em editores de texto.

## 2. Funcionalidades Principais (MVP 1)

### 2.1 Gestão de Candidaturas

- Criação de registro dedicado para cada vaga de interesse.
- Armazenamento centralizado da descrição da vaga (Job Description).
- Histórico consolidado de comunicações e notas sobre cada processo seletivo.

### 2.2 Otimização e Geração de Documentos

- Análise crítica da vaga para extração de requisitos e palavras-chave.
- Geração de currículos otimizados, priorizando a relevância para a vaga mantendo a integridade profissional.
- Criação automática de cartas de apresentação personalizadas.
- Exportação de documentos em formatos que preservam a hierarquia lógica, garantindo compatibilidade universal.

### 2.3 Central de Preparação

- Interface de consulta rápida ("Chat") vinculada a cada candidatura.
- Recuperação instantânea do histórico do processo para suporte pré-entrevista.
- Comparação direta entre o perfil enviado e os requisitos da vaga.

## 3. Padrões de Qualidade e Saída

- **Compatibilidade ATS:** Documentos otimizados para leitura por qualquer IA de triagem, sem erros de estrutura.
- **Editabilidade:** Layout limpo e hierárquico, permitindo conversão direta para formatos de edição (.docx) sem perda de formatação ou uso de elementos complexos (caixas de texto/tabelas flutuantes).

## 4. Arquitetura do Repositório

O projeto é um **monorepo gerido com [Bun workspaces](https://bun.com/docs/install/workspaces) + [Turborepo](https://turborepo.dev)**.

### 4.1 Estrutura

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

### 4.2 Convenções de workspaces

- Pacotes internos são referenciados pelo nome com o protocolo `workspace:*` (ex.: `"@nala/ui": "workspace:*"`). **Nunca** usar caminhos relativos entre pacotes.
- A aplicação vive em `web/` (na raiz); todo o código partilhado vive em `packages/*`.
- Ao criar um novo pacote partilhado, coloca-o em `packages/<nome>` com `name` no formato `@nala/<nome>` — o workspace deteta-o automaticamente (glob `packages/*`).
- Importar código partilhado sempre pelo nome do pacote (ex.: `import { Button } from "@nala/ui/components/button"`), nunca por caminho relativo.

### 4.3 Comandos (correr sempre a partir da raiz)

- `bun install` — instala/religa todo o workspace.
- `bun run dev` — arranca a app em modo dev (turbo).
- `bun run build` — build de produção de todos os pacotes.
- `bun run lint` / `bun run format` / `bun run typecheck` — via turbo, em todos os pacotes.

### 4.4 Componentes shadcn/ui

Os componentes shadcn são **código-fonte** que vive no pacote `@nala/ui` (`packages/ui/src/components`), não uma dependência externa. A versão do CLI está fixada em `shadcn@4.13.1` (ver `packages/ui/package.json`) — usa-a explicitamente para manter consistência.

- **Adicionar um componente:** `bun x shadcn@4.13.1 add <componente> -c packages/ui`
- **Adicionar todos:** `bun x shadcn@4.13.1 add --all --yes -c packages/ui`
- **Sobrescrever existentes:** juntar a flag `--overwrite` (`-o`).
- O alvo é **sempre** `packages/ui` (via `-c packages/ui` ou correndo dentro dessa pasta) — nunca a app `web`.
- Após adicionar, corre `bun install` (deps novas) e `bun run typecheck`.
- Depois de instalar, importa na app por `@nala/ui/components/<componente>`.
- **Tooltip:** requer envolver a app com `<TooltipProvider>` em `web/app/layout.tsx`.

<!-- BEGIN:nextjs-agent-rules -->
### 4.5 Esta NÃO é a Next.js que conheces

Esta versão tem breaking changes — APIs, convenções e estrutura de ficheiros podem diferir do teu conhecimento de treino. Lê o guia relevante em `web/node_modules/next/dist/docs/` antes de escrever código. Presta atenção a avisos de deprecação.
<!-- END:nextjs-agent-rules -->

