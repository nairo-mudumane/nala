/**
 * Applies pending migrations using Bun's native migrator.
 * It does not depend on `pg` — it runs with the same driver as the runtime
 * (`bun-sql`), which keeps production deploys lean.
 *
 * Run with: `bun run db:migrate` (from packages/db).
 */
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { db } from "./client";

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("[@nala/db] Migrations applied successfully.");
process.exit(0);
