/**
 * Public API of `@nala/auth` (server side).
 *
 * - `@nala/auth`        → `auth` instance + types (server).
 * - `@nala/auth/client` → `authClient` for React (browser).
 *
 * Always import by package name, never by relative path.
 */
export { auth, type Auth, type AuthSession, type AuthUser } from "./server";
export { AUTH_BASE_URL, TRUSTED_ORIGINS } from "./env";
