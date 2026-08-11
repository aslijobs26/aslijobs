"use client";

import {
  buildTelHref,
  buildWhatsAppHref,
  employerApplicationStatusClass,
  formatCandidateDate,
  getCandidateInitials,
} from "@/components/employer-candidates/candidates-ats-utils";
import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import { WhatsAppIcon } from "@/components/home/hero/HeroIcons";
import { ROUTES } from "@/constants/routes";
import { useCan } from "@/providers/employer-permission-provider";
import {
  EMPLOYER_APPLICATION_STATUS_LABELS,
  isEmployerShortlistedOrLaterStatus,
  type EmployerApplicationListItem,
  type EmployerApplicationsPagination,
} from "@/types/employer-applications";
import type { EmployerRegisterSelectOption } from "@/types/employer-register";
import { cn } from "@/utils/cn";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Phone,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

type CandidatesListPanelProps = {
  applications: EmployerApplicationListItem[];
  pagination: EmployerApplicationsPagination | undefined;
  isLoading: boolean;
  selectedId: string | null;
  sort: "newest" | "oldest" | "updated";
  jobOptions: {
    publicJobId: string;
    jobTitle: string;
    applications: number;
  }[];
  publicJobId: string | undefined;
  hasActiveSearch?: boolean;
  hasLocationFilter?: boolean;
  savedByApplicationId?: Record<string, string>;
  canSave?: boolean;
  onClearSearch?: () => void;
  onClearLocation?: () => void;
  onSortChange: (value: "newest" | "oldest" | "updated") => void;
  onJobChange: (publicJobId: string) => void;
  onSelect: (id: string) => void;
  onPageChange: (page: number) => void;
  onOpenResume: (id: string) => void;
  onToggleSave?: (applicationId: string, isSaved: boolean) => void;
};

const actionButtonClassName =
  "inline-flex min-h-11 min-w-10 flex-1 basis-0 max-w-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

const actionIconClassName = "size-3.5 shrink-0";

