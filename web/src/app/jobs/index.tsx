import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/jobs/")({
  head: () => ({ meta: [{ title: "Applications — Nala" }] }),
  component: JobsPage,
});

function JobsPage() {
  // Resolved by `/jobs`'s `beforeLoad`, so this route never re-checks it.
  const { user } = Route.useRouteContext();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Signed in as {user.email}
      </h1>
      <p className="text-muted-foreground text-sm">
        Application management lands here.
      </p>
    </div>
  );
}
