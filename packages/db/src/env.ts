/**
 * Loading and validation of the database environment variables.
 *
 * Bun loads the `.env` automatically from the cwd, so it is enough to make sure
 * `DATABASE_URL` is set (see `.env.example`).
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[@nala/db] Missing environment variable: ${name}. ` +
        "Copy .env.example to .env at the monorepo root and fill in the value.",
    );
  }
  return value;
}

export const env = {
  /** PostgreSQL (18) connection string. */
  DATABASE_URL: required("DATABASE_URL"),
} as const;
