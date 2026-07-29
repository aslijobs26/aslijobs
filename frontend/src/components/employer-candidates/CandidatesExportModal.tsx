"use client";

import {
  exportEmployerApplications,
  previewEmployerApplicationsExport,
} from "@/services/employer-applications.service";
import {
  EMPLOYER_EXPORT_DEFAULT_FIELDS,
  EMPLOYER_EXPORT_FIELD_LABELS,
  EMPLOYER_EXPORT_FIELDS,
  EMPLOYER_EXPORT_FORMAT_LABELS,
  EMPLOYER_EXPORT_FORMATS,
  EMPLOYER_EXPORT_QUICK_DATE_FILTERS,
  EMPLOYER_EXPORT_QUICK_DATE_LABELS,
  type EmployerApplicationStatus,
  type EmployerAvailabilityFilterValue,
  type EmployerExportField,
  type EmployerExportFormat,
  type EmployerExportQuickDateFilter,
} from "@/types/employer-applications";
import { cn } from "@/utils/cn";
import { showAppToast } from "@/utils/share-job";
import { X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

type JobOption = {
  publicJobId: string;
  jobTitle: string;
};

export type CandidatesExportModalFilters = {
  publicJobId?: string;
  status?: EmployerApplicationStatus;
  search?: string;
  location?: string;
  experience?: string;
  skills?: string;
  availability?: EmployerAvailabilityFilterValue;
  appliedFrom?: string;
  appliedTo?: string;
};

type CandidatesExportModalProps = {
  onClose: () => void;
  jobOptions: JobOption[];
  filters: CandidatesExportModalFilters;
};

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response
      ?.data?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data
      .message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return "Something went wrong. Please try again.";
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function CandidatesExportModal({
  onClose,
  jobOptions,
  filters,
}: CandidatesExportModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const [format, setFormat] = useState<EmployerExportFormat>("xlsx");
  const [publicJobId, setPublicJobId] = useState(filters.publicJobId ?? "");
  const [quickDateFilter, setQuickDateFilter] =
    useState<EmployerExportQuickDateFilter>(
      filters.appliedFrom || filters.appliedTo ? "custom" : "all_time",
    );
  const [appliedFrom, setAppliedFrom] = useState(filters.appliedFrom ?? "");
  const [appliedTo, setAppliedTo] = useState(filters.appliedTo ?? "");
  const [fields, setFields] = useState<EmployerExportField[]>([
    ...EMPLOYER_EXPORT_DEFAULT_FIELDS,
  ]);
  const [previewTotal, setPreviewTotal] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const isCustomDateRange = quickDateFilter === "custom";

  const dateError =
    isCustomDateRange && appliedFrom && appliedTo && appliedFrom > appliedTo
      ? "Applied To must be on or after Applied From"
      : null;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !exporting) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    const focusTimer = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [onClose, exporting]);

  const exportParams = useMemo(
    () => ({
      format,
      fields,
      publicJobId: publicJobId || undefined,
      status: filters.status,
      search: filters.search || undefined,
      location: filters.location || undefined,
      experience: filters.experience || undefined,
      skills: filters.skills || undefined,
      availability: filters.availability || undefined,
      quickDateFilter,
      appliedFrom: isCustomDateRange ? appliedFrom || undefined : undefined,
      appliedTo: isCustomDateRange ? appliedTo || undefined : undefined,
    }),
    [
      format,
      fields,
      publicJobId,
      filters.status,
      filters.search,
      filters.location,
      filters.experience,
      filters.skills,
      filters.availability,
      quickDateFilter,
      isCustomDateRange,
      appliedFrom,
      appliedTo,
    ],
  );

  useEffect(() => {
    if (fields.length === 0 || dateError) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setPreviewLoading(true);
      setPreviewError(null);
      void previewEmployerApplicationsExport(exportParams)
        .then((result) => {
          if (cancelled) {
            return;
          }
          setPreviewTotal(result.total);
        })
        .catch((error: unknown) => {
          if (cancelled) {
            return;
          }
          setPreviewTotal(null);
          setPreviewError(getErrorMessage(error));
        })
        .finally(() => {
          if (!cancelled) {
            setPreviewLoading(false);
          }
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [exportParams, fields.length, dateError]);

  const toggleField = (field: EmployerExportField) => {
    setFields((current) => {
      if (current.includes(field)) {
        if (current.length === 1) {
          return current;
        }
        return current.filter((item) => item !== field);
      }
      return [...EMPLOYER_EXPORT_FIELDS].filter(
        (key) => key === field || current.includes(key),
      );
    });
  };

  const handleExport = async () => {
    if (fields.length === 0) {
      showAppToast("Select at least one export field.", "error");
      return;
    }
    if (dateError) {
      showAppToast(dateError, "error");
      return;
    }

    setExporting(true);
    try {
      const { blob, fileName } =
        await exportEmployerApplications(exportParams);
      triggerBlobDownload(blob, fileName);
      showAppToast("Candidate data exported successfully.");
      onClose();
    } catch (error) {
      showAppToast(getErrorMessage(error), "error");
    } finally {
      setExporting(false);
    }
  };

  const selectedJobLabel = publicJobId
    ? (jobOptions.find((job) => job.publicJobId === publicJobId)?.jobTitle ??
      publicJobId)
    : "All Jobs";

  const displayedTotal = dateError ? null : previewTotal;

  const inputClassName =
    "mt-1.5 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button
        type="button"
        aria-label="Close export dialog"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={() => {
          if (!exporting) {
            onClose();
          }
        }}
      />
      <div className="absolute inset-0 flex items-end justify-center sm:items-center sm:p-6">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="flex max-h-[min(92dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border-subtle bg-surface shadow-[0_20px_50px_rgba(15,23,42,0.18)] outline-none sm:rounded-2xl"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-subtle px-5 py-4">
            <h2
              id={titleId}
              className="text-lg font-bold tracking-tight text-foreground"
            >
              Export Candidates
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={exporting}
              aria-label="Close"
              className="inline-flex size-11 items-center justify-center rounded-full border border-border-subtle text-muted transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50 sm:size-10"
            >
              <X className="size-5" strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 scrollbar-hidden">
            <fieldset>
              <legend className="text-sm font-semibold text-foreground">
                Format
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {EMPLOYER_EXPORT_FORMATS.map((option) => (
                  <label
                    key={option}
                    className={cn(
                      "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors",
                      format === option
                        ? "border-primary bg-primary-light/40 text-primary"
                        : "border-border-subtle bg-surface text-muted hover:bg-hero-bg",
                    )}
                  >
                    <input
                      type="radio"
                      name="export-format"
                      value={option}
                      checked={format === option}
                      onChange={() => setFormat(option)}
                      className="sr-only"
                    />
                    {EMPLOYER_EXPORT_FORMAT_LABELS[option]}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="export-job"
                className="text-sm font-semibold text-foreground"
              >
                Job
              </label>
              <select
                id="export-job"
                value={publicJobId}
                onChange={(event) => setPublicJobId(event.target.value)}
                className={inputClassName}
              >
                <option value="">All Jobs</option>
                {jobOptions.map((job) => (
                  <option key={job.publicJobId} value={job.publicJobId}>
                    {job.jobTitle} ({job.publicJobId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="export-quick-date"
                className="text-sm font-semibold text-foreground"
              >
                Quick Date Filter
              </label>
              <select
                id="export-quick-date"
                value={quickDateFilter}
                onChange={(event) => {
                  const next = event.target
                    .value as EmployerExportQuickDateFilter;
                  setQuickDateFilter(next);
                  if (next !== "custom") {
                    setAppliedFrom("");
                    setAppliedTo("");
                  }
                }}
                className={inputClassName}
              >
                {EMPLOYER_EXPORT_QUICK_DATE_FILTERS.map((option) => (
                  <option key={option} value={option}>
                    {EMPLOYER_EXPORT_QUICK_DATE_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="export-from"
                  className="text-sm font-semibold text-foreground"
                >
                  Applied From
                </label>
                <input
                  id="export-from"
                  type="date"
                  value={appliedFrom}
                  disabled={!isCustomDateRange}
                  onChange={(event) => setAppliedFrom(event.target.value)}
                  className={cn(
                    inputClassName,
                    !isCustomDateRange && "cursor-not-allowed opacity-60",
                  )}
                />
              </div>
              <div>
                <label
                  htmlFor="export-to"
                  className="text-sm font-semibold text-foreground"
                >
                  Applied To
                </label>
                <input
                  id="export-to"
                  type="date"
                  value={appliedTo}
                  disabled={!isCustomDateRange}
                  onChange={(event) => setAppliedTo(event.target.value)}
                  className={cn(
                    inputClassName,
                    !isCustomDateRange && "cursor-not-allowed opacity-60",
                  )}
                />
              </div>
            </div>
            {dateError ? (
              <p className="text-sm text-red-600" role="alert">
                {dateError}
              </p>
            ) : null}

            <fieldset>
              <legend className="text-sm font-semibold text-foreground">
                Fields to export
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {EMPLOYER_EXPORT_FIELDS.map((field) => {
                  const checked = fields.includes(field);
                  return (
                    <label
                      key={field}
                      className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-border-subtle px-3 text-sm text-foreground hover:bg-hero-bg"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleField(field)}
                        className="size-4 rounded border-border-subtle text-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                      />
                      {EMPLOYER_EXPORT_FIELD_LABELS[field]}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="rounded-xl border border-border-subtle bg-hero-bg/60 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Summary</p>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                <li>Format: {EMPLOYER_EXPORT_FORMAT_LABELS[format]}</li>
                <li>Job: {selectedJobLabel}</li>
                <li>
                  Date range:{" "}
                  {quickDateFilter === "all_time"
                    ? "All Time"
                    : quickDateFilter === "custom"
                      ? appliedFrom || appliedTo
                        ? `${appliedFrom || "…"} → ${appliedTo || "…"}`
                        : "Custom (no dates selected)"
                      : EMPLOYER_EXPORT_QUICK_DATE_LABELS[quickDateFilter]}
                </li>
                <li>
                  Candidates:{" "}
                  {previewLoading
                    ? "Counting…"
                    : previewError
                      ? "—"
                      : displayedTotal === null
                        ? "—"
                        : displayedTotal.toLocaleString()}
                </li>
              </ul>
              {previewError && !dateError ? (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {previewError}
                </p>
              ) : null}
              {(filters.search ||
                filters.status ||
                filters.location ||
                filters.experience ||
                filters.skills ||
                filters.availability) && (
                <p className="mt-2 text-xs text-muted">
                  Active list filters (search, status, location, experience,
                  skills, availability) are included in this export.
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border-subtle px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:pb-4">
            <button
              type="button"
              onClick={onClose}
              disabled={exporting}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-border-subtle bg-surface px-4 text-sm font-semibold text-muted transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50 sm:min-h-10 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                void handleExport();
              }}
              disabled={
                exporting ||
                fields.length === 0 ||
                Boolean(dateError) ||
                previewLoading
              }
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50 sm:min-h-10 sm:w-auto"
            >
              {exporting ? "Exporting…" : "Export"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
