import {
  EMPLOYER_JOBS_HOW_IT_WORKS_LABEL,
  EMPLOYER_JOBS_PAGE_SUBTITLE,
  EMPLOYER_JOBS_PAGE_TITLE,
} from "@/constants/employer-jobs";
import { ROUTES } from "@/constants/routes";
import { CirclePlay } from "lucide-react";
import Link from "next/link";

export function EmployerJobsHeader() {
  return (
    <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-[1.5rem] font-bold tracking-tight text-foreground sm:text-[1.625rem]">
          {EMPLOYER_JOBS_PAGE_TITLE}
        </h1>
        <p className="mt-0.5 max-w-xl text-sm leading-snug text-muted">
          {EMPLOYER_JOBS_PAGE_SUBTITLE}
        </p>
      </div>

      <Link
        href={ROUTES.EMPLOYER_HELP_CENTER}
        className="inline-flex shrink-0 items-center gap-1.5 pt-0.5 text-sm font-semibold text-primary-soft transition-colors hover:text-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <CirclePlay className="size-4" aria-hidden="true" strokeWidth={2} />
        {EMPLOYER_JOBS_HOW_IT_WORKS_LABEL}
      </Link>
    </header>
  );
}
