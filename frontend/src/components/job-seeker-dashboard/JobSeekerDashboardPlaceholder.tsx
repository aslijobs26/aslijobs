"use client";

import { ROUTES } from "@/constants/routes";
import Link from "next/link";
import type { ReactNode } from "react";

type JobSeekerDashboardPlaceholderProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  children?: ReactNode;
};

export function JobSeekerDashboardPlaceholder({
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: JobSeekerDashboardPlaceholderProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-border-subtle bg-surface px-6 py-12 text-center sm:px-10">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          {description}
        </p>
        {children}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actionHref && actionLabel ? (
            <Link
              href={actionHref}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {actionLabel}
            </Link>
          ) : null}
          <Link
            href={ROUTES.JOB_SEEKER_DASHBOARD}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border-subtle bg-surface px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
