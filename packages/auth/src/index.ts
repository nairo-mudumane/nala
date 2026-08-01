/**
 * Public API of `@nala/auth` — Clerk integration for the monorepo.
 *
 * **Server only.** Identity lives at Clerk; this package is the thin layer that
 * lets `core` verify a Clerk session token and keep the local `user` mirror in
 * `@nala/db` up to date. It reads `CLERK_SECRET_KEY`, so it must never be
 * imported from `web` — the browser side uses `@clerk/tanstack-react-start`
 * directly.
 *
 * - `@nala/auth`          → Clerk client, request authentication, user sync.
 * - `@nala/auth/webhooks` → webhook verification + `user.*` handling.
 * - `@nala/auth/env`      → `TRUSTED_ORIGINS` and the validated env vars.
 *
 * Always import by package name, never by relative path.
 */
export {
  authenticateRequest,
  clerk,
  getOrSyncUser,
  type AuthState,
} from "./server";
export {
  syncUserFromWebhook,
  verifyClerkWebhook,
  type WebhookEvent,
} from "./webhooks";
export { TRUSTED_ORIGINS } from "./env";
