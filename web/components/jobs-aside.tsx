"use client";

import { cn } from "@nala/ui/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AsideContainer } from "@/components/aside-container";
import { useJobsAside } from "@/hooks/use-aside";

export type JobListItem = {
  id: string;
  title: string;
  company: string;
};

/**
 * Left aside: the job list. Renders nothing at all when there is no job to
 * list, so the layout collapses to `main` + chat.
 */
export function JobsAside() {
  const searchParams = useSearchParams();
  const selected = searchParams.get("job");
  const isAsideOpen = useJobsAside((state) => state.isOpen);
  const setIsAsideOpen = useJobsAside((state) => state.setIsOpen);

  const jobs: JobListItem[] = [
    { id: "1", title: "Software Engineer", company: "Acme Corp" },
    { id: "2", title: "Product Manager", company: "Beta Inc" },
    { id: "3", title: "UX Designer", company: "Gamma LLC" },
  ];

  if (jobs.length === 0) return null;

  return (
    <AsideContainer
      closable
      side="left"
      title="Jobs"
      isOpen={isAsideOpen}
      onIsOpenChange={setIsAsideOpen}
    >
      <nav className="flex flex-col gap-1 p-2">
        {jobs.map((job) => {
          const params = new URLSearchParams(searchParams);
          params.set("job", job.id);

          return (
            <Link
              key={job.id}
              href={`?${params.toString()}`}
              aria-current={selected === job.id ? "page" : undefined}
              className={cn(
                "flex flex-col gap-0.5 rounded-md px-3 py-2 text-sm transition-colors",
                selected === job.id
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50",
              )}
            >
              <span className="truncate font-medium">{job.title}</span>
              <span className="truncate text-muted-foreground text-xs">
                {job.company}
              </span>
            </Link>
          );
        })}
      </nav>
    </AsideContainer>
  );
}
