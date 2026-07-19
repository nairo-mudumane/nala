#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] A aplicar migrações..."
  # migrate.ts usa migrationsFolder "./drizzle", relativo ao cwd.
  cd /app/packages/db
  bun run src/migrate.ts
  cd /app
  echo "[entrypoint] Migrações concluídas."
fi

echo "[entrypoint] A arrancar o core na porta ${PORT:-3001}..."
exec bun run core/src/index.ts
