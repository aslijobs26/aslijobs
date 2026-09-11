import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import type { OperationsPlacementsInsight } from "../../../../types/operations-placements";
import { cn } from "../../../../utils/cn";
import { OperationsCard } from "../../../ui/OperationsCard";

interface PlacementsKeyInsightsProps {
  insights: OperationsPlacementsInsight[];
}

const TONE_STYLES: Record<
  NonNullable<OperationsPlacementsInsight["tone"]>,
  { wrap: string; iconWrap: string; Icon: LucideIcon }
> = {
  positive: {
    wrap: "border-success/20 bg-success/5",
    iconWrap: "bg-success/15 text-success",
    Icon: CheckCircle2,
  },
  negative: {
    wrap: "border-danger/20 bg-danger/5",
    iconWrap: "bg-danger/15 text-danger",
    Icon: AlertTriangle,
  },
  warning: {
    wrap: "border-warning/20 bg-warning/5",
    iconWrap: "bg-warning/15 text-warning",
    Icon: AlertTriangle,
  },
  neutral: {
    wrap: "border-border-subtle bg-hero-bg/40",
    iconWrap: "bg-primary-light text-primary",
    Icon: Info,
  },
};

export function PlacementsKeyInsights({
  insights,
}: PlacementsKeyInsightsProps) {
  const items = Array.isArray(insights) ? insights : [];

  return (
    <OperationsCard
      title="Key Insights"
      subtitle="Selected period"
      className="placements-analytics-card min-w-0"
      badge={
        <span className="inline-flex size-5 items-center justify-center rounded-md bg-primary-light text-primary">
          <Lightbulb className="size-3" strokeWidth={2} aria-hidden="true" />
        </span>
      }
    >
      {items.length === 0 ? (
        <p className="py-3 text-center text-[11px] text-muted xl:py-2 xl:text-[10px]">
          No insights for this period.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5 xl:gap-1">
          {items.map((insight) => {
            const tone = insight.tone ?? "neutral";
            const style = TONE_STYLES[tone];
            const Icon = style.Icon;
            const message = insight.text?.trim() || insight.label?.trim() || "";

            return (
              <li
                key={insight.id}
                className={cn(
                  "flex min-w-0 items-start gap-2 rounded-lg border p-2 xl:gap-1.5 xl:p-1.5",
                  style.wrap,
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-6 shrink-0 items-center justify-center rounded-md xl:size-5",
                    style.iconWrap,
                  )}
                >
                  <Icon
                    className="size-3 xl:size-2.5"
                    aria-hidden="true"
                  />
                </span>
                <p className="min-w-0 text-[11px] leading-snug text-foreground xl:text-[10px]">
                  {message || "—"}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </OperationsCard>
  );
}
