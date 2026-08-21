import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Briefcase,
  Copy,
  MapPin,
  MoreVertical,
} from "lucide-react";
import { OperationsBadge } from "../../ui/OperationsBadge";
import type { OperationsJobListItem } from "../../../types/operations-jobs";
import { cn } from "../../../utils/cn";
import { resolveMediaUrl } from "../../../utils/resolve-media-url";

interface JobsTableSectionProps {
  jobs: OperationsJobListItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

const CATEGORY_TONES = [
  "text-primary-soft",
  "text-chart-accent-alt",
  "text-warning",
  "text-chart-accent",
  "text-success",
] as const;

function categoryTone(category: string): string {
  if (!category) return "text-muted";
  let hash = 0;
  for (let index = 0; index < category.length; index += 1) {
    hash = (hash + category.charCodeAt(index) * (index + 1)) % CATEGORY_TONES.length;
  }
  return CATEGORY_TONES[hash] ?? "text-muted";
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
      return "bg-success/10 text-success";
    case "pending":
      return "bg-warning/10 text-warning";
    case "unpaid":
      return "bg-danger/10 text-danger";
    default:
      return "bg-border-subtle text-muted";
  }
}

function employerInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function EmployerLogo({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolvedUrl = resolveMediaUrl(logoUrl);

  useEffect(() => {
    setFailed(false);
  }, [logoUrl]);

  if (!resolvedUrl || failed) {
    return (
      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-light text-[10px] font-semibold text-primary ring-1 ring-border-subtle/80">
        {employerInitials(name)}
      </span>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt=""
      className="size-7 shrink-0 rounded-full object-cover ring-1 ring-border-subtle/80"
      onError={() => setFailed(true)}
    />
  );
}

function RowActions({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jobId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label={`Actions for ${jobId}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors",
          "hover:bg-hero-bg hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          open && "bg-hero-bg text-foreground",
        )}
      >
        <MoreVertical className="size-3.5" aria-hidden="true" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1.5 min-w-[9.5rem] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-[0_10px_30px_color-mix(in_srgb,var(--color-foreground)_12%,transparent)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleCopy}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-primary-light hover:text-primary"
          >
            <Copy className="size-3.5 shrink-0" aria-hidden="true" />
            {copied ? "Copied" : "Copy Job ID"}
          </button>
        </div>
      ) : null}
    </div>
  );
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
    <>
      {/* Mobile card list */}
      <div className="md:hidden">
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
                    <RowActions jobId={job.jobId} />
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
                    {job.businessCategory ? (
                      <span
                        className={cn(
                          "truncate text-[11px] font-medium",
                          categoryTone(job.businessCategory),
                        )}
                      >
                        {job.businessCategory}
                      </span>
                    ) : null}
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

      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto overscroll-x-contain scrollbar-hidden md:block">
        <table className="w-full min-w-[980px] border-collapse text-left text-xs leading-snug">
          <thead>
            <tr className="border-y border-border-subtle bg-hero-bg/40">
              <th className={thClassName}>Job ID</th>
              <th className={thClassName}>Job Title</th>
              <th className={thClassName}>Employer</th>
              <th className={thClassName}>Category</th>
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
                        "max-w-[8.5rem] truncate font-medium",
                        categoryTone(job.businessCategory),
                      )}
                    >
                      {job.businessCategory || "—"}
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
                      <RowActions jobId={job.jobId} />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </>
  );
}
