import { BadgeCheck, Briefcase, MapPin } from "lucide-react";
import { type ReactNode } from "react";
import { OperationsBadge } from "../../ui/OperationsBadge";
import { EmployerLogo } from "../../ui/EmployerLogo";
import type {
  OperationsJobListItem,
  OperationsJobStatusAction,
} from "../../../types/operations-jobs";
import { cn } from "../../../utils/cn";
import { JobsMobileJobCard } from "./JobsMobileJobCard";
import { JobsRowActions } from "./JobsRowActions";

interface JobsTableSectionProps {
  jobs: OperationsJobListItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  pendingStatusJobId?: string | null;
  onStatusAction?: (
    job: OperationsJobListItem,
    action: OperationsJobStatusAction,
  ) => void;
}

function formatJobType(jobType: string): string {
  if (!jobType) return "—";
  return jobType
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatPostedDate(iso: string | null): { date: string; time: string } {
  if (!iso) {
    return { date: "—", time: "" };
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { date: "—", time: "" };
  }

  return {
    date: new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date),
  };
}

function formatValidUntil(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `Valid till ${new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)}`;
}

function statusBadgeVariant(
  status: OperationsJobListItem["status"],
): "default" | "high" | "medium" | "low" | "job" {
  switch (status) {
    case "active":
      return "default";
    case "expired":
    case "closed":
      return "high";
    case "paused":
      return "medium";
    case "draft":
      return "low";
    default:
      return "job";
  }
}

function paymentBadgeClass(
  status: OperationsJobListItem["listingPaymentStatus"],
): string {
  switch (status) {
    case "paid":
      return "bg-success/10 text-success dark:bg-success/90 dark:text-[#022c22]";
    case "pending":
      return "bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning";
    case "unpaid":
      return "bg-danger/10 text-danger dark:bg-danger/20 dark:text-danger";
    default:
      return "bg-border-subtle text-muted dark:bg-border/60 dark:text-muted";
  }
}

function TableMessage({
  children,
  colSpan = 10,
}: {
  children: ReactNode;
  colSpan?: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14 text-center">
        {children}
      </td>
    </tr>
  );
}

const thClassName =
  "whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted first:pl-4 last:pr-4 sm:px-3.5";

const tdClassName = "px-3 py-3 align-middle first:pl-4 last:pr-4 sm:px-3.5";

