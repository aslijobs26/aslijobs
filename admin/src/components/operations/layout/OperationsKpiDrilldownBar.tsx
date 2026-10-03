import { ArrowLeft } from "lucide-react";

interface OperationsKpiDrilldownBarProps {
  label: string;
  /** Caption shown on the selected KPI card, e.g. the analytics range. */
  caption?: string;
  /** Rows matching the table filters; shown with `cardCount` only when filters are active. */
  filteredCount?: number;
  cardCount?: number;
  hasFilters: boolean;
  onBack: () => void;
}

function formatCount(value: number): string {
  return value.toLocaleString("en-IN");
}

/** Header strip above a KPI card drill-down table with a way back to the analytics overview. */
export function OperationsKpiDrilldownBar({
  label,
  caption,
  filteredCount,
  cardCount,
  hasFilters,
  onBack,
}: OperationsKpiDrilldownBarProps) {
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-3 py-2.5 max-sm:px-2.5 sm:px-4 xl:px-3 xl:py-2">
      <p className="min-w-0 text-xs text-muted">
        Showing <span className="font-semibold text-foreground">{label}</span>
        {caption ? ` · ${caption}` : null}
        {hasFilters && cardCount != null && filteredCount != null
          ? ` · ${formatCount(filteredCount)} of ${formatCount(cardCount)} match filters`
          : null}
      </p>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-8"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to Overview
      </button>
    </div>
  );
}
