"use client";

import { JobDetailsCenterPanel } from "@/components/jobs/JobDetailsCenterPanel";
import { EMPLOYER_JOBS_QUERY_KEYS } from "@/constants/employer-jobs";
import { ROUTES } from "@/constants/routes";
import { useCan } from "@/providers/employer-permission-provider";
import { fetchEmployerJob } from "@/services/employer-jobs.service";
import { cn } from "@/utils/cn";
import { mapEmployerJobDetailToPublicPreview } from "@/utils/map-employer-job-to-public-preview";
import { useQuery } from "@tanstack/react-query";
import { Eye, Pencil, X } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";

type EmployerJobPreviewModalProps = {
  jobMongoId: string;
  onClose: () => void;
};

export function EmployerJobPreviewModal({
  jobMongoId,
  onClose,
}: EmployerJobPreviewModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const { can, getFieldLevel } = useCan();
  const canReadJobs = can("jobs", "read");
  const canUpdateJobs = can("jobs", "update");

  const salaryLevel = getFieldLevel("jobs", "salary");
  const benefitsLevel = getFieldLevel("jobs", "benefits");
  const canViewSalary = salaryLevel === "view" || salaryLevel === "edit";
  const canViewBenefits =
    benefitsLevel === "view" || benefitsLevel === "edit";
  const canViewContact = canReadJobs;

  const jobQuery = useQuery({
    queryKey: EMPLOYER_JOBS_QUERY_KEYS.detail(jobMongoId),
    queryFn: () => fetchEmployerJob(jobMongoId),
    enabled: Boolean(jobMongoId) && canReadJobs,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const employerJob = jobQuery.data?.job;
  const previewJob = useMemo(() => {
    if (!employerJob) {
      return undefined;
    }
    return mapEmployerJobDetailToPublicPreview(employerJob, {
      canViewSalary,
      canViewBenefits,
      canViewContact,
    });
  }, [employerJob, canViewSalary, canViewBenefits, canViewContact]);

  const canEdit =
    canUpdateJobs &&
    employerJob &&
    (employerJob.status === "draft" || employerJob.status === "active");

  useEffect(() => {
    if (!canReadJobs) {
      onClose();
    }
  }, [canReadJobs, onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 20);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
    };
  }, []);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null) {
      return;
    }
    const endY = event.changedTouches[0]?.clientY ?? touchStartY.current;
    const delta = endY - touchStartY.current;
    touchStartY.current = null;
    if (delta > 80) {
      onClose();
    }
  };

  const footerButtonClass =
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-9 sm:text-sm";

  return (
    <div className="fixed inset-0 z-50 print:static print:z-auto" role="presentation">
      <button
        type="button"
        aria-label="Close job preview"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm print:hidden"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4 print:relative print:inset-auto print:p-0">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex w-full flex-col overflow-hidden bg-surface outline-none",
            "h-[100dvh] max-h-[100dvh] rounded-none",
            "sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-[640px] sm:rounded-[24px]",
            "border border-border-subtle shadow-[0_20px_50px_rgba(15,23,42,0.28)]",
            "print:h-auto print:max-h-none print:w-full print:max-w-none print:rounded-none print:border-0 print:shadow-none",
          )}
        >
          <header
            className="shrink-0 px-3 pt-2 pb-2 sm:px-4 sm:pt-3 sm:pb-2.5"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="mx-auto mb-2 h-1 w-10 rounded-full bg-border-subtle sm:hidden print:hidden"
              aria-hidden="true"
            />
            <div className="flex items-center justify-between gap-3">
              <span
                id={titleId}
                className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200/80"
              >
                <Eye className="size-3" aria-hidden="true" />
                Preview Mode
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close preview"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 print:hidden"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-2 scrollbar-hidden sm:px-3 sm:pb-3 print:overflow-visible">
            <JobDetailsCenterPanel
              job={previewJob}
              isLoading={jobQuery.isLoading}
              isError={jobQuery.isError}
              bookmarked={false}
              onToggleBookmark={() => undefined}
              onRetry={() => {
                void jobQuery.refetch();
              }}
              previewMode
            />
          </div>

          <footer className="shrink-0 border-t border-border-subtle px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-3 print:hidden">
            <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  footerButtonClass,
                  "text-muted hover:bg-hero-bg",
                )}
              >
                Close Preview
              </button>
              {canEdit && employerJob ? (
                <Link
                  href={ROUTES.postJobEdit(employerJob.id)}
                  className={cn(
                    footerButtonClass,
                    "border-transparent bg-primary text-white hover:bg-primary-hover",
                  )}
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  Edit Job
                </Link>
              ) : null}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
