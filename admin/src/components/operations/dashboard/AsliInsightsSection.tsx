import {
  ArrowRight,
  Briefcase,
  Building2,
  MessageSquareWarning,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import type { AsliInsightItem } from "../../../types/operations-dashboard";
import { OperationsCard } from "../../ui/OperationsCard";
import { cn } from "../../../utils/cn";

interface AsliInsightsSectionProps {
  insights: AsliInsightItem[];
}

const INSIGHT_STYLES = [
  {
    wrap: "border-success/20 bg-success/5",
    iconWrap: "bg-success/15 text-success",
    Icon: Building2,
  },
  {
    wrap: "border-violet-500/20 bg-violet-500/5",
    iconWrap: "bg-violet-500/15 text-violet-600",
    Icon: Briefcase,
  },
  {
    wrap: "border-warning/20 bg-warning/5",
    iconWrap: "bg-warning/15 text-warning",
    Icon: MessageSquareWarning,
  },
] as const;

export function AsliInsightsSection({ insights }: AsliInsightsSectionProps) {
  return (
    <OperationsCard
      title="ASLI Insights"
      subtitle="AI-powered insights for better decisions"
      className="min-w-0"
      badge={
        <span className="inline-flex size-5 items-center justify-center rounded-md bg-violet-500/10 text-violet-600">
          <Sparkles className="size-3" strokeWidth={2} aria-hidden="true" />
        </span>
      }
      action={
        <Link
          to={OPERATIONS_ROUTES.MY_WORK}
          className="text-[12px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          View all insights →
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
        {insights.map((insight, index) => {
          const style = INSIGHT_STYLES[index % INSIGHT_STYLES.length];
          const Icon = style.Icon;
          return (
            <Link
              key={insight.id}
              to={insight.href}
              className={cn(
                "group flex flex-col rounded-xl border p-3.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                style.wrap,
                "hover:brightness-[0.99]",
              )}
            >
              <span
                className={cn(
                  "mb-2.5 inline-flex size-8 items-center justify-center rounded-lg",
                  style.iconWrap,
                )}
              >
                <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
              </span>
              <p className="text-[12px] leading-relaxed text-foreground">
                {insight.message}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                {insight.actionLabel}
                <ArrowRight
                  className="size-3 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </span>
            </Link>
          );
        })}
      </div>
    </OperationsCard>
  );
}
