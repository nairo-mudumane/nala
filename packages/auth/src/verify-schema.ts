import { getTableColumns } from "@nala/db";
import * as schema from "@nala/db/schema";
import { getAuthTables } from "better-auth/db";
import { auth } from "./server";

const expected = getAuthTables(auth.options);
const drizzleTables = schema as Record<string, unknown>;
const problems: string[] = [];

for (const [key, table] of Object.entries(expected)) {
  const actual = drizzleTables[key];

  if (!actual) {
    problems.push(`Drizzle schema missing table: "${key}".`);
    continue;
  }

  const columns = new Set(
    Object.keys(
      getTableColumns(actual as Parameters<typeof getTableColumns>[0]),
    ),
  );

  for (const field of ["id", ...Object.keys(table.fields)]) {
    if (!columns.has(field)) {
      problems.push(`Drizzle schema missing column: "${key}.${field}".`);
    }
  }
}

if (problems.length > 0) {
  console.error("[@nala/auth] Schema not aligned:");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  `[@nala/auth] Schema aligned — ${Object.keys(expected).length} tables verified.`,
);
