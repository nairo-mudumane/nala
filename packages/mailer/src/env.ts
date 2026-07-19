/**
 * Configuration for `@nala/mailer`, read from the monorepo's single root
 * `.env` (see AGENTS.MD §1.1). Never create a per-package `.env`.
 */

/**
 * Resend API key. Optional on purpose: without it `sendEmail` logs the message
 * to the console instead of sending, so the app runs locally with no account.
 */
export const RESEND_API_KEY = process.env.RESEND_API_KEY;

/** Verified sender. Resend rejects domains you do not own. */
export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Nala <onboarding@resend.dev>";

/** Whether mail is actually delivered, as opposed to logged. */
export const MAILER_ENABLED = Boolean(RESEND_API_KEY);
