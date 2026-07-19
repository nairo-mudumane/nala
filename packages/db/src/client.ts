import { drizzle } from 'drizzle-orm/bun-sql';
import { env } from './env.js';
import * as schema from './schema/index.js';

export const db = drizzle({
  connection: env.DATABASE_URL,
  schema,
  casing: 'snake_case',
});

export type Database = typeof db;
