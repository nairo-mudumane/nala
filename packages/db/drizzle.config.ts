import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './drizzle',
  casing: 'snake_case',
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: validated in runtime via src/env.ts
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
