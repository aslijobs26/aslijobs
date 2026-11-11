import type { ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "../../../utils/cn";
import {
  getOperationsApiErrorMessage,
  isMissingApiRouteError,
} from "../../../utils/operations-api-errors";
import { OperationsFilterSelect } from "../jobs/OperationsFilterSelect";

export interface ActivityJourneyStage {
  id: string;
  label: string;
  state: "done" | "current" | "pending";
  at: string | null;
  detail: string;
}

type FormatDateTime = (iso: string) => string;

const ROWS_PER_PAGE_OPTIONS = [
  { value: "10", label: "10" },
  { value: "20", label: "20" },
  { value: "50", label: "50" },
] as const;

const pageButtonClass =
  "inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-border bg-surface px-2.5 text-[11px] font-medium text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:text-border disabled:hover:bg-surface max-sm:h-7 max-sm:text-[10px]";

export function ActivityJourneyStep({
  stage,
  isLast,
  formatDateTime,
}: {
  stage: ActivityJourneyStage;
  isLast: boolean;
  formatDateTime: FormatDateTime;
}) {
  const done = stage.state === "done";
  const current = stage.state === "current";
  return (
    <li className="relative flex min-w-[6.5rem] flex-1 flex-col items-center px-1 text-center sm:min-w-[7.5rem]">
      {!isLast ? (
        <span
          className={cn(
            "absolute top-3 left-1/2 h-0.5 w-full",
            done ? "bg-success/50" : "bg-border-subtle",
          )}
          aria-hidden="true"
        />
      ) : null}
      <span
        className={cn(
          "relative z-[1] inline-flex size-6 items-center justify-center rounded-full border-2 text-[10px] font-bold",
          done
            ? "border-success bg-success text-surface"
            : current
              ? "border-primary bg-surface text-primary"
              : "border-border-subtle bg-surface text-muted",
        )}
      >
        {done ? <Check className="size-3.5" aria-hidden="true" /> : null}
      </span>
      <span
        className={cn(
          "mt-1.5 text-[11px] font-semibold sm:text-xs",
          done || current ? "text-foreground" : "text-muted",
        )}
      >
        {stage.label}
      </span>
      <span className="mt-0.5 text-[10px] text-muted">
        {done
          ? stage.at
            ? formatDateTime(stage.at)
            : "Date not recorded"
          : current
            ? "Next step"
            : "Pending"}
      </span>
      <span className="mt-0.5 text-[10px] text-muted">{stage.detail}</span>
    </li>
  );
}

export type ActivitySummaryTone = "primary" | "accent" | "success" | "warning" | "neutral";

const SUMMARY_TONE_CLASSES: Record<ActivitySummaryTone, string> = {
  primary: "border-primary/15 bg-gradient-to-br from-surface to-primary/10",
  accent: "border-chart-accent/15 bg-gradient-to-br from-surface to-chart-accent/10",
  success: "border-success/15 bg-gradient-to-br from-surface to-success/10",
  warning: "border-warning/15 bg-gradient-to-br from-surface to-warning/10",
  neutral: "border-border-subtle bg-gradient-to-br from-surface to-hero-bg",
};

export function ActivitySummaryTile({
  label,
  value,
  compact = false,
  tone = "neutral",
}: {
  label: string;
  value: string;
  /** Smaller text for long values such as dates. */
  compact?: boolean;
  tone?: ActivitySummaryTone;
}) {
  return (
    <div className={cn("rounded-lg border px-2.5 py-2", SUMMARY_TONE_CLASSES[tone])}>
      <p className="text-[10px] font-medium text-muted sm:text-[11px]">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-foreground tabular-nums",
          compact
            ? "text-[11px] font-semibold sm:text-xs"
            : "text-sm font-bold sm:text-base",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function ActivityPanelSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <div className="h-24 animate-pulse rounded-xl bg-hero-bg" />
      <div className="h-16 animate-pulse rounded-xl bg-hero-bg" />
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-lg bg-hero-bg" />
      ))}
    </div>
  );
}

export function ActivityLoadError({
  error,
  fallback,
  onRetry,
}: {
  error: unknown;
  fallback: string;
  onRetry: () => void;
}) {
  const message = isMissingApiRouteError(error)
    ? "Activity history is not available on the server yet. The AsliJobs API needs to be redeployed with the latest release."
    : getOperationsApiErrorMessage(error, fallback);
  return (
    <div className="rounded-xl border border-border-subtle bg-surface px-3 py-10 text-center">
      <p className="text-[12px] font-medium text-danger sm:text-sm">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2.5 inline-flex h-8 items-center rounded-lg bg-primary-light px-3 text-[11px] font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-xs"
      >
        Retry
      </button>
    </div>
  );
}

