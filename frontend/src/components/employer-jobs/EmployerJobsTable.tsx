"use client";

import { EmployerJobsPagination } from "@/components/employer-jobs/EmployerJobsPagination";
import {
  EMPLOYER_JOB_STATUS_LABELS,
  EMPLOYER_JOB_STATUS_PILL_CLASS,
  EMPLOYER_JOB_TYPE_LABELS,
  EMPLOYER_JOBS_DELETE_CONFIRM,
  EMPLOYER_JOBS_EMPTY_DESCRIPTION,
  EMPLOYER_JOBS_EMPTY_TITLE,
  EMPLOYER_JOBS_ERROR_DESCRIPTION,
  EMPLOYER_JOBS_ERROR_TITLE,
  EMPLOYER_JOBS_LOADING_LABEL,
  EMPLOYER_JOBS_RETRY_LABEL,
  EMPLOYER_JOBS_TABLE_COLUMNS,
} from "@/constants/employer-jobs";
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
  formatEmployerJobPostedRelative,
  getEmployerJobPostedAt,
} from "@/utils/employer-jobs-format";
import { ROUTES } from "@/constants/routes";
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
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";

type EmployerJobsTableProps = {
  jobs: EmployerJobListItem[];
  isLoading: boolean;
  isError: boolean;
  isMutating: boolean;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onStatusAction: (jobId: string, action: JobStatusAction) => void;
  onDelete: (jobId: string) => void;
};

const COLUMN_WIDTHS = [
  "w-[15%]",
  "w-[11%]",
  "w-[12%]",
  "w-[9%]",
  "w-[9%]",
  "w-[7%]",
  "w-[7%]",
  "w-[8%]",
  "w-[11%]",
  "w-[11%]",
] as const;

const HEADER_CELL_CLASS =
  "whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold tracking-wide text-muted uppercase first:pl-4 last:pr-4 xl:px-3.5 xl:py-3 xl:text-[11px] xl:first:pl-5 xl:last:pr-5";

const BODY_CELL_CLASS =
  "px-3 py-2.5 align-middle first:pl-4 last:pr-4 xl:px-3.5 xl:py-3 xl:first:pl-5 xl:last:pr-5";

