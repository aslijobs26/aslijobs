import type { OperationsCandidatesAnalyticsNamedCount } from "../../../../types/operations-candidates";
import { OperationsCard } from "../../../ui/OperationsCard";

/** Viewport height for ~5 rows (row + gap); XL uses slightly shorter rows. */
const FIVE_ROWS_MAX_HEIGHT_CLASS =
  "max-h-[calc((2.25rem*5)+(0.5rem*4))] xl:max-h-[calc((2rem*5)+(0.375rem*4))]";

export function CandidatesTopCategories({
  items,
}: {
  items: OperationsCandidatesAnalyticsNamedCount[];
}) {
  return (
    <OperationsCard
      title="Top Job Categories"
      subtitle="Most preferred job categories"
      className="candidates-analytics-card min-w-0"
    >
      {items.length === 0 ? (
        <p className="flex min-h-44 items-center justify-center text-center text-xs text-muted xl:min-h-36">
          No category data available.
        </p>
      ) : (
        <ol
          className={`flex min-h-0 flex-col gap-2 overflow-y-auto overscroll-contain scrollbar-hidden xl:gap-1.5 ${FIVE_ROWS_MAX_HEIGHT_CLASS}`}
        >
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-hero-bg/60 px-2.5 text-[11px] max-sm:h-8 max-sm:px-2 max-sm:text-[10px] xl:h-8 xl:text-[10px]"
            >
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-light font-bold text-primary xl:size-4 xl:text-[9px]">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                {item.label}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-foreground">
                {item.count.toLocaleString("en-IN")}
              </span>
              {item.percent != null ? (
                <span className="w-9 shrink-0 text-right tabular-nums text-muted">
                  {item.percent}%
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </OperationsCard>
  );
}