export function ActivityFilterChips<Category extends string>({
  categories,
  selected,
  counts,
  labels,
  onSelect,
}: {
  categories: readonly ("all" | Category)[];
  selected: "all" | Category;
  counts: Partial<Record<"all" | Category, number>>;
  labels: Record<"all" | Category, string>;
  onSelect: (category: "all" | Category) => void;
}) {
  return (
    <div
      className="mt-2 flex gap-1 overflow-x-auto pb-1 scrollbar-hidden"
      role="group"
      aria-label="Filter activity"
      data-tour="ops-activity-filters"
    >
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          aria-pressed={selected === category}
          onClick={() => onSelect(category)}
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors sm:text-[11px]",
            selected === category
              ? "bg-primary text-surface"
              : "bg-hero-bg text-muted hover:text-foreground",
          )}
        >
          {labels[category]} ({counts[category] ?? 0})
        </button>
      ))}
    </div>
  );
}

export function ActivityEventRow({
  icon: Icon,
  iconClassName,
  title,
  at,
  description,
  formatDateTime,
  children,
  dataTour,
}: {
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  at: string;
  description: string;
  formatDateTime: FormatDateTime;
  /** Actor badge and links shown under the description. */
  children?: ReactNode;
  /** Product tour anchor (`data-tour`). */
  dataTour?: string;
}) {
  return (
    <li data-tour={dataTour} className="flex items-start gap-2 text-[11px] sm:gap-3 sm:text-xs">
      <span
        className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center rounded-md sm:size-8 sm:rounded-lg",
          iconClassName,
        )}
      >
        <Icon className="size-3.5 sm:size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
          <h4 className="font-semibold text-foreground">{title}</h4>
          <time dateTime={at} className="shrink-0 text-[10px] text-muted sm:text-[11px]">
            {formatDateTime(at)}
          </time>
        </div>
        {description ? (
          <p className="mt-0.5 leading-snug break-words text-muted">{description}</p>
        ) : null}
        {children ? (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">{children}</div>
        ) : null}
      </div>
    </li>
  );
}

export function ActivityActorBadge({ label }: { label: string }) {
  return (
    <span className="rounded bg-hero-bg px-1.5 py-px text-[10px] font-medium text-muted">
      {label}
    </span>
  );
}

export function ActivityPaginationBar({
  ariaLabel,
  from,
  to,
  total,
  limit,
  loading,
  canGoBack,
  canGoForward,
  onPrevious,
  onNext,
  onLimitChange,
}: {
  ariaLabel: string;
  from: number;
  to: number;
  total: number;
  limit: number;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onLimitChange: (limit: number) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 max-sm:gap-1.5 sm:flex-row sm:items-center sm:justify-between">
      <p
        className="min-w-0 text-center text-[11px] text-muted max-sm:text-[10px] sm:text-left"
        aria-live="polite"
      >
        {loading ? (
          "Loading events…"
        ) : (
          <>
            Showing {from.toLocaleString("en-IN")} to {to.toLocaleString("en-IN")} of{" "}
            {total.toLocaleString("en-IN")} events
          </>
        )}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-end">
        <nav className="flex items-center gap-1.5" aria-label={ariaLabel}>
          <button
            type="button"
            disabled={!canGoBack}
            onClick={onPrevious}
            className={pageButtonClass}
          >
            <ChevronLeft className="size-3.5" strokeWidth={2} aria-hidden="true" />
            Newer
          </button>
          <button
            type="button"
            disabled={!canGoForward}
            onClick={onNext}
            className={pageButtonClass}
          >
            Older
            <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </button>
        </nav>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="hidden text-[11px] text-muted sm:inline" aria-hidden>
            Rows
          </span>
          <OperationsFilterSelect
            label="Rows per page"
            value={String(limit)}
            options={ROWS_PER_PAGE_OPTIONS}
            hideSearch
            className="w-[4.75rem] shrink-0"
            triggerClassName="min-w-0 px-2"
            onChange={(value) => onLimitChange(Number(value))}
          />
        </div>
      </div>
    </div>
  );
}
