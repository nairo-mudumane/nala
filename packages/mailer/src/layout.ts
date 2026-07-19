/**
 * Shared chrome for HTML emails.
 *
 * Inline styles only — email clients strip <style> blocks and have no CSS
 * cascade worth relying on.
 */

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escape a value before interpolating it into an HTML body. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

export function layout({
  heading,
  body,
}: {
  heading: string;
  body: string;
}): string {
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#111;max-width:480px">
      <h1 style="font-size:20px;font-weight:600;margin:0 0 16px">${escapeHtml(heading)}</h1>
      ${body}
    </div>
  `;
}

export function button({ href, label }: { href: string; label: string }) {
  return `
    <p>
      <a href="${escapeHtml(href)}"
         style="display:inline-block;padding:10px 20px;border-radius:8px;background:#111;color:#fff;text-decoration:none">
        ${escapeHtml(label)}
      </a>
    </p>
  `;
}