export function EmployerJobsTable({
  jobs,
  isLoading,
  isError,
  isMutating,
  page,
  limit,
  total,
  totalPages,
  onRetry,
  onPageChange,
  onLimitChange,
  onStatusAction,
  onDelete,
}: EmployerJobsTableProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto text-[11px] leading-snug xl:text-[12px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <table className="w-full min-w-[64rem] table-fixed border-collapse text-left">
          <colgroup>
            {COLUMN_WIDTHS.map((widthClass, index) => (
              <col key={EMPLOYER_JOBS_TABLE_COLUMNS[index]} className={widthClass} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-border-subtle bg-hero-bg/70">
              {EMPLOYER_JOBS_TABLE_COLUMNS.map((column) => (
                <th key={column} scope="col" className={HEADER_CELL_CLASS}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={EMPLOYER_JOBS_TABLE_COLUMNS.length}
                  className="px-4 py-14 text-center text-sm text-muted"
                >
                  {EMPLOYER_JOBS_LOADING_LABEL}
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td
                  colSpan={EMPLOYER_JOBS_TABLE_COLUMNS.length}
                  className="px-4 py-14 text-center"
                >
                  <p className="text-base font-semibold text-foreground">
                    {EMPLOYER_JOBS_ERROR_TITLE}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {EMPLOYER_JOBS_ERROR_DESCRIPTION}
                  </p>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-4 inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary-soft transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    {EMPLOYER_JOBS_RETRY_LABEL}
                  </button>
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td
                  colSpan={EMPLOYER_JOBS_TABLE_COLUMNS.length}
                  className="px-4 py-14 text-center"
                >
                  <p className="text-base font-semibold text-foreground">
                    {EMPLOYER_JOBS_EMPTY_TITLE}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {EMPLOYER_JOBS_EMPTY_DESCRIPTION}
                  </p>
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <EmployerJobsTableRow
                  key={job.id}
                  job={job}
                  disabled={isMutating}
                  onStatusAction={onStatusAction}
                  onDelete={onDelete}
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
  onStatusAction: (jobId: string, action: JobStatusAction) => void;
  onDelete: (jobId: string) => void;
};

function EmployerJobsTableRow({
  job,
  disabled,
  onStatusAction,
  onDelete,
}: EmployerJobsTableRowProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
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
  const relativeDate = formatEmployerJobPostedRelative(postedAt);
  const jobTypeLabel = job.jobType
    ? EMPLOYER_JOB_TYPE_LABELS[job.jobType]
    : "—";
  const openingsLabel = `${job.vacancies} ${job.vacancies === 1 ? "Opening" : "Openings"}`;

  const primaryAction = getPrimaryStatusAction(job.status);

  const handleDelete = () => {
    setMenuOpen(false);
    if (window.confirm(EMPLOYER_JOBS_DELETE_CONFIRM)) {
      onDelete(job.id);
    }
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      setMenuOpen(false);
    }
  };

  const canClose =
    job.status === "active" ||
    job.status === "paused" ||
    job.status === "draft";
  const canReactivate = job.status === "closed";

  return (
    <tr className="border-b border-border-subtle last:border-b-0 hover:bg-hero-bg/35">
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
        {formatEmployerJobCount(job.applications)}
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
        <span
          className={cn(
            "inline-flex min-w-[3.5rem] items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none xl:min-w-[3.75rem] xl:text-[11px]",
            EMPLOYER_JOB_STATUS_PILL_CLASS[job.status],
          )}
        >
          {EMPLOYER_JOB_STATUS_LABELS[job.status]}
        </span>
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
          <IconActionButton label="View job" disabled title="Coming soon">
            <Eye className="size-3.5" />
          </IconActionButton>
          {job.status === "draft" || job.status === "active" ? (
            <Link
              href={ROUTES.postJobEdit(job.id)}
              aria-label={
                job.status === "draft" ? "Edit draft job" : "Edit active job"
              }
              className="inline-flex size-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Pencil className="size-3.5" />
            </Link>
          ) : (
            <IconActionButton label="Edit job" disabled title="Coming soon">
              <Pencil className="size-3.5" />
            </IconActionButton>
          )}

          {primaryAction ? (
            <IconActionButton
              label={primaryAction.label}
              disabled={disabled}
              onClick={() => onStatusAction(job.id, primaryAction.action)}
            >
              {primaryAction.icon}
            </IconActionButton>
          ) : null}

          {job.status === "active" ? (
            <IconActionButton
              label="Share job"
              disabled={disabled}
              onClick={() => {
                void shareOrCopyText({
                  title: job.jobTitle,
                  text: `Check out this job on AsliJobs: ${job.jobTitle}`,
                  url: buildAbsolutePublicJobUrl(job.jobId),
                  successMessage: "Job link copied successfully.",
                });
              }}
            >
              <Share2 className="size-3.5" />
            </IconActionButton>
          ) : (
            <IconActionButton label="Share job" disabled title="Coming soon">
              <Share2 className="size-3.5" />
            </IconActionButton>
          )}

          <div ref={rootRef} className="relative">
            <IconActionButton
              label="More actions"
              disabled={disabled}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MoreVertical className="size-3.5" />
            </IconActionButton>

            {menuOpen ? (
              <div
                id={menuId}
                role="menu"
                tabIndex={-1}
                onKeyDown={handleMenuKeyDown}
                className="absolute top-full right-0 z-20 mt-1 min-w-[9.5rem] overflow-hidden rounded-lg border border-border bg-surface py-1 text-sm shadow-lg"
              >
                {canClose ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-hero-bg focus-visible:bg-hero-bg focus-visible:outline-none"
                    onClick={() => {
                      setMenuOpen(false);
                      onStatusAction(job.id, "close");
                    }}
                  >
                    Close job
                  </button>
                ) : null}
                {canReactivate ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-hero-bg focus-visible:bg-hero-bg focus-visible:outline-none"
                    onClick={() => {
                      setMenuOpen(false);
                      onStatusAction(job.id, "reactivate");
                    }}
                  >
                    Activate job
                  </button>
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none"
                  onClick={handleDelete}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </td>
    </tr>
  );
}

function getPrimaryStatusAction(status: EmployerJobListItem["status"]): {
  action: JobStatusAction;
  label: string;
  icon: ReactNode;
} | null {
  if (status === "active") {
    return {
      action: "pause",
      label: "Pause job",
      icon: <Pause className="size-3.5" />,
    };
  }
  if (status === "paused") {
    return {
      action: "resume",
      label: "Resume job",
      icon: <Play className="size-3.5" />,
    };
  }
  if (status === "draft") {
    return {
      action: "publish",
      label: "Publish job",
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
  ...ariaProps
}: IconActionButtonProps) {
  return (
    <button
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
