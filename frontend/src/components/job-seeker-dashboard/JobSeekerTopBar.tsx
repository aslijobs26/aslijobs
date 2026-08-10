"use client";

import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/utils/cn";
import { Menu } from "lucide-react";
import Link from "next/link";

type JobSeekerTopBarProps = {
  onSidebarToggle: () => void;
  className?: string;
};

export function JobSeekerTopBar({
  onSidebarToggle,
  className,
}: JobSeekerTopBarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border-subtle bg-surface px-3 sm:h-16 sm:px-4 lg:px-5",
        className,
      )}
    >
      <button
        type="button"
        onClick={onSidebarToggle}
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-nav transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label="Toggle sidebar"
      >
        <Menu className="size-5" strokeWidth={2} aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground sm:text-base">
          AsliJobs
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Link
          href={ROUTES.FIND_JOBS}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-10 sm:px-4 sm:text-sm"
        >
          Browse Jobs
        </Link>
        <NotificationBell viewAllHref={ROUTES.JOB_SEEKER_NOTIFICATIONS} />
      </div>
    </header>
  );
}
