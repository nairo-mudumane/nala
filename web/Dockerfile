# syntax=docker/dockerfile:1
# IMPORTANTE: o contexto de build tem de ser a RAIZ do monorepo.
#   docker build -f web/Dockerfile --build-arg NEXT_PUBLIC_AUTH_URL=... -t nala-web .

# Node corre o `next build` e o servidor standalone; o binário do Bun entra
# só para resolver o workspace e o bun.lock no install.
FROM node:22-alpine AS base
COPY --from=oven/bun:1.3.3-alpine /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app

# ------------------------------------------------------------------ deps
FROM base AS deps

COPY package.json bun.lock ./
COPY web/package.json                        web/package.json
COPY core/package.json                       core/package.json
COPY packages/auth/package.json              packages/auth/package.json
COPY packages/db/package.json                packages/db/package.json
COPY packages/mailer/package.json            packages/mailer/package.json
COPY packages/schemas/package.json           packages/schemas/package.json
COPY packages/ui/package.json                packages/ui/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json

# NÃO usar --production: o `next build` precisa de typescript,
# @tailwindcss/postcss e dos @types/*.
RUN bun install --frozen-lockfile --ignore-scripts

# --------------------------------------------------------------- builder
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules               ./node_modules
COPY --from=deps /app/web/node_modules           ./web/node_modules
COPY --from=deps /app/packages/ui/node_modules   ./packages/ui/node_modules
COPY --from=deps /app/packages/auth/node_modules ./packages/auth/node_modules
COPY --from=deps /app/packages/db/node_modules   ./packages/db/node_modules
COPY --from=deps /app/packages/mailer/node_modules  ./packages/mailer/node_modules
COPY --from=deps /app/packages/schemas/node_modules ./packages/schemas/node_modules

COPY package.json bun.lock tsconfig.json ./
COPY web                        ./web
COPY packages/ui                ./packages/ui
COPY packages/auth              ./packages/auth
COPY packages/db                ./packages/db
COPY packages/mailer            ./packages/mailer
COPY packages/schemas           ./packages/schemas
COPY packages/typescript-config ./packages/typescript-config

# packages/auth/src/env.ts lança no carregamento do módulo se nenhuma destas
# estiver definida — e o web faz transpilePackages de @nala/auth.
# NEXT_PUBLIC_* é ainda inlined no bundle do cliente durante o build.
ARG NEXT_PUBLIC_AUTH_URL
ARG BETTER_AUTH_URL
ENV NEXT_PUBLIC_AUTH_URL=${NEXT_PUBLIC_AUTH_URL}
ENV BETTER_AUTH_URL=${BETTER_AUTH_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN test -n "$NEXT_PUBLIC_AUTH_URL" || \
    (echo "ERRO: o build arg NEXT_PUBLIC_AUTH_URL é obrigatório" && exit 1)

WORKDIR /app/web
RUN node ./node_modules/next/dist/bin/next build

# --------------------------------------------------------------- runtime
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Obrigatório: o servidor standalone liga a localhost por omissão e ficaria
# inalcançável pelo proxy do Coolify.
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

# Com outputFileTracingRoot na raiz do monorepo o output fica aninhado:
# o entrypoint é ./web/server.js, não ./server.js.
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/standalone ./
# .next/static nunca vem incluído no standalone; sem isto todos os chunks 404.
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/static ./web/.next/static
# Sem COPY de web/public: a pasta não existe no repo e falharia o build.

USER nextjs
EXPOSE 3000

CMD ["node", "web/server.js"]
