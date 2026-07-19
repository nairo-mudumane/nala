/**
 * Public API of the `@nala/db` package.
 *
 * - `db`     — Drizzle client already connected to PostgreSQL.
 * - schema   — tables, enums, and inferred types (`User`, `Session`, ...).
 * - Drizzle operators (`eq`, `and`, `sql`, ...) re-exported for convenience.
 *
 * Always import by package name: `import { db, user, eq } from "@nala/db"`.
 */
export { db, type Database } from "./client";
export * from "./schema/index";
export * from "drizzle-orm";
