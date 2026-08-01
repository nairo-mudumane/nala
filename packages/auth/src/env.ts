/**
 * Loading and validation of the Clerk environment variables.
 *
 * They all live in the monorepo's **single root `.env`** (see `.env.example`);
 * `core` passes it with `--env-file`, and `web` reads it through the
 * `web/.env → ../.env` symlink created by `postinstall`.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[@nala/auth] Missing environment variable: ${name}. ` +
        "Copy .env.example to .env at the monorepo root and fill in the value " +
        "from https://dashboard.clerk.com → API keys.",
    );
  }
  return value;
}

/**
 * Origins allowed to talk to `core`.
 *
 * One list serves two purposes on purpose: it is both the CORS allow-list and
 * Clerk's `authorizedParties`, which rejects a session token minted for any
 * other frontend (the `azp` claim check that guards against CSRF).
 */
export const TRUSTED_ORIGINS = (process.env.AUTH_TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  /** Backend API key (`sk_...`). Server only — never reaches the browser. */
  get CLERK_SECRET_KEY() {
    return required("CLERK_SECRET_KEY");
  },
  /**
   * Frontend API key (`pk_...`). Public by design — `web` inlines it into the
   * client bundle, hence the `VITE_` prefix Vite requires to expose it there.
   */
  get CLERK_PUBLISHABLE_KEY() {
    return required("VITE_CLERK_PUBLISHABLE_KEY");
  },
  /** Signing secret (`whsec_...`) of the Clerk webhook endpoint. */
  get CLERK_WEBHOOK_SIGNING_SECRET() {
    return required("CLERK_WEBHOOK_SIGNING_SECRET");
  },
  TRUSTED_ORIGINS,
} as const;
