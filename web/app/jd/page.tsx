import { requireSession } from "@/lib/auth";

export const metadata = {
  title: "Applications — Nala",
};

export default async function JdPage() {
  const { user } = await requireSession();

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Signed in as {user.email}
      </h1>
      <p className="text-muted-foreground text-sm">
        Application management lands here.
      </p>
    </main>
  );
}