export function JobsTableSection({
  jobs,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  pendingStatusJobId,
  onStatusAction,
}: JobsTableSectionProps) {
  const emptyState = (
    <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-center">
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-hero-bg text-muted">
        <Briefcase className="size-4" aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-foreground">No jobs found</p>
      <p className="text-[11px] text-muted">
        Try adjusting filters or switching tabs.
      </p>
    </div>
  );

  const loadingState = (
    <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-center">
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary-light text-primary">
        <Briefcase className="size-4" aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-foreground">Loading jobs…</p>
      <p className="text-[11px] text-muted">Fetching the latest listings</p>
    </div>
  );

  const errorState = (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-center">
      <p className="text-sm font-medium text-danger">
        {errorMessage || "Failed to load jobs."}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex h-9 items-center rounded-lg bg-primary-light px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Retry
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="min-w-0 max-w-full">
      {/* Mobile card list (< sm) */}
      <div className="sm:hidden">
        {isLoading ? <div className="px-3 py-12">{loadingState}</div> : null}
        {!isLoading && isError ? <div className="px-3 py-12">{errorState}</div> : null}
        {!isLoading && !isError && jobs.length === 0 ? (
          <div className="px-3 py-12">{emptyState}</div>
        ) : null}
        {!isLoading && !isError && jobs.length > 0 ? (
          <ul className="flex flex-col gap-2.5 p-2.5">
            {jobs.map((job) => (
              <li key={job.id}>
                <JobsMobileJobCard
                  job={job}
                  pendingStatusJobId={pendingStatusJobId}
                  onStatusAction={onStatusAction}
                  formatJobType={formatJobType}
                  formatPostedDate={formatPostedDate}
                  statusBadgeVariant={statusBadgeVariant}
                  paymentBadgeClass={paymentBadgeClass}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* Tablet list (sm – lg) */}
      <div className="hidden sm:block lg:hidden">
        {isLoading ? <div className="px-4 py-12">{loadingState}</div> : null}
        {!isLoading && isError ? <div className="px-4 py-12">{errorState}</div> : null}
        {!isLoading && !isError && jobs.length === 0 ? (
          <div className="px-4 py-12">{emptyState}</div>
        ) : null}
        {!isLoading && !isError && jobs.length > 0 ? (
          <ul className="divide-y divide-border-subtle">
            {jobs.map((job) => {
              const posted = formatPostedDate(job.publishedAt ?? job.createdAt);
              const showVerified =
                job.employer.isWhatsappVerified ||
                job.employer.registrationCompleted;

              return (
                <li key={job.id} className="px-3 py-3 sm:px-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[10px] font-medium text-muted">
                        {job.jobId}
                      </p>
                      <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {job.jobTitle}
                        </p>
                        {job.isFeatured ? (
                          <OperationsBadge
                            variant="default"
                            className="shrink-0 px-1.5 py-0 text-[9px]"
                          >
                            Featured
                          </OperationsBadge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-muted">
                        {formatJobType(job.jobType)}
                      </p>
                    </div>
                    <JobsRowActions
                      job={job}
                      pendingStatusJobId={pendingStatusJobId}
                      onStatusAction={onStatusAction}
                    />
                  </div>

                  <div className="mt-2.5 flex items-center gap-2">
                    <EmployerLogo
                      name={job.employer.companyName}
                      logoUrl={job.employer.logoUrl}
                    />
                    <span className="min-w-0 truncate text-xs font-medium text-foreground">
                      {job.employer.companyName}
                    </span>
                    {showVerified ? (
                      <BadgeCheck
                        className="size-3.5 shrink-0 text-chart-accent"
                        aria-label="Verified employer contact"
                      />
                    ) : null}
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <OperationsBadge
                      variant={statusBadgeVariant(job.status)}
                      className="px-2 py-0.5 text-[10px]"
                    >
                      {job.statusLabel}
                    </OperationsBadge>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                        paymentBadgeClass(job.listingPaymentStatus),
                      )}
                    >
                      {job.paymentStatusLabel}
                    </span>
                    <span className="truncate text-[11px] font-medium tabular-nums text-muted">
                      {job.vacancies.toLocaleString("en-IN")} vacancies
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                    <span className="inline-flex max-w-full items-center gap-1">
                      <MapPin className="size-3 shrink-0" aria-hidden="true" />
                      <span className="truncate">{job.locationLabel || "—"}</span>
                    </span>
                    <span>{posted.date}</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {job.applications.toLocaleString("en-IN")} apps
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {/* Desktop table with contained horizontal scroll */}
      <div className="hidden min-w-0 max-w-full overflow-x-auto overscroll-x-contain scrollbar-hidden lg:block">
        <table className="w-full min-w-[920px] border-collapse text-left text-xs leading-snug xl:min-w-[980px]">
          <thead>
            <tr className="ops-brand-border-glow border-y border-border-subtle bg-hero-bg/40">
              <th className={thClassName}>Job ID</th>
              <th className={thClassName}>Job Title</th>
              <th className={thClassName}>Employer</th>
              <th className={thClassName}>Vacancies</th>
              <th className={thClassName}>Location</th>
              <th className={thClassName}>Posted On</th>
              <th className={thClassName}>Applications</th>
              <th className={thClassName}>Status</th>
              <th className={thClassName}>Payment</th>
              <th className={thClassName}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableMessage>{loadingState}</TableMessage>
            ) : null}

            {!isLoading && isError ? (
              <TableMessage>{errorState}</TableMessage>
            ) : null}

            {!isLoading && !isError && jobs.length === 0 ? (
              <TableMessage>{emptyState}</TableMessage>
            ) : null}

            {!isLoading &&
              !isError &&
              jobs.map((job) => {
                const posted = formatPostedDate(job.publishedAt ?? job.createdAt);
                const showVerified =
                  job.employer.isWhatsappVerified ||
                  job.employer.registrationCompleted;

                return (
                  <tr
                    key={job.id}
                    className="border-b border-border-subtle/80 transition-colors last:border-0 hover:bg-hero-bg/35"
                  >
                    <td className={cn(tdClassName, "whitespace-nowrap")}>
                      <span className="font-mono text-[11px] font-medium tracking-tight text-muted">
                        {job.jobId}
                      </span>
                    </td>

                    <td className={cn(tdClassName, "max-w-[14rem]")}>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate font-semibold text-foreground">
                            {job.jobTitle}
                          </span>
                          {job.isFeatured ? (
                            <OperationsBadge
                              variant="default"
                              className="shrink-0 px-1.5 py-0 text-[9px]"
                            >
                              Featured
                            </OperationsBadge>
                          ) : null}
                        </div>
                        <p className="truncate text-[11px] text-muted">
                          {formatJobType(job.jobType)}
                        </p>
                      </div>
                    </td>

                    <td className={cn(tdClassName, "max-w-[12rem]")}>
                      <div className="flex items-center gap-2">
                        <EmployerLogo
                          name={job.employer.companyName}
                          logoUrl={job.employer.logoUrl}
                        />
                        <span className="min-w-0 truncate font-medium text-foreground">
                          {job.employer.companyName}
                        </span>
                        {showVerified ? (
                          <BadgeCheck
                            className="size-3.5 shrink-0 text-chart-accent"
                            aria-label="Verified employer contact"
                          />
                        ) : null}
                      </div>
                    </td>

                    <td
                      className={cn(
                        tdClassName,
                        "whitespace-nowrap font-semibold tabular-nums text-foreground",
                      )}
                    >
                      {job.vacancies.toLocaleString("en-IN")}
                    </td>

                    <td className={cn(tdClassName, "max-w-[9rem] text-muted")}>
                      <span className="inline-flex max-w-full items-center gap-1">
                        <MapPin className="size-3 shrink-0 opacity-70" aria-hidden="true" />
                        <span className="truncate">{job.locationLabel || "—"}</span>
                      </span>
                    </td>

                    <td className={cn(tdClassName, "whitespace-nowrap")}>
                      <p className="font-medium text-foreground">{posted.date}</p>
                      {posted.time ? (
                        <p className="mt-0.5 text-[11px] text-muted">{posted.time}</p>
                      ) : null}
                    </td>

                    <td className={cn(tdClassName, "whitespace-nowrap")}>
                      <p className="font-semibold tabular-nums text-foreground">
                        {job.applications.toLocaleString("en-IN")}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-[11px] tabular-nums",
                          job.applicationsToday > 0 ? "text-success" : "text-muted",
                        )}
                      >
                        {job.applicationsToday > 0
                          ? `+${job.applicationsToday} today`
                          : "No new today"}
                      </p>
                    </td>

                    <td className={tdClassName}>
                      <OperationsBadge
                        variant={statusBadgeVariant(job.status)}
                        className="px-2 py-0.5 text-[10px]"
                      >
                        {job.statusLabel}
                      </OperationsBadge>
                    </td>

                    <td className={cn(tdClassName, "whitespace-nowrap")}>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                          paymentBadgeClass(job.listingPaymentStatus),
                        )}
                      >
                        {job.paymentStatusLabel}
                      </span>
                      {job.listingValidUntil ? (
                        <p className="mt-1 text-[11px] text-muted">
                          {formatValidUntil(job.listingValidUntil)}
                        </p>
                      ) : job.listingPackageLabel ? (
                        <p className="mt-1 text-[11px] text-muted">
                          {job.listingPackageLabel}
                        </p>
                      ) : null}
                    </td>

                    <td className={cn(tdClassName, "text-right")}>
                      <JobsRowActions
                      job={job}
                      pendingStatusJobId={pendingStatusJobId}
                      onStatusAction={onStatusAction}
                    />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