function CandidateMobileCard({
  item,
  isSelected,
  isSaved,
  canSave,
  onSelect,
  onOpenResume,
  onToggleSave,
}: {
  item: EmployerApplicationListItem;
  isSelected: boolean;
  isSaved: boolean;
  canSave: boolean;
  onSelect: (id: string) => void;
  onOpenResume: (id: string) => void;
  onToggleSave?: (applicationId: string, isSaved: boolean) => void;
}) {
  const { canField, getFieldLevel } = useCan();
  const canViewPhone = canField("candidates", "phone");
  const phoneLevel = getFieldLevel("candidates", "phone");
  const canViewResume = canField("candidates", "resume");
  const canViewLocation = canField("candidates", "location");
  const rawPhone = item.candidatePhone ?? "";
  const whatsappHref =
    canViewPhone && phoneLevel !== "mask" ? buildWhatsAppHref(rawPhone) : null;
  const telHref =
    canViewPhone && phoneLevel !== "mask" ? buildTelHref(rawPhone) : null;

  return (
    <article
      className={cn(
        "relative rounded-xl border border-border-subtle bg-surface p-3 shadow-sm transition-colors sm:p-4",
        isSelected && "border-primary/30 bg-primary-light/30",
      )}
    >
      {canSave && onToggleSave ? (
        <button
          type="button"
          aria-label={
            isSaved
              ? `Remove ${item.candidateName} from shortlisted candidates`
              : `Shortlist ${item.candidateName}`
          }
          aria-pressed={isSaved}
          className="absolute right-2.5 top-2.5 z-10 inline-flex size-8 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:right-3 sm:top-3 sm:size-9"
          onClick={(event) => {
            event.stopPropagation();
            onToggleSave(item.id, isSaved);
          }}
        >
          <Bookmark
            className={cn("size-3.5 sm:size-4", isSaved && "fill-current")}
            aria-hidden="true"
          />
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => onSelect(item.id)}
        className="flex w-full min-w-0 gap-2.5 pr-9 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:gap-3 sm:pr-10"
      >
        <span
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-surface sm:size-12 sm:text-sm"
          aria-hidden="true"
        >
          {getCandidateInitials(item.candidateName)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="truncate text-sm font-bold text-foreground sm:text-base">
              {item.candidateName}
            </span>
            <span
              className={cn(
                "inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset sm:px-2 sm:text-[11px]",
                employerApplicationStatusClass(item.status),
              )}
            >
              {EMPLOYER_APPLICATION_STATUS_LABELS[item.status]}
            </span>
          </span>
          <span className="mt-1 block truncate text-xs text-foreground sm:text-sm">
            <span className="text-muted">Applied for </span>
            <span className="font-semibold">{item.jobTitle}</span>
          </span>
          <span className="mt-1.5 grid gap-0.5 text-[10px] leading-4 text-muted sm:mt-2 sm:gap-1 sm:text-[11px]">
            {item.candidateExperienceLabel ? (
              <span className="truncate">
                Experience: {item.candidateExperienceLabel}
              </span>
            ) : null}
            {canViewLocation && item.candidateLocation ? (
              <span className="truncate">Location: {item.candidateLocation}</span>
            ) : null}
            {item.candidateAvailability ? (
              <span className="truncate">
                Availability: {item.candidateAvailability}
              </span>
            ) : null}
            <span className="truncate">
              Applied: {formatCandidateDate(item.appliedAt)}
            </span>
          </span>
        </span>
      </button>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-1 border-t border-border-subtle pt-3">
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp ${item.candidateName}`}
            className={actionButtonClassName}
            onClick={(event) => event.stopPropagation()}
          >
            <WhatsAppIcon className="text-sm leading-none" />
            <span className="text-[10px] font-semibold leading-none">WhatsApp</span>
          </a>
        ) : null}
        {telHref ? (
          <a
            href={telHref}
            aria-label={`Call ${item.candidateName}`}
            className={actionButtonClassName}
            onClick={(event) => event.stopPropagation()}
          >
            <Phone className={actionIconClassName} aria-hidden="true" />
            <span className="text-[10px] font-semibold leading-none">Call</span>
          </a>
        ) : null}
        {canViewResume ? (
        <button
          type="button"
          aria-label="View resume"
          className={actionButtonClassName}
          onClick={(event) => {
            event.stopPropagation();
            onOpenResume(item.id);
          }}
        >
          <FileText className={actionIconClassName} aria-hidden="true" />
          <span className="text-[10px] font-semibold leading-none">Resume</span>
        </button>
        ) : null}
        <button
          type="button"
          aria-label="Open status and details"
          className={actionButtonClassName}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(item.id);
          }}
        >
          <UserRound className={actionIconClassName} aria-hidden="true" />
          <span className="text-[10px] font-semibold leading-none">Status</span>
        </button>
        <Link
          href={ROUTES.employerCandidateDetail(item.id)}
          aria-label="Open full profile"
          className={cn(actionButtonClassName, "text-muted hover:text-primary")}
          onClick={(event) => event.stopPropagation()}
        >
          <ExternalLink className={actionIconClassName} aria-hidden="true" />
          <span className="text-[10px] font-semibold leading-none">Profile</span>
        </Link>
      </div>
    </article>
  );
}

function CandidateDesktopRow({
  item,
  isSaved,
  canSave,
  onSelect,
  onOpenResume,
  onToggleSave,
}: {
  item: EmployerApplicationListItem;
  isSaved: boolean;
  canSave: boolean;
  onSelect: (id: string) => void;
  onOpenResume: (id: string) => void;
  onToggleSave?: (applicationId: string, isSaved: boolean) => void;
}) {
  const { canField, getFieldLevel } = useCan();
  const canViewPhone = canField("candidates", "phone");
  const phoneLevel = getFieldLevel("candidates", "phone");
  const canViewResume = canField("candidates", "resume");
  const canViewLocation = canField("candidates", "location");
  const rawPhone = item.candidatePhone ?? "";
  const whatsappHref =
    canViewPhone && phoneLevel !== "mask" ? buildWhatsAppHref(rawPhone) : null;
  const telHref =
    canViewPhone && phoneLevel !== "mask" ? buildTelHref(rawPhone) : null;

  return (
    <div className="flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
      <button
        type="button"
        onClick={() => onSelect(item.id)}
        className="flex min-w-0 flex-1 gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <span
          className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-surface"
          aria-hidden="true"
        >
          {getCandidateInitials(item.candidateName)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-bold text-foreground">
              {item.candidateName}
            </span>
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                employerApplicationStatusClass(item.status),
              )}
            >
              {EMPLOYER_APPLICATION_STATUS_LABELS[item.status]}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-foreground">
            Applied for{" "}
            <span className="font-semibold">{item.jobTitle}</span>
            <span className="text-muted">
              {" "}
              · {formatCandidateDate(item.appliedAt)}
            </span>
          </span>
          <span className="mt-1 block truncate text-xs text-muted">
            {[
              item.candidateExperienceLabel || null,
              canViewLocation ? item.candidateLocation || null : null,
            ]
              .filter(Boolean)
              .join(" | ")}
          </span>
        </span>
      </button>

      <div className="flex shrink-0 flex-col items-end justify-center gap-1 self-center sm:flex-row sm:items-center">
        {canSave && onToggleSave ? (
          <button
            type="button"
            aria-label={
              isSaved
                ? `Remove ${item.candidateName} from shortlisted candidates`
                : `Shortlist ${item.candidateName}`
            }
            aria-pressed={isSaved}
            className="inline-flex size-8 items-center justify-center rounded-lg text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            onClick={(event) => {
              event.stopPropagation();
              onToggleSave(item.id, isSaved);
            }}
          >
            <Bookmark
              className={cn("size-4", isSaved && "fill-current")}
              aria-hidden="true"
            />
          </button>
        ) : null}
        {telHref ? (
          <a
            href={telHref}
            aria-label={`Call ${item.candidateName}`}
            className="inline-flex size-8 items-center justify-center rounded-lg text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            onClick={(event) => event.stopPropagation()}
          >
            <Phone className="size-4" aria-hidden="true" />
          </a>
        ) : null}
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp ${item.candidateName}`}
            className="inline-flex size-8 items-center justify-center rounded-lg text-whatsapp hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            onClick={(event) => event.stopPropagation()}
          >
            <WhatsAppIcon className="text-base leading-none" />
          </a>
        ) : null}
        {canViewResume ? (
          <button
            type="button"
            aria-label="View resume"
            className="inline-flex size-8 items-center justify-center rounded-lg text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            onClick={(event) => {
              event.stopPropagation();
              onOpenResume(item.id);
            }}
          >
            <FileText className="size-4" aria-hidden="true" />
          </button>
        ) : null}
        <Link
          href={ROUTES.employerCandidateDetail(item.id)}
          aria-label="Open full profile"
          className="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          onClick={(event) => event.stopPropagation()}
        >
          <ExternalLink className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

