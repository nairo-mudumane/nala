import { ChatAside } from "@/components/chat-aside";
import { JobsAside } from "@/components/jobs-aside";
import { requireSession } from "@/lib/auth";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();

  return (
    <div className="flex h-svh w-full overflow-hidden">
      <JobsAside />

      <main className="min-w-lg flex-1 overflow-y-auto">{children}</main>

      <ChatAside />
    </div>
  );
}
