"use client";

import { ROUTES } from "@/constants/routes";
import type { SeekerApplicationListItem } from "@/types/job-seeker-applications";
import {
  formatJobSearchJobType,
  formatJobSearchWorkMode,
} from "@/utils/job-search-format";
import { cn } from "@/utils/cn";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  IdCard,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import {
  applicationStatusIcon,
  buildStatusContext,
  cardStatusLabel,
  statusBadgeClasses,
} from "./applied-jobs-utils";

type AppliedJobCardProps = {
  application: SeekerApplicationListItem;
};

function splitSalaryLabel(salaryLabel: string): {
  amount: string;
  period: string;
} {
  const trimmed = salaryLabel.trim();
  const match = trimmed.match(/^(.*?)(\/(?:month|year|day|hour))?$/i);
  if (!match) {
    return { amount: trimmed, period: "" };
  }
  return {
    amount: (match[1] ?? trimmed).trim(),
    period: match[2] ?? "",
  };
}

function CompanyLogo({
  logoUrl,
  className,
}: {
  logoUrl: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-workflow-neutral-surface ring-1 ring-border-subtle",
        className,
      )}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- employer CDN hosts vary
        <img
          src={logoUrl}
          alt=""
          className="size-full object-contain p-1.5"
        />
      ) : (
        <Building2 className="size-5 text-primary" aria-hidden="true" />
      )}
    </div>
  );
}

