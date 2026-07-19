/**
 * API pública do pacote `@nala/db`.
 *
 * - `db`      — cliente Drizzle já ligado ao PostgreSQL.
 * - schema    — tabelas, enums e tipos inferidos (`Application`, ...).
 * - operadores Drizzle (`eq`, `and`, `sql`, ...) reexportados por conveniência.
 *
 * Importar sempre pelo nome do pacote: `import { db, applications, eq } from "@nala/db"`.
 */
export { db, type Database } from "./client.js";
export * from "./schema/index.js";
export * from "drizzle-orm";
