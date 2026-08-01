# syntax=docker/dockerfile:1
# IMPORTANTE: o contexto de build tem de ser a RAIZ do monorepo.
#   docker build -f core/Dockerfile -t nala-core .

FROM oven/bun:1.3.3-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# ------------------------------------------------------------------ deps
# Só os manifests primeiro, para a camada de install ficar em cache.
FROM base AS deps

COPY package.json bun.lock ./
# --frozen-lockfile valida o grafo completo do workspace: todos os manifests
# têm de estar presentes, mesmo os que o core não usa.
COPY core/package.json                       core/package.json
COPY web/package.json                        web/package.json
COPY packages/auth/package.json              packages/auth/package.json
COPY packages/db/package.json                packages/db/package.json
COPY packages/schemas/package.json           packages/schemas/package.json
COPY packages/ui/package.json                packages/ui/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json

# --ignore-scripts salta o postinstall (symlink do .env), inútil no container.
# --filter deixa de fora a árvore de dependências do web (~850MB); --production
# corta as devDependencies. O core não precisa de build step nem de tsc.
RUN bun install --frozen-lockfile --ignore-scripts --production \
    --filter=core --filter='@nala/db' --filter='@nala/auth' \
    --filter='@nala/schemas'

# --------------------------------------------------------------- runtime
FROM base AS runtime
WORKDIR /app

# O healthcheck do Coolify corre `curl` (com fallback para `wget`) DENTRO do
# container, e a imagem do Bun não traz nenhum dos dois de forma utilizável.
# Sem isto o Coolify dá o container como saudável com um exit code 0 vindo de
# "curl: not found" — pior do que não ter healthcheck, porque mente.
# Antes dos COPY, para a camada não ser invalidada a cada mudança de código.
RUN apk add --no-cache curl

COPY --from=deps /app/node_modules                  ./node_modules
COPY --from=deps /app/core/node_modules             ./core/node_modules
COPY --from=deps /app/packages/auth/node_modules    ./packages/auth/node_modules
COPY --from=deps /app/packages/db/node_modules      ./packages/db/node_modules
COPY --from=deps /app/packages/schemas/node_modules ./packages/schemas/node_modules

# Sem build step: o Bun executa TypeScript diretamente.
COPY package.json bun.lock ./
COPY core             ./core
COPY packages/auth    ./packages/auth
COPY packages/db      ./packages/db
COPY packages/schemas ./packages/schemas

COPY core/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV PORT=3001
EXPOSE 3001

# 127.0.0.1 e não `localhost`: o `localhost` resolve também para ::1, e um
# cliente que tente IPv6 primeiro leva "connection refused" de um servidor que
# está perfeitamente vivo em IPv4.
# Forma shell (sem JSON) para o ${PORT} ser expandido em runtime.
# O start period cobre a aplicação das migrações feita pelo entrypoint.
HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=5 \
  CMD curl -fsS "http://127.0.0.1:${PORT:-3001}/health" || exit 1

USER bun
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