export function AppliedJobCard({ application }: AppliedJobCardProps) {
  const href = ROUTES.jobSeekerApplicationDetail(application.id);
  const StatusIcon = applicationStatusIcon(application.status);
  const statusLabel = cardStatusLabel(application.status);
  const statusContext = buildStatusContext(application);
  const { amount: salaryAmount, period: salaryPeriod } = splitSalaryLabel(
    application.salaryLabel,
  );

  const shiftLabel = application.shiftLabel?.trim() || "";
  const employmentType = application.jobType
    ? formatJobSearchJobType(application.jobType)
    : application.workMode
      ? formatJobSearchWorkMode(application.workMode)
      : "";

  const desktopShiftLabel =
    shiftLabel ||
    (application.jobType
      ? formatJobSearchJobType(application.jobType)
      : "") ||
    (application.workMode
      ? formatJobSearchWorkMode(application.workMode)
      : "");

  return (
    <article className="group relative">
      <Link
        href={href}
        aria-label={`${application.jobTitle} at ${application.companyName || "company"}. Status ${statusLabel}. View details.`}
        className={cn(
          "block rounded-xl border border-border-subtle bg-surface shadow-[0_1px_3px_rgba(26,43,60,0.04)] transition-colors",
          "hover:border-primary/30 hover:bg-primary-light/10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        )}
      >
        {/* —— Mobile card (< md) —— */}
        <div className="relative p-4 pr-9 md:hidden">
          {/* Top: logo | text lines | status — equal top alignment */}
          <div className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-start gap-x-3">
            <CompanyLogo
              logoUrl={application.companyLogoUrl}
              className="size-12"
            />

            <div className="min-w-0 space-y-1">
              <h2 className="truncate text-[15px] font-bold leading-5 text-foreground">
                {application.jobTitle}
              </h2>
              <p className="flex min-w-0 items-center gap-1.5 text-xs leading-4 text-muted">
                <span className="truncate">
                  {application.companyName || "Company"}
                </span>
                <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-resource-guide-icon">
                  <CheckCircle2
                    className="size-3 shrink-0 fill-resource-guide-icon text-surface"
                    aria-hidden="true"
                  />
                  Verified
                </span>
              </p>
              <p className="flex min-w-0 items-center gap-1 text-[11px] leading-4 text-muted">
                <IdCard className="size-3 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  Job ID: {application.publicJobId}
                </span>
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
              <span
                className={statusBadgeClasses(
                  application.status,
                  "gap-1 px-2 py-0.5 text-[10px]",
                )}
              >
                <StatusIcon className="size-3 shrink-0" aria-hidden="true" />
                {statusLabel}
              </span>
              <p className="text-right text-[11px] leading-4 text-muted">
                <span className="block whitespace-nowrap">
                  {statusContext.label}
                </span>
                <span className="mt-0.5 block whitespace-nowrap font-medium text-foreground">
                  {statusContext.date}
                </span>
              </p>
            </div>
          </div>

          <div
            className="mt-3 border-t border-border-subtle"
            aria-hidden="true"
          />

          {/* Bottom: same left edge as title column (logo 3rem + gap 0.75rem) */}
          <div className="mt-3 space-y-1.5 pl-[3.75rem]">
            <p className="flex min-w-0 items-baseline gap-x-1 leading-5">
              <span className="truncate text-sm font-bold text-foreground">
                {salaryAmount}
              </span>
              {salaryPeriod ? (
                <span className="text-[11px] font-medium text-muted">
                  {salaryPeriod}
                </span>
              ) : null}
            </p>

            {application.location || shiftLabel ? (
              <p className="flex min-w-0 items-center gap-2 text-xs leading-4 text-muted">
                {application.location ? (
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <MapPin className="size-3 shrink-0" aria-hidden="true" />
                    <span className="truncate">{application.location}</span>
                  </span>
                ) : null}
                {application.location && shiftLabel ? (
                  <span
                    className="h-3 w-px shrink-0 bg-border"
                    aria-hidden="true"
                  />
                ) : null}
                {shiftLabel ? (
                  <span className="inline-flex shrink-0 items-center gap-1">
                    <Clock3 className="size-3 shrink-0" aria-hidden="true" />
                    <span>{shiftLabel}</span>
                  </span>
                ) : null}
              </p>
            ) : null}

            {employmentType ? (
              <p className="flex items-center gap-1 text-xs leading-4 text-muted">
                <Briefcase className="size-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{employmentType}</span>
              </p>
            ) : null}
          </div>

          <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-muted">
            <ChevronRight className="size-5" aria-hidden="true" />
          </span>
        </div>

        {/* —— Desktop / tablet card (md+) — unchanged —— */}
        <div
          className={cn(
            "hidden p-4 sm:p-5",
            "md:grid md:grid-cols-[3.5rem_minmax(0,1.35fr)_minmax(10.5rem,12.5rem)_minmax(8.5rem,10rem)_1.25rem] md:items-start md:gap-x-4",
          )}
        >
          <CompanyLogo
            logoUrl={application.companyLogoUrl}
            className="size-14"
          />

          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold leading-6 text-foreground">
              {application.jobTitle}
            </h2>
            <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm leading-5 text-muted">
              <span className="truncate">
                {application.companyName || "Company"}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-resource-guide-icon">
                <CheckCircle2
                  className="size-3.5 shrink-0 fill-resource-guide-icon text-surface"
                  aria-hidden="true"
                />
                Verified
              </span>
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs leading-5 text-muted">
              <IdCard className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                Job ID: {application.publicJobId}
              </span>
            </p>
          </div>

          <div className="min-w-0 space-y-1.5">
            <p className="truncate text-sm font-semibold leading-6 text-foreground">
              {application.salaryLabel}
            </p>
            {application.location ? (
              <p className="flex items-center gap-1.5 text-xs leading-5 text-muted">
                <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{application.location}</span>
              </p>
            ) : (
              <p className="h-5" aria-hidden="true" />
            )}
            {desktopShiftLabel ? (
              <p className="flex items-center gap-1.5 text-xs leading-5 text-muted">
                <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{desktopShiftLabel}</span>
              </p>
            ) : (
              <p className="h-5" aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0 flex-col items-end gap-1.5 md:flex">
            <span className={statusBadgeClasses(application.status)}>
              <StatusIcon className="size-3.5 shrink-0" aria-hidden="true" />
              {statusLabel}
            </span>
            <p className="w-full text-right text-xs leading-5 text-muted">
              <span className="block truncate">{statusContext.label}</span>
              <span className="mt-0.5 block truncate font-medium text-foreground">
                {statusContext.date}
              </span>
            </p>
          </div>

          <div className="flex h-6 items-center justify-center">
            <ChevronRight
              className="size-5 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
              aria-hidden="true"
            />
          </div>
        </div>
      </Link>
    </article>
  );
}