export function CandidatesListPanel({
  applications,
  pagination,
  isLoading,
  selectedId,
  sort,
  jobOptions,
  publicJobId,
  hasActiveSearch = false,
  hasLocationFilter = false,
  savedByApplicationId = {},
  canSave = false,
  onClearSearch,
  onClearLocation,
  onSortChange,
  onJobChange,
  onSelect,
  onPageChange,
  onOpenResume,
  onToggleSave,
}: CandidatesListPanelProps) {
  const page = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? applications.length;
  const limit = pagination?.limit ?? 20;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const jobSelectOptions = useMemo<EmployerRegisterSelectOption[]>(
    () => [
      { value: "", label: "All jobs" },
      ...jobOptions.map((job) => ({
        value: job.publicJobId,
        label: `${job.jobTitle} (${job.publicJobId})`,
        count: job.applications,
      })),
    ],
    [jobOptions],
  );
  const sortSelectOptions = useMemo<EmployerRegisterSelectOption[]>(
    () => [
      { value: "newest", label: "Newest first" },
      { value: "oldest", label: "Oldest first" },
      { value: "updated", label: "Recently updated" },
    ],
    [],
  );

  const toolbarSelectTriggerClassName =
    "!h-9 text-xs sm:!h-11 sm:text-sm rounded-xl border-border bg-surface shadow-sm transition-[border-color,box-shadow] hover:border-primary/25 focus-visible:border-primary-soft focus-visible:ring-2 focus-visible:ring-primary-soft/20 lg:!h-11";

  return (
    <section className="flex min-w-0 flex-1 flex-col rounded-xl border border-border-subtle bg-surface lg:min-h-[calc(100dvh-14rem)]">
      <div className="border-b border-border-subtle p-3 sm:p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(8.5rem,10.5rem)]">
          <label className="min-w-0">
            <span className="mb-1.5 block text-[11px] font-semibold text-muted sm:text-xs">
              Filter by job
            </span>
            <EmployerRegisterSearchableSelect
              id="candidates-job-filter"
              label="Filter by job"
              hideLabel
              value={publicJobId ?? ""}
              placeholder="All jobs"
              options={jobSelectOptions}
              onChange={onJobChange}
              initialVisibleCount={8}
              countLabel="applications"
              triggerClassName={toolbarSelectTriggerClassName}
            />
          </label>
          <label className="min-w-0 md:max-w-[10.5rem]">
            <span className="mb-1.5 block text-[11px] font-semibold text-muted sm:text-xs">
              Sort by
            </span>
            <EmployerRegisterSearchableSelect
              id="candidates-sort-filter"
              label="Sort by"
              hideLabel
              value={sort}
              placeholder="Newest first"
              options={sortSelectOptions}
              onChange={(value) =>
                onSortChange(value as "newest" | "oldest" | "updated")
              }
              hideSearch
              triggerClassName={toolbarSelectTriggerClassName}
            />
          </label>
        </div>
      </div>

      <div className="border-b border-border-subtle px-3 py-2 sm:px-4">
        <p className="text-[11px] text-muted sm:text-xs">
          {isLoading
            ? "Loading candidates…"
            : `Showing ${from}–${to} of ${total}`}
        </p>
      </div>

      <div className="min-h-0 flex-1 lg:overflow-y-auto lg:scrollbar-hidden">
        {isLoading ? (
          <>
            <ul className="space-y-3 p-3 lg:hidden" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <li
                  key={index}
                  className="rounded-xl border border-border-subtle bg-surface p-4"
                >
                  <div className="flex gap-3">
                    <div className="size-12 animate-pulse rounded-full bg-primary-light/50" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-primary-light/50" />
                      <div className="h-3 w-full animate-pulse rounded bg-primary-light/40" />
                      <div className="h-3 w-4/5 animate-pulse rounded bg-primary-light/40" />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 border-t border-border-subtle pt-3">
                    {Array.from({ length: 4 }).map((__, actionIndex) => (
                      <div
                        key={actionIndex}
                        className="size-11 animate-pulse rounded-lg bg-primary-light/40"
                      />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden px-4 py-12 text-center text-sm text-muted lg:block">
              Loading candidates…
            </div>
          </>
        ) : applications.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-foreground">
              {hasLocationFilter && !hasActiveSearch
                ? "No candidates found for the selected location."
                : "No candidates found."}
            </p>
            <p className="mt-1 text-sm text-muted">
              {hasActiveSearch
                ? "Try searching with another name, skill, location or job title."
                : hasLocationFilter
                  ? "Try another city or state, or clear the location filter."
                  : "No candidates match your filters."}
            </p>
            {hasActiveSearch && onClearSearch ? (
              <button
                type="button"
                onClick={onClearSearch}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-border-subtle bg-surface px-3 text-sm font-semibold text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:min-h-9"
              >
                Clear Search
              </button>
            ) : null}
            {!hasActiveSearch && hasLocationFilter && onClearLocation ? (
              <button
                type="button"
                onClick={onClearLocation}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-border-subtle bg-surface px-3 text-sm font-semibold text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:min-h-9"
              >
                Clear Location
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <ul className="space-y-3 p-3 lg:hidden">
              {applications.map((item) => {
                const isSaved =
                  Boolean(savedByApplicationId[item.id]) ||
                  isEmployerShortlistedOrLaterStatus(item.status);
                return (
                  <li key={item.id}>
                    <CandidateMobileCard
                      item={item}
                      isSelected={selectedId === item.id}
                      isSaved={isSaved}
                      canSave={canSave}
                      onSelect={onSelect}
                      onOpenResume={onOpenResume}
                      onToggleSave={onToggleSave}
                    />
                  </li>
                );
              })}
            </ul>

            <ul className="hidden lg:block">
              {applications.map((item) => {
                const isSelected = selectedId === item.id;
                const isSaved =
                  Boolean(savedByApplicationId[item.id]) ||
                  isEmployerShortlistedOrLaterStatus(item.status);
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "border-b border-border-subtle transition-colors",
                      isSelected
                        ? "bg-primary-light/40"
                        : "hover:bg-primary-light/25",
                    )}
                  >
                    <CandidateDesktopRow
                      item={item}
                      isSaved={isSaved}
                      canSave={canSave}
                      onSelect={onSelect}
                      onOpenResume={onOpenResume}
                      onToggleSave={onToggleSave}
                    />
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <div className="mt-auto flex shrink-0 flex-col gap-2 border-t border-border-subtle px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4">
        <p className="text-xs text-muted">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-lg border border-border-subtle px-3 text-sm font-semibold text-foreground transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:flex-none lg:min-h-9"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Prev
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-lg border border-border-subtle px-3 text-sm font-semibold text-foreground transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:flex-none lg:min-h-9"
          >
            Next
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
