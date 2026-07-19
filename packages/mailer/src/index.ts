/**
 * Public API of `@nala/mailer` — transactional email for the monorepo.
 *
 * - `@nala/mailer`     → `sendEmail` transport + per-message templates.
 * - `@nala/mailer/env` → configuration flags (e.g. `MAILER_ENABLED`).
 *
 * Server only: the transport runs on Bun inside `core`. Do not import this
 * from `web` — it would leak `RESEND_API_KEY` into the client bundle.
 *
 * Adding a template: create `src/templates/<name>.ts` exporting a
 * `send<Name>Email` that builds its body with `layout()` and delegates to
 * `sendEmail`, then re-export it here.
 */
export { sendEmail, type Email } from "./send";
export { sendMagicLinkEmail } from "./templates/magic-link";
export { MAILER_ENABLED } from "./env";
