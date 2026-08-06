"use client";

import { triggerBlobDownload } from "@/components/employer-saved-candidates/saved-candidates-utils";
import {
  SAVED_CANDIDATE_EXPORT_DEFAULT_FIELDS,
  SAVED_CANDIDATE_EXPORT_FIELD_CATALOG,
  SAVED_CANDIDATE_EXPORT_FIELD_LABELS,
  SAVED_CANDIDATE_EXPORT_FIELDS,
  SAVED_CANDIDATE_EXPORT_FORMAT_LABELS,
  SAVED_CANDIDATE_EXPORT_FORMATS,
  SAVED_CANDIDATE_SORT_OPTIONS,
} from "@/constants/saved-candidates";
import { useCan } from "@/providers/employer-permission-provider";
import {
  exportSavedCandidates,
  previewSavedCandidatesExport,
} from "@/services/saved-candidates.service";
import type { EmployerAvailabilityFilterValue } from "@/types/employer-applications";
import type {
  SavedCandidateExportField,
  SavedCandidateExportFormat,
  SavedCandidatePriority,
  SavedCandidateSort,
} from "@/types/saved-candidates";
import { cn } from "@/utils/cn";
import { showAppToast } from "@/utils/share-job";
import { X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export type SavedCandidatesExportModalFilters = {
  search?: string;
  publicJobId?: string;
  location?: string;
  experience?: string;
  availability?: EmployerAvailabilityFilterValue;
  applicationStatus?: string;
  priority?: SavedCandidatePriority | "";
  tag?: string;
  sort: SavedCandidateSort;
};

type SavedCandidatesExportModalProps = {
  onClose: () => void;
  filters: SavedCandidatesExportModalFilters;
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

export function SavedCandidatesExportModal({
  onClose,
  filters,
}: SavedCandidatesExportModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const { getFieldLevel } = useCan();

  const availableFields = useMemo(
    () =>
      SAVED_CANDIDATE_EXPORT_FIELDS.filter((field) => {
        const catalogField = SAVED_CANDIDATE_EXPORT_FIELD_CATALOG[field];
        if (!catalogField) {
          return true;
        }
        const level = getFieldLevel("candidates", catalogField);
        return level === "view" || level === "edit";
      }),
    [getFieldLevel],
  );

  const canExportResumes = availableFields.includes("resume");

  const [format, setFormat] = useState<SavedCandidateExportFormat>("xlsx");
  const [fields, setFields] = useState<SavedCandidateExportField[]>(() =>
    SAVED_CANDIDATE_EXPORT_DEFAULT_FIELDS.filter((field) =>
      availableFields.includes(field),
    ),
  );
  const [previewTotal, setPreviewTotal] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setFields((current) => {
      const next = current.filter((field) => availableFields.includes(field));
      if (next.length > 0) {
        return next;
      }
      return [...availableFields];
    });
  }, [availableFields]);

  useEffect(() => {
    if (format === "zip" && !canExportResumes) {
      setFormat("xlsx");
    }
  }, [format, canExportResumes]);

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
      fields:
        format === "zip"
          ? (["resume"] as SavedCandidateExportField[])
          : fields,
      search: filters.search || undefined,
      publicJobId: filters.publicJobId || undefined,
      location: filters.location || undefined,
      experience: filters.experience || undefined,
      availability: filters.availability || undefined,
      applicationStatus: filters.applicationStatus || undefined,
      priority: filters.priority || undefined,
      tag: filters.tag || undefined,
      sort: filters.sort,
    }),
    [format, fields, filters],
  );

  useEffect(() => {
    if (format !== "zip" && fields.length === 0) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setPreviewLoading(true);
      setPreviewError(null);
      void previewSavedCandidatesExport(exportParams)
        .then((result) => {
          if (!cancelled) {
            setPreviewTotal(result.total);
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setPreviewTotal(null);
            setPreviewError(getErrorMessage(error));
          }
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
  }, [exportParams, format, fields.length]);

  const toggleField = (field: SavedCandidateExportField) => {
    setFields((current) => {
      if (current.includes(field)) {
        if (current.length === 1) {
          return current;
        }
        return current.filter((item) => item !== field);
      }
      return [...SAVED_CANDIDATE_EXPORT_FIELDS].filter(
        (key) => key === field || current.includes(key),
      );
    });
  };

  const handleExport = async () => {
    if (format !== "zip" && fields.length === 0) {
      showAppToast("Select at least one export field.", "error");
      return;
    }
    if (format === "zip" && !canExportResumes) {
      showAppToast("You do not have permission to export resumes.", "error");
      return;
    }

    setExporting(true);
    try {
      const { blob, fileName } = await exportSavedCandidates(exportParams);
      triggerBlobDownload(blob, fileName);
      showAppToast("Export downloaded successfully.");
      onClose();
    } catch (error) {
      showAppToast(getErrorMessage(error), "error");
    } finally {
      setExporting(false);
    }
  };

  const sortLabel =
    SAVED_CANDIDATE_SORT_OPTIONS.find((option) => option.value === filters.sort)
      ?.label ?? filters.sort;

  const availableFormats = SAVED_CANDIDATE_EXPORT_FORMATS.filter(
    (option) => option !== "zip" || canExportResumes,
  );

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
          className="flex max-h-[min(92dvh,42rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border-subtle bg-surface shadow-[0_20px_50px_rgba(15,23,42,0.18)] outline-none sm:rounded-2xl"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-subtle px-5 py-4">
            <h2
              id={titleId}
              className="text-lg font-bold tracking-tight text-foreground"
            >
              Export Shortlisted Candidates
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
                Export Format
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableFormats.map((option) => (
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
                      name="saved-export-format"
                      value={option}
                      checked={format === option}
                      onChange={() => setFormat(option)}
                      className="sr-only"
                    />
                    {SAVED_CANDIDATE_EXPORT_FORMAT_LABELS[option]}
                  </label>
                ))}
              </div>
            </fieldset>

            {format !== "zip" ? (
              <fieldset>
                <legend className="text-sm font-semibold text-foreground">
                  Fields to export
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {availableFields.map((field) => {
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
                        {SAVED_CANDIDATE_EXPORT_FIELD_LABELS[field]}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : (
              <p className="rounded-xl border border-border-subtle bg-hero-bg/60 px-4 py-3 text-sm text-muted">
                ZIP package includes{" "}
                <span className="font-semibold text-foreground">
                  Saved_Candidates_Report.pdf
                </span>{" "}
                plus a{" "}
                <span className="font-semibold text-foreground">Resumes/</span>{" "}
                folder with candidate resume PDFs. Missing resumes are skipped
                gracefully and noted in the report.
              </p>
            )}

            <div className="rounded-xl border border-border-subtle bg-hero-bg/60 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Summary</p>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                <li>Format: {SAVED_CANDIDATE_EXPORT_FORMAT_LABELS[format]}</li>
                <li>Sort: {sortLabel}</li>
                <li>
                  Candidates:{" "}
                  {previewLoading
                    ? "Counting…"
                    : previewError
                      ? "—"
                      : previewTotal === null
                        ? "—"
                        : previewTotal.toLocaleString()}
                </li>
              </ul>
              {(filters.search ||
                filters.publicJobId ||
                filters.location ||
                filters.experience ||
                filters.availability ||
                filters.priority ||
                filters.tag) && (
                <p className="mt-2 text-xs text-muted">
                  Current search, filters, and sorting are applied to this
                  export (all matching rows, not only the current page).
                </p>
              )}
              {previewError ? (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {previewError}
                </p>
              ) : null}
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
                previewLoading ||
                (format !== "zip" && fields.length === 0) ||
                Boolean(previewError && previewTotal === 0)
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
