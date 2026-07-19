/**
 * Aplica as migrações pendentes usando o migrator nativo de Bun.
 * Não depende de `pg` — corre com o mesmo driver do runtime (`bun-sql`),
 * o que mantém os deploys de produção leves.
 *
 * Correr com: `bun run db:migrate` (a partir de packages/db).
 */
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { db } from "./client";

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("[@nala/db] Migrações aplicadas com sucesso.");
process.exit(0);
