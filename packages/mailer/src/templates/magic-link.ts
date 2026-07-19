import { button, escapeHtml, layout } from "../layout";
import { sendEmail } from "../send";

/**
 * Copy is kept in one object rather than inlined into the markup so it can be
 * lifted into translation files later without touching the logic
 * (REQUIREMENTS.MD §3).
 */
const COPY = {
  subject: "Your sign-in link for Nala",
  heading: "Sign in to Nala",
  intro: "Click the button below to sign in. The link expires in 5 minutes.",
  action: "Sign in",
  fallback: "If the button does not work, paste this into your browser:",
  ignore: "If you did not request this email, you can safely ignore it.",
} as const;

export async function sendMagicLinkEmail({
  email,
  url,
}: {
  email: string;
  url: string;
}) {
  await sendEmail({
    to: email,
    subject: COPY.subject,
    text: `${COPY.heading}\n\n${url}\n\n${COPY.ignore}`,
    html: layout({
      heading: COPY.heading,
      body: `
        <p>${COPY.intro}</p>
        ${button({ href: url, label: COPY.action })}
        <p style="color:#666;font-size:13px">
          ${COPY.fallback}<br />
          <a href="${escapeHtml(url)}">${escapeHtml(url)}</a>
        </p>
        <p style="color:#666;font-size:13px">${COPY.ignore}</p>
      `,
    }),
  });
}
