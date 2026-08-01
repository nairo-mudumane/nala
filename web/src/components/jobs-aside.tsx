import { cn } from "@nala/ui/lib/utils";
import { Link, useSearch } from "@tanstack/react-router";

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
  // Only ever mounted under `/jobs`, which is where `?job` is declared.
  const selected = useSearch({ from: "/jobs", select: (search) => search.job });
  const isAsideOpen = useJobsAside((state) => state.isOpen);
  const setIsAsideOpen = useJobsAside((state) => state.setIsOpen);

  const jobs: JobListItem[] = [];

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
        {jobs.map((job) => (
          <Link
            key={job.id}
            from="/jobs"
            to="."
            // Callback form, so any other search param survives the click.
            search={(prev) => ({ ...prev, job: job.id })}
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
        ))}
      </nav>
    </AsideContainer>
  );
}
