"use client";

import { EmployerProfileMenu } from "@/components/employer-dashboard/EmployerProfileMenu";
import { EmployerSearchBar } from "@/components/employer-dashboard/EmployerSearchBar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  EMPLOYER_DASHBOARD_LANGUAGE_LABEL,
  EMPLOYER_DASHBOARD_POST_JOB_LABEL,
} from "@/constants/employer-dashboard";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/utils/cn";
import { ChevronDown, Globe, Menu, Plus } from "lucide-react";
import Link from "next/link";

type EmployerNavbarProps = {
  onSidebarToggle: () => void;
  className?: string;
};

export function EmployerNavbar({
  onSidebarToggle,
  className,
}: EmployerNavbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border-subtle bg-surface px-3 sm:px-4 lg:px-5",
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

      <div className="hidden min-w-0 flex-1 justify-center md:flex">
        <EmployerSearchBar />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
        <Link
          href={ROUTES.POST_JOB}
          className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg bg-primary-soft px-2.5 text-xs font-semibold text-surface transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-10 sm:gap-1.5 sm:px-4 sm:text-sm"
          aria-label={EMPLOYER_DASHBOARD_POST_JOB_LABEL}
        >
          <Plus
            className="size-3.5 shrink-0 sm:size-4"
            strokeWidth={2.5}
            aria-hidden="true"
          />
          <span className="whitespace-nowrap sm:hidden">Post Job</span>
          <span className="hidden whitespace-nowrap sm:inline">
            {EMPLOYER_DASHBOARD_POST_JOB_LABEL}
          </span>
          <span
            className="ml-0.5 hidden h-4 w-px bg-surface/30 sm:block"
            aria-hidden="true"
          />
          <ChevronDown
            className="hidden size-3.5 shrink-0 sm:block"
            strokeWidth={2.5}
            aria-hidden="true"
          />
        </Link>

        <NotificationBell viewAllHref={ROUTES.EMPLOYER_NOTIFICATIONS} />

        <button
          type="button"
          className="hidden items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-nav transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:inline-flex"
          aria-label="Select language"
        >
          <Globe className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          <span>{EMPLOYER_DASHBOARD_LANGUAGE_LABEL}</span>
          <ChevronDown
            className="size-3.5 shrink-0 text-muted"
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>

        <EmployerProfileMenu />
      </div>
    </header>
  );
}
