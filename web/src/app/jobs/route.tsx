import { UserButton } from "@clerk/tanstack-react-start";
import { Button } from "@nala/ui/components/button";
import { createFileRoute, Outlet } from "@tanstack/react-router";

import { ChatAside } from "@/components/chat-aside";
import { JobsAside } from "@/components/jobs-aside";
import { requireUser } from "@/lib/core";

export const Route = createFileRoute("/jobs")({
  // `?job=<id>` selects the application shown by `main` and highlighted in the
  // left aside. Declared on the layout so every child route inherits it, and
  // typed optional so linking to `/jobs` does not have to name it.
  validateSearch: (search: Record<string, unknown>): { job?: string } => ({
    job: typeof search.job === "string" ? search.job : undefined,
  }),
  // Runs before any child loader, on the server during SSR and over RPC on
  // client navigations — so the user is resolved once for the whole subtree
  // and handed down through the route context.
  beforeLoad: async () => ({ user: await requireUser() }),
  component: JobsLayout,
  errorComponent: ServiceUnavailable,
});

function JobsLayout() {
  return (
    <div className="flex h-svh w-full overflow-hidden">
      <JobsAside />

      <main className="flex min-w-lg flex-1 flex-col overflow-hidden">
        {/* h-12 matches the asides' own header, so the three columns line up. */}
        <header className="flex h-12 shrink-0 items-center justify-end gap-2 border-border border-b px-3">
          {/* Clerk's account menu — and the app's only way to sign out. */}
          <UserButton />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      <ChatAside />
    </div>
  );
}

/**
 * Shown when `beforeLoad` throws — in practice, when there is a valid session
 * but `core` could not answer for it. Deliberately *not* a redirect to
 * `/get-started`: the visitor is signed in, and bouncing them to the entry page
 * would only send them back here.
 */
function ServiceUnavailable({ reset }: { reset: () => void }) {
  return (
    <main className="flex h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Nala is not responding
      </h1>
      <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
        Your session is fine — we just could not reach the service that holds
        your applications. This is usually temporary.
      </p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
