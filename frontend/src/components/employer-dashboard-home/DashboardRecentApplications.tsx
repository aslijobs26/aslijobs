"use client";

import { EMPLOYER_APPLICATION_STATUS_LABELS } from "@/types/employer-applications";
import type { EmployerApplicationListItem } from "@/types/employer-applications";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/utils/cn";
import { formatEmployerDashboardRelativeTime } from "@/utils/employer-dashboard-home";
import Link from "next/link";

type DashboardRecentApplicationsProps = {
  applications: EmployerApplicationListItem[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "AJ";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

const STATUS_PILL_CLASS: Record<string, string> = {
  submitted: "bg-primary-light text-primary",
  viewed: "bg-sky-50 text-sky-700",
  under_review: "bg-sky-50 text-sky-700",
  shortlisted: "bg-amber-50 text-amber-700",
  interview_scheduled: "bg-violet-50 text-violet-700",
  interview_completed: "bg-violet-50 text-violet-700",
  offer_sent: "bg-emerald-50 text-emerald-700",
  selected: "bg-emerald-50 text-emerald-700",
  joined: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
  withdrawn: "bg-slate-100 text-slate-600",
};

export function DashboardRecentApplications({
  applications,
  isLoading = false,
  isError = false,
  onRetry,
}: DashboardRecentApplicationsProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3.5 sm:px-5">
        <h2 className="text-base font-bold text-foreground">
          Recent Applications
        </h2>
        <Link
          href={ROUTES.EMPLOYER_CANDIDATES}
          className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          View All
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-4 sm:p-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-lg bg-hero-bg"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="px-4 py-10 text-center sm:px-5">
          <p className="text-sm font-semibold text-foreground">
            Unable to load applications
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg border border-border-subtle px-4 text-sm font-semibold text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !isError && applications.length === 0 ? (
        <div className="px-4 py-10 text-center sm:px-5">
          <p className="text-sm font-semibold text-foreground">
            No applications yet
          </p>
          <p className="mt-1 text-xs text-muted">
            New candidates will appear here as they apply.
          </p>
        </div>
      ) : null}

      {!isLoading && !isError && applications.length > 0 ? (
        <ul className="divide-y divide-border-subtle">
          {applications.map((application) => (
            <li key={application.id}>
              <Link
                href={`${ROUTES.EMPLOYER_CANDIDATES}/${application.id}`}
                className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-hero-bg/50 focus-visible:bg-hero-bg/50 focus-visible:outline-none sm:px-5"
              >
                <span
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary"
                  aria-hidden="true"
                >
                  {getInitials(application.candidateName)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {application.candidateName}
                    </p>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold",
                        STATUS_PILL_CLASS[application.status] ??
                          "bg-slate-100 text-slate-600",
                      )}
                    >
                      {EMPLOYER_APPLICATION_STATUS_LABELS[application.status] ??
                        application.status}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {application.jobTitle}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {[
                      application.candidateExperienceLabel,
                      application.candidateLocation,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Details unavailable"}
                    {" · "}
                    {formatEmployerDashboardRelativeTime(application.appliedAt)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
