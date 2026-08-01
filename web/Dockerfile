# syntax=docker/dockerfile:1
# IMPORTANTE: o contexto de build tem de ser a RAIZ do monorepo.
#   docker build -f web/Dockerfile --build-arg VITE_CLERK_PUBLISHABLE_KEY=... -t nala-web .

# Bun de ponta a ponta: resolve o workspace, corre o `vite build` e serve o
# bundle do Nitro (preset `bun`). Ao contrário do standalone do Next, não é
# preciso um runtime Node em lado nenhum.
FROM oven/bun:1.3.3-alpine AS base
WORKDIR /app

# ------------------------------------------------------------------ deps
FROM base AS deps

COPY package.json bun.lock ./
COPY web/package.json                        web/package.json
COPY core/package.json                       core/package.json
COPY packages/auth/package.json              packages/auth/package.json
COPY packages/db/package.json                packages/db/package.json
COPY packages/schemas/package.json           packages/schemas/package.json
COPY packages/ui/package.json                packages/ui/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json

# NÃO usar --production: o `vite build` precisa do vite, do nitro, do
# @tailwindcss/vite e dos @types/*.
RUN bun install --frozen-lockfile --ignore-scripts

# --------------------------------------------------------------- builder
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules                  ./node_modules
COPY --from=deps /app/web/node_modules              ./web/node_modules
COPY --from=deps /app/packages/ui/node_modules      ./packages/ui/node_modules
COPY --from=deps /app/packages/schemas/node_modules ./packages/schemas/node_modules

COPY package.json bun.lock tsconfig.json ./
COPY web                        ./web
COPY packages/ui                ./packages/ui
COPY packages/schemas           ./packages/schemas
COPY packages/typescript-config ./packages/typescript-config

# Só as VITE_* são inlined no bundle do cliente durante o build — a
# CLERK_SECRET_KEY é lida em runtime e nunca entra na imagem.
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=${VITE_CLERK_PUBLISHABLE_KEY}
ENV NODE_ENV=production

RUN test -n "$VITE_CLERK_PUBLISHABLE_KEY" || \
    (echo "ERRO: o build arg VITE_CLERK_PUBLISHABLE_KEY é obrigatório" && exit 1)

WORKDIR /app/web
RUN bun run build

# --------------------------------------------------------------- runtime
FROM oven/bun:1.3.3-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Obrigatório: o servidor liga a localhost por omissão e ficaria inalcançável
# pelo proxy do Coolify.
ENV HOST=0.0.0.0

# O output do Nitro é autocontido — traz as dependências já bundled e os
# assets estáticos em .output/public. Não é preciso copiar node_modules.
COPY --from=builder --chown=bun:bun /app/web/.output ./.output

USER bun
EXPOSE 3000

CMD ["bun", ".output/server/index.mjs"]
