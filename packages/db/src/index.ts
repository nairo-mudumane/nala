/**
 * API pública do pacote `@nala/db`.
 *
 * - `db`      — cliente Drizzle já ligado ao PostgreSQL.
 * - schema    — tabelas, enums e tipos inferidos (`User`, `Session`, ...).
 * - operadores Drizzle (`eq`, `and`, `sql`, ...) reexportados por conveniência.
 *
 * Importar sempre pelo nome do pacote: `import { db, user, eq } from "@nala/db"`.
 */
export { db, type Database } from "./client";
export * from "./schema/index";
export * from "drizzle-orm";
