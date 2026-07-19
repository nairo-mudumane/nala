import { drizzle } from "drizzle-orm/bun-sql";
import { env } from "./env";
import * as schema from "./schema/index";

export const db = drizzle({
  connection: env.DATABASE_URL,
  schema,
  casing: "snake_case",
});

export type Database = typeof db;
