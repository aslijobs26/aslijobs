"use client";

import { EmployerTableRowsSkeleton } from "@/components/employer-dashboard/skeletons/EmployerPageSkeletons";
import { EmployerJobsPagination } from "@/components/employer-jobs/EmployerJobsPagination";
import {
  EMPLOYER_JOB_STATUS_PILL_CLASS,
  EMPLOYER_JOBS_DELETE_UI_ENABLED,
} from "@/constants/employer-jobs";
import { useTranslate, type MessageKey } from "@/i18n/translate";
import type {
  EmployerJobListItem,
  JobStatusAction,
} from "@/types/employer-jobs";
import { cn } from "@/utils/cn";
import {
  formatEmployerJobCount,
  formatEmployerJobLocation,
  formatEmployerJobLocationFull,
  formatEmployerJobPostedAbsolute,
  getEmployerJobPostedAt,
} from "@/utils/employer-jobs-format";
import {
  formatJobSearchJobType,
  formatJobSearchRelativeTime,
} from "@/utils/job-search-format";
import { ROUTES } from "@/constants/routes";
import { useCan } from "@/providers/employer-permission-provider";
import {
  buildAbsolutePublicJobUrl,
  shareOrCopyText,
} from "@/utils/share-job";
import {
  Eye,
  MapPin,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Send,
  Share2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";

type EmployerJobsTableProps = {
  jobs: EmployerJobListItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isMutating: boolean;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  canSelect?: boolean;
  selectedIds: ReadonlySet<string>;
  allPageSelected: boolean;
  somePageSelected: boolean;
  selectionLocked?: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onStatusAction: (jobId: string, action: JobStatusAction) => void;
  onDelete: (jobId: string) => void;
  onPreview: (jobMongoId: string) => void;
  onToggleRow: (jobId: string) => void;
  onTogglePage: (checked: boolean) => void;
};

const COLUMN_WIDTHS_WITH_SELECT = [
  "w-[3.5%]",
  "w-[14%]",
  "w-[9.5%]",
  "w-[10.5%]",
  "w-[8%]",
  "w-[7.5%]",
  "w-[7%]",
  "w-[7%]",
  "w-[10%]",
  "w-[10.5%]",
  "w-[12.5%]",
] as const;

const COLUMN_WIDTHS = [
  "w-[15%]",
  "w-[10.5%]",
  "w-[11.5%]",
  "w-[8.5%]",
  "w-[8%]",
  "w-[7%]",
  "w-[7%]",
  "w-[10%]",
  "w-[11.5%]",
  "w-[11%]",
] as const;

const TABLE_COLUMN_KEYS = [
  "employer.columns.jobTitle",
  "employer.columns.jobId",
  "employer.columns.location",
  "employer.columns.applications",
  "employer.columns.shortlisted",
  "employer.columns.hired",
  "employer.columns.views",
  "employer.columns.status",
  "employer.columns.postedOn",
  "employer.columns.actions",
] as const satisfies readonly MessageKey[];

const HEADER_CELL_CLASS =
  "whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold tracking-wide text-muted uppercase first:pl-4 last:pr-4 xl:px-3.5 xl:py-3 xl:text-[11px] xl:first:pl-5 xl:last:pr-5";

const BODY_CELL_CLASS =
  "px-3 py-2.5 align-middle first:pl-4 last:pr-4 xl:px-3.5 xl:py-3 xl:first:pl-5 xl:last:pr-5";

export function EmployerJobsTable({
  jobs,
  isLoading,
  isError,
  errorMessage,
  isMutating,
  page,
  limit,
  total,
  totalPages,
  canSelect = false,
  selectedIds,
  allPageSelected,
  somePageSelected,
  selectionLocked = false,
  onRetry,
  onPageChange,
  onLimitChange,
  onStatusAction,
  onDelete,
  onPreview,
  onToggleRow,
  onTogglePage,
}: EmployerJobsTableProps) {
  const t = useTranslate();
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const columnCount = TABLE_COLUMN_KEYS.length + (canSelect ? 1 : 0);
  const columnWidths = canSelect ? COLUMN_WIDTHS_WITH_SELECT : COLUMN_WIDTHS;

  useEffect(() => {
    if (!headerCheckboxRef.current) {
      return;
    }
    headerCheckboxRef.current.indeterminate =
      somePageSelected && !allPageSelected && !selectionLocked;
  }, [allPageSelected, selectionLocked, somePageSelected]);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto text-[11px] leading-snug xl:text-[12px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <table
          className={cn(
            "w-full table-fixed border-collapse text-left",
            canSelect ? "min-w-[68rem]" : "min-w-[64rem]",
          )}
        >
          <colgroup>
            {columnWidths.map((widthClass, index) => (
              <col
                key={
                  canSelect && index === 0
                    ? "select"
                    : TABLE_COLUMN_KEYS[canSelect ? index - 1 : index]
                }
                className={widthClass}
              />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-border-subtle bg-hero-bg/70">
              {canSelect ? (
                <th scope="col" className={HEADER_CELL_CLASS}>
                  <span className="sr-only">{t("employer.jobs.selectJobs")}</span>
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={
                      selectionLocked ||
                      (allPageSelected && jobs.length > 0)
                    }
                    disabled={
                      isLoading ||
                      isError ||
                      jobs.length === 0 ||
                      isMutating
                    }
                    onChange={(event) => onTogglePage(event.target.checked)}
                    className="size-3.5 rounded border-border text-primary focus:ring-primary/30"
                    aria-label={t("employer.jobs.selectAllOnPage")}
                  />
                </th>
              ) : null}
              {TABLE_COLUMN_KEYS.map((columnKey) => (
                <th key={columnKey} scope="col" className={HEADER_CELL_CLASS}>
                  {t(columnKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <EmployerTableRowsSkeleton rows={8} colSpan={columnCount} />
            ) : isError ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-4 py-14 text-center"
                >
                  <p className="text-base font-semibold text-foreground">
                    {t("employer.jobs.errorTitle")}
                  </p>
                  <p className="mt-1 break-words text-sm text-muted">
                    {errorMessage?.trim() || t("employer.jobs.errorDescription")}
                  </p>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-4 inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary-soft transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    {t("employer.common.tryAgain")}
                  </button>
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-4 py-14 text-center"
                >
                  <p className="text-base font-semibold text-foreground">
                    {t("employer.jobs.emptyTitle")}
                  </p>
                  <p className="mt-1 break-words text-sm text-muted">
                    {t("employer.jobs.emptyDescription")}
                  </p>
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <EmployerJobsTableRow
                  key={job.id}
                  job={job}
                  disabled={isMutating}
                  canSelect={canSelect}
                  selected={selectionLocked || selectedIds.has(job.id)}
                  selectionLocked={selectionLocked}
                  onToggleRow={onToggleRow}
                  onStatusAction={onStatusAction}
                  onDelete={onDelete}
                  onPreview={onPreview}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-auto shrink-0">
        <EmployerJobsPagination
          page={page}
          limit={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          isLoading={isLoading || isMutating}
        />
      </div>
    </section>
  );
}

type EmployerJobsTableRowProps = {
  job: EmployerJobListItem;
  disabled: boolean;
  canSelect: boolean;
  selected: boolean;
  selectionLocked: boolean;
  onToggleRow: (jobId: string) => void;
  onStatusAction: (jobId: string, action: JobStatusAction) => void;
  onDelete: (jobId: string) => void;
  onPreview: (jobMongoId: string) => void;
};

function EmployerJobsTableRow({
  job,
  disabled,
  canSelect,
  selected,
  selectionLocked,
  onToggleRow,
  onStatusAction,
  onDelete,
  onPreview,
}: EmployerJobsTableRowProps) {
  const t = useTranslate();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const { can } = useCan();
  const canReadJobs = can("jobs", "read");
  const canUpdateJobs = can("jobs", "update");
  const canDeleteJobs =
    EMPLOYER_JOBS_DELETE_UI_ENABLED && can("jobs", "delete");
  const canViewCandidates = can("candidates", "read");
  const hasMoreActions =
    (canUpdateJobs &&
      (job.status === "active" ||
        job.status === "paused" ||
        job.status === "draft" ||
        job.status === "pending_approval" ||
        job.status === "rejected" ||
        job.status === "closed")) ||
    canDeleteJobs;

  useLayoutEffect(() => {
    if (!menuOpen) {
      return;
    }

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight ?? 140;
      const gap = 4;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < menuHeight + gap && rect.top > spaceBelow;

      setMenuStyle({
        position: "fixed",
        top: openUpward
          ? Math.max(8, rect.top - menuHeight - gap)
          : rect.bottom + gap,
        right: Math.max(8, window.innerWidth - rect.right),
        zIndex: 60,
      });
    };

    updatePosition();
    // Remeasure after the menu paints so upward flip uses the real height.
    const frameId = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    // Capture scroll from the table overflow container too.
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const location = formatEmployerJobLocation(
    job.cityName,
    job.stateName,
    job.city,
    job.state,
  );
  const locationFull = formatEmployerJobLocationFull(
    job.cityName,
    job.stateName,
    job.city,
    job.state,
  );
  const postedAt = getEmployerJobPostedAt(job);
  const absoluteDate = formatEmployerJobPostedAbsolute(postedAt);
  const relativeDate = formatJobSearchRelativeTime(postedAt);
  const jobTypeLabel = job.jobType ? formatJobSearchJobType(job.jobType) : "—";
  const openingsLabel = t(
    job.vacancies === 1
      ? "employer.jobs.openingCountOne"
      : "employer.jobs.openingCountMany",
    { count: job.vacancies },
  );

  const primaryAction = getPrimaryStatusAction(job.status);

  const handleDelete = () => {
    setMenuOpen(false);
    if (window.confirm(t("employer.jobs.deleteConfirm"))) {
      onDelete(job.id);
    }
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      setMenuOpen(false);
    }
  };

  const canClose = job.status === "active" || job.status === "paused";
  const canReactivate =
    (job.status === "closed" || job.status === "expired") &&
    String(job.reviewDecision ?? "").toLowerCase() === "approved";

  return (
    <tr
      className={cn(
        "border-b border-border-subtle last:border-b-0 hover:bg-hero-bg/35",
        selected && "bg-primary/5",
      )}
    >
      {canSelect ? (
        <td className={BODY_CELL_CLASS}>
          <input
            type="checkbox"
            checked={selected}
            disabled={disabled || selectionLocked}
            onChange={() => onToggleRow(job.id)}
            onClick={(event) => event.stopPropagation()}
            className="size-3.5 rounded border-border text-primary focus:ring-primary/30"
            aria-label={t("employer.jobs.selectJobAria", {
              title: job.jobTitle,
            })}
          />
        </td>
      ) : null}
      <td className={BODY_CELL_CLASS}>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold leading-snug text-foreground xl:text-[12px]">
            {job.jobTitle}
          </p>
          <p className="mt-0.5 text-[10px] leading-snug text-muted xl:text-[11px]">
            <span className="whitespace-nowrap">{jobTypeLabel}</span>
            <span aria-hidden="true"> · </span>
            <span className="whitespace-nowrap">{openingsLabel}</span>
          </p>
        </div>
      </td>
      <td className={cn(BODY_CELL_CLASS, "text-[11px] whitespace-nowrap text-muted xl:text-[12px]")}>
        {job.jobId}
      </td>
      <td className={BODY_CELL_CLASS}>
        <span className="inline-flex max-w-full items-center gap-1 text-[11px] text-muted xl:text-[12px]">
          <MapPin className="size-3 shrink-0 text-muted" aria-hidden="true" />
          <span className="truncate" title={locationFull}>
            {location}
          </span>
        </span>
      </td>
      <td className={cn(BODY_CELL_CLASS, "text-center text-[11px] font-semibold text-foreground xl:text-[12px]")}>
        {canViewCandidates ? (
          <Link
            href={`${ROUTES.EMPLOYER_CANDIDATES}?jobId=${encodeURIComponent(job.jobId)}`}
            className="text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label={t("employer.jobs.viewApplicationsAria", {
              count: formatEmployerJobCount(job.applications),
              title: job.jobTitle,
            })}
          >
            {formatEmployerJobCount(job.applications)}
          </Link>
        ) : (
          formatEmployerJobCount(job.applications)
        )}
      </td>
      <td className={cn(BODY_CELL_CLASS, "text-center text-[11px] font-semibold text-foreground xl:text-[12px]")}>
        {formatEmployerJobCount(job.shortlisted)}
      </td>
      <td className={cn(BODY_CELL_CLASS, "text-center text-[11px] font-semibold text-foreground xl:text-[12px]")}>
        {formatEmployerJobCount(job.hired)}
      </td>
      <td className={cn(BODY_CELL_CLASS, "text-center text-[11px] font-semibold text-foreground xl:text-[12px]")}>
        {formatEmployerJobCount(job.views)}
      </td>
      <td className={BODY_CELL_CLASS}>
        <div className="flex min-w-0 flex-col gap-1">
          {job.status === "pending_approval" ? (
            <span
              className="inline-flex w-fit max-w-full items-center justify-center rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold leading-none whitespace-nowrap text-amber-950 ring-1 ring-inset ring-amber-300/70 xl:text-xs"
              title={t("employer.jobs.waitingForReview")}
            >
              {t("employer.status.job.pending_approval")}
            </span>
          ) : job.status === "active" &&
            (job.liveChangeReviewStatus === "pending_approval" ||
              job.liveChangeReviewStatus === "rejected") ? (
            <div
              className={cn(
                "inline-flex w-fit max-w-full flex-col gap-0.5 rounded-lg px-2 py-1 ring-1 ring-inset",
                job.liveChangeReviewStatus === "pending_approval"
                  ? "bg-amber-50/80 ring-amber-200/80"
                  : "bg-red-50/70 ring-red-200/70",
              )}
              title={
                job.liveChangeReviewStatus === "pending_approval"
                  ? t("employer.jobs.liveChangePendingTitle")
                  : t("employer.jobs.liveChangeRejectedTitle")
              }
            >
              <span
                className={cn(
                  "inline-flex w-fit items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none xl:text-[11px]",
                  EMPLOYER_JOB_STATUS_PILL_CLASS.active,
                )}
              >
                {t("employer.status.job.active")}
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold leading-snug",
                  job.liveChangeReviewStatus === "pending_approval"
                    ? "text-amber-800"
                    : "text-red-700",
                )}
              >
                {job.liveChangeReviewStatus === "pending_approval"
                  ? t("employer.jobs.liveChangePendingShort")
                  : t("employer.jobs.liveChangeRejectedShort")}
              </span>
              {job.liveChangeReviewStatus === "rejected" &&
              job.liveChangeRejectionReason ? (
                <p
                  className="line-clamp-2 text-[9px] font-normal leading-snug text-red-600"
                  title={job.liveChangeRejectionReason}
                >
                  {job.liveChangeRejectionReason}
                </p>
              ) : null}
            </div>
          ) : (
            <span
              className={cn(
                "inline-flex w-fit items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none whitespace-nowrap xl:text-[11px]",
                EMPLOYER_JOB_STATUS_PILL_CLASS[job.status],
              )}
            >
              {t(`employer.status.job.${job.status}`)}
            </span>
          )}
          {job.status === "rejected" && job.rejectionReason ? (
            <p
              className="line-clamp-2 text-[10px] leading-snug text-red-600"
              title={job.rejectionReason}
            >
              {job.rejectionReason}
            </p>
          ) : null}
        </div>
      </td>
      <td className={cn(BODY_CELL_CLASS, "whitespace-nowrap")}>
        <p className="text-[11px] font-semibold leading-snug text-foreground xl:text-[12px]">
          {absoluteDate}
        </p>
        {relativeDate ? (
          <p className="mt-0.5 text-[10px] leading-snug text-muted">
            ({relativeDate})
          </p>
        ) : null}
      </td>
      <td className={BODY_CELL_CLASS}>
        <div className="flex items-center justify-start gap-1.5">
          {canReadJobs ? (
            <IconActionButton
              label={t("employer.jobs.previewJob")}
              disabled={disabled}
              title={t("employer.jobs.previewJobPosting")}
              onClick={() => onPreview(job.id)}
            >
              <Eye className="size-3.5" />
            </IconActionButton>
          ) : null}
          {canUpdateJobs &&
          (job.status === "draft" ||
            job.status === "active" ||
            job.status === "rejected") ? (
            <Link
              href={ROUTES.postJobEdit(job.id)}
              aria-label={
                job.status === "draft"
                  ? t("employer.jobs.editDraftJob")
                  : job.status === "rejected"
                    ? t("employer.jobs.editRejectedJob")
                    : t("employer.jobs.editActiveJob")
              }
              className="inline-flex size-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Pencil className="size-3.5" />
            </Link>
          ) : null}

          {canUpdateJobs && primaryAction ? (
            <IconActionButton
              label={t(primaryAction.labelKey)}
              disabled={disabled}
              onClick={() => onStatusAction(job.id, primaryAction.action)}
            >
              {primaryAction.icon}
            </IconActionButton>
          ) : null}

          {job.status === "active" ? (
            <IconActionButton
              label={t("jobs.shareJob")}
              disabled={disabled}
              onClick={() => {
                void shareOrCopyText({
                  title: job.jobTitle,
                  text: t("employer.jobs.shareText", { title: job.jobTitle }),
                  url: buildAbsolutePublicJobUrl(job.jobId),
                  successMessage: t("employer.jobs.linkCopied"),
                });
              }}
            >
              <Share2 className="size-3.5" />
            </IconActionButton>
          ) : null}

          {hasMoreActions ? (
            <div className="relative">
              <IconActionButton
                buttonRef={triggerRef}
                label={t("employer.common.moreActions")}
                disabled={disabled}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <MoreVertical className="size-3.5" />
              </IconActionButton>

              {menuOpen
                ? createPortal(
                    <div
                      ref={menuRef}
                      id={menuId}
                      role="menu"
                      tabIndex={-1}
                      style={menuStyle}
                      onKeyDown={handleMenuKeyDown}
                      className="min-w-[9.5rem] overflow-hidden rounded-lg border border-border bg-surface py-1 text-sm shadow-lg"
                    >
                      {canUpdateJobs && canClose ? (
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-hero-bg focus-visible:bg-hero-bg focus-visible:outline-none"
                          onClick={() => {
                            setMenuOpen(false);
                            onStatusAction(job.id, "close");
                          }}
                        >
                          {t("employer.jobs.closeJob")}
                        </button>
                      ) : null}
                      {canUpdateJobs && canReactivate ? (
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-hero-bg focus-visible:bg-hero-bg focus-visible:outline-none"
                          onClick={() => {
                            setMenuOpen(false);
                            onStatusAction(job.id, "reactivate");
                          }}
                        >
                          {t("employer.jobs.activateJob")}
                        </button>
                      ) : null}
                      {canDeleteJobs ? (
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none"
                          onClick={handleDelete}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                          {t("common.delete")}
                        </button>
                      ) : null}
                    </div>,
                    document.body,
                  )
                : null}
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function getPrimaryStatusAction(status: EmployerJobListItem["status"]): {
  action: JobStatusAction;
  labelKey: MessageKey;
  icon: ReactNode;
} | null {
  if (status === "active") {
    return {
      action: "pause",
      labelKey: "employer.jobs.pauseJob",
      icon: <Pause className="size-3.5" />,
    };
  }
  if (status === "paused") {
    return {
      action: "resume",
      labelKey: "employer.jobs.resumeJob",
      icon: <Play className="size-3.5" />,
    };
  }
  if (status === "draft" || status === "rejected") {
    return {
      action: "publish",
      labelKey:
        status === "rejected"
          ? "employer.jobs.resubmitJob"
          : "employer.jobs.publishJob",
      icon: <Send className="size-3.5" />,
    };
  }
  return null;
}

type IconActionButtonProps = {
  label: string;
  children: ReactNode;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
  "aria-haspopup"?: "menu";
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
};

function IconActionButton({
  label,
  children,
  disabled = false,
  title,
  onClick,
  buttonRef,
  ...ariaProps
}: IconActionButtonProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={label}
      title={title ?? label}
      disabled={disabled}
      onClick={onClick}
      {...ariaProps}
      className="inline-flex size-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
