import Link from "next/link";

import { Button } from "@nala/ui/components/button";

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="text-muted-foreground text-sm">
        The sign-in form is not implemented yet.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}
