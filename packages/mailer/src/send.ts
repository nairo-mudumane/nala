/**
 * Transport layer.
 *
 * Talks to the Resend REST API directly via `fetch` rather than through the
 * `resend` SDK — the payload is a single JSON POST, so the dependency would not
 * earn its keep. Swapping providers means rewriting only this file.
 *
 * Server only: runs inside `core` (Bun), never in `web`.
 */
import { EMAIL_FROM, MAILER_ENABLED, RESEND_API_KEY } from "./env";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type Email = {
  to: string;
  subject: string;
  /** Rendered HTML body. */
  html: string;
  /** Plain-text fallback. Always provide one — some clients prefer it. */
  text: string;
};

export async function sendEmail({ to, subject, html, text }: Email) {
  if (!MAILER_ENABLED) {
    // Dev fallback: no provider configured, so surface the message on stdout
    // instead of silently dropping it.
    console.warn(
      `[@nala/mailer] RESEND_API_KEY not set — email to ${to} was not sent.\n` +
        `Subject: ${subject}\n${text}`,
    );
    return;
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html, text }),
  });

  if (!response.ok) throw new Error(await describeFailure(response, to));
}

/**
 * Turn a Resend rejection into something actionable.
 *
 * The 403 case is the one everyone hits first: the default sender
 * `onboarding@resend.dev` is a sandbox address that only delivers to the
 * Resend account owner. Every other recipient is rejected outright, so sign-in
 * appears silently broken for real users.
 */
async function describeFailure(response: Response, to: string) {
  const body = await response.text();
  const prefix = `[@nala/mailer] Resend rejected the email to ${to} (${response.status})`;

  if (response.status === 403 && EMAIL_FROM.includes("onboarding@resend.dev")) {
    return (
      `${prefix}: the sandbox sender "onboarding@resend.dev" can only deliver to the ` +
      "Resend account owner's own address. To email anyone else, verify a domain at " +
      "https://resend.com/domains and set EMAIL_FROM to an address on it " +
      `(e.g. EMAIL_FROM="Nala <no-reply@yourdomain.com>").\nResend said: ${body}`
    );
  }

  return `${prefix}: ${body}`;
}
