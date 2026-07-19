/**
 * API pública do `@nala/auth` (lado servidor).
 *
 * - `@nala/auth`        → instância `auth` + tipos (servidor).
 * - `@nala/auth/client` → `authClient` para React (browser).
 *
 * Importar sempre pelo nome do pacote, nunca por caminho relativo.
 */
export { auth, type Auth, type AuthSession, type AuthUser } from "./server";
export { AUTH_BASE_URL, TRUSTED_ORIGINS } from "./env";
