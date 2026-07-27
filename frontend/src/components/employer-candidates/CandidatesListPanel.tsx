"use client";

import {
  buildTelHref,
  buildWhatsAppHref,
  employerApplicationStatusClass,
  formatCandidateDate,
  getCandidateInitials,
} from "@/components/employer-candidates/candidates-ats-utils";
import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import { ROUTES } from "@/constants/routes";
import {
  EMPLOYER_APPLICATION_STATUS_LABELS,
  type EmployerApplicationListItem,
  type EmployerApplicationsPagination,
} from "@/types/employer-applications";
import type { EmployerRegisterSelectOption } from "@/types/employer-register";
import { cn } from "@/utils/cn";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  MessageCircle,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

type CandidatesListPanelProps = {
  applications: EmployerApplicationListItem[];
  pagination: EmployerApplicationsPagination | undefined;
  isLoading: boolean;
  selectedId: string | null;
  sort: "newest" | "oldest" | "updated";
  jobOptions: { publicJobId: string; jobTitle: string }[];
  publicJobId: string | undefined;
  hasActiveSearch?: boolean;
  hasLocationFilter?: boolean;
  onClearSearch?: () => void;
  onClearLocation?: () => void;
  onSortChange: (value: "newest" | "oldest" | "updated") => void;
  onJobChange: (publicJobId: string) => void;
  onSelect: (id: string) => void;
  onPageChange: (page: number) => void;
  onOpenResume: (id: string) => void;
  onScheduleInterview: (id: string) => void;
};

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
  onClearSearch,
  onClearLocation,
  onSortChange,
  onJobChange,
  onSelect,
  onPageChange,
  onOpenResume,
  onScheduleInterview,
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
    "!h-11 rounded-xl border-border bg-surface shadow-sm transition-[border-color,box-shadow] hover:border-primary/25 focus-visible:border-primary-soft focus-visible:ring-2 focus-visible:ring-primary-soft/20 lg:!h-11";

  return (
    <section className="flex min-h-[calc(100dvh-14rem)] min-w-0 flex-1 flex-col rounded-xl border border-border-subtle bg-surface">
      <div className="border-b border-border-subtle p-3 sm:p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="min-w-0">
            <span className="mb-1.5 block text-xs font-semibold text-muted">
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
              triggerClassName={toolbarSelectTriggerClassName}
            />
          </label>
          <label className="min-w-0">
            <span className="mb-1.5 block text-xs font-semibold text-muted">
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
        <p className="text-xs text-muted">
          {isLoading
            ? "Loading candidates…"
            : `Showing ${from}–${to} of ${total}`}
        </p>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto scrollbar-hidden">
        {isLoading ? (
          <li className="px-4 py-12 text-center text-sm text-muted">
            Loading candidates…
          </li>
        ) : applications.length === 0 ? (
          <li className="px-4 py-12 text-center">
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
                className="mt-4 inline-flex min-h-9 items-center justify-center rounded-lg border border-border-subtle bg-surface px-3 text-sm font-semibold text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Clear Search
              </button>
            ) : null}
            {!hasActiveSearch && hasLocationFilter && onClearLocation ? (
              <button
                type="button"
                onClick={onClearLocation}
                className="mt-4 inline-flex min-h-9 items-center justify-center rounded-lg border border-border-subtle bg-surface px-3 text-sm font-semibold text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Clear Location
              </button>
            ) : null}
          </li>
        ) : (
          applications.map((item) => {
            const isSelected = selectedId === item.id;
            const whatsappHref = buildWhatsAppHref(item.candidatePhone ?? "");
            const telHref = buildTelHref(item.candidatePhone ?? "");

            return (
              <li
                key={item.id}
                className={cn(
                  "border-b border-border-subtle transition-colors",
                  isSelected ? "bg-primary-light/40" : "hover:bg-primary-light/25",
                )}
              >
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
                          item.candidateLocation || null,
                        ]
                          .filter(Boolean)
                          .join(" | ")}
                      </span>
                    </span>
                  </button>

                  <div className="flex shrink-0 flex-col items-end justify-center gap-1 self-center sm:flex-row sm:items-center">
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
                        className="inline-flex size-8 items-center justify-center rounded-lg text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <MessageCircle className="size-4" aria-hidden="true" />
                      </a>
                    ) : null}
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
                    <button
                      type="button"
                      aria-label="Schedule interview"
                      className="inline-flex size-8 items-center justify-center rounded-lg text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      onClick={(event) => {
                        event.stopPropagation();
                        onScheduleInterview(item.id);
                      }}
                    >
                      <Calendar className="size-4" aria-hidden="true" />
                    </button>
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
              </li>
            );
          })
        )}
      </ul>

      <div className="mt-auto flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border-subtle px-3 py-3 sm:px-4">
        <p className="text-xs text-muted">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border-subtle px-3 text-sm font-semibold text-foreground transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Prev
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border-subtle px-3 text-sm font-semibold text-foreground transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Next
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
