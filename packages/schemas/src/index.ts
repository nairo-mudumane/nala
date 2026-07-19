/**
 * Public API of `@nala/schemas` — Zod schemas shared between `web` and `core`.
 *
 * - `@nala/schemas`      → every schema (barrel).
 * - `@nala/schemas/auth` → auth input schemas only.
 *
 * Runtime-agnostic by design: no DB, no Bun, no React imports, so both the
 * Next.js app and the Hono backend can depend on it. Keep it that way — a
 * server-only import here would break the `web` build.
 *
 * Route-specific schemas that nothing else consumes stay in `core/src/schemas.ts`
 * (see AGENTS.MD §1.3.3); this package is for definitions crossing the app
 * boundary.
 */
export * from "./auth";
