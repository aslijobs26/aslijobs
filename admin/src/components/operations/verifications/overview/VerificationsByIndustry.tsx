import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../../constants/operations-routes";
import type { OperationsVerificationsNamedCount } from "../../../../types/operations-verifications";
import { cn } from "../../../../utils/cn";
import { OperationsCard } from "../../../ui/OperationsCard";

interface VerificationsByIndustryProps {
  items: OperationsVerificationsNamedCount[];
}

const BARS_SCROLL_CLASS =
  "max-h-[calc((2.5rem*5)+(0.625rem*4))] overflow-y-auto overscroll-contain scrollbar-hidden xl:max-h-[calc((2rem*5)+(0.375rem*4))]";

export function VerificationsByIndustry({
  items,
}: VerificationsByIndustryProps) {
  const rows = Array.isArray(items) ? items : [];
  const max = Math.max(...rows.map((item) => item.count), 1);

  return (
    <OperationsCard
      title="Verifications by Industry"
      className="employers-analytics-card min-w-0"
      action={
        <Link
          to={`${OPERATIONS_ROUTES.VERIFICATIONS}?tab=pending`}
          className="text-[12px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 xl:text-[11px]"
        >
          View all
        </Link>
      }
    >
      {rows.length === 0 ? (
        <p className="flex min-h-44 items-center justify-center text-center text-xs text-muted xl:min-h-36">
          No industry data available.
        </p>
      ) : (
        <ul
          className={cn(
            "flex min-h-44 flex-col gap-2.5 xl:min-h-36 xl:gap-1.5",
            BARS_SCROLL_CLASS,
          )}
        >
          {rows.slice(0, 12).map((item) => (
            <li key={item.key} className="min-w-0 shrink-0">
              <div className="mb-1 flex items-center justify-between gap-2 text-[11px] xl:mb-0.5 xl:text-[10px]">
                <span className="truncate font-medium text-foreground">
                  {item.label}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-foreground">
                  {item.count.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#EEF2F6] dark:bg-hero-bg xl:h-1.5">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.max(8, Math.round((item.count / max) * 100))}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </OperationsCard>
  );
}
