import { SignIn } from "@clerk/tanstack-react-start";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { getAuthState } from "@/lib/auth";

/**
 * Single entry point for both signing in and creating an account, as the
 * requirements ask for (§2.4).
 *
 * Clerk's form drives its own steps (`factor-one`, `sso-callback`, …). It is
 * left on hash routing — the default — so all of them live under this one
 * route instead of forcing a splat route whose `/get-started` path would not
 * be expressible in TanStack Router's typed links.
 */
export const Route = createFileRoute("/get-started")({
  head: () => ({ meta: [{ title: "Get started — Nala" }] }),
  // Cheap Clerk-only check: a visitor who already has a session has no
  // business on the entry page, and this avoids a round trip to `core`.
  beforeLoad: async () => {
    const { isAuthenticated } = await getAuthState();
    if (isAuthenticated) throw redirect({ to: "/jobs" });
  },
  component: GetStartedPage,
});

function GetStartedPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Get started with Nala
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Sign in to your account, or create a new one.
        </p>
      </div>

      {/* `withSignUp` keeps account creation on this same URL rather than
          bouncing to a second route — one entry point, two outcomes. */}
      <SignIn withSignUp />
    </main>
  );
}
