import { TrendingDown, TrendingUp } from "lucide-react";
import type { OperationsVerificationsSlaMetrics } from "../../../../types/operations-verifications";
import { cn } from "../../../../utils/cn";
import { OperationsCard } from "../../../ui/OperationsCard";

interface VerificationsSlaCardProps {
  sla: OperationsVerificationsSlaMetrics;
}

function formatPercent(value: number | null): string {
  if (value == null) return "—";
  return `${value}%`;
}

function TrendBadge({ value }: { value: number | null }) {
  if (value == null) return null;
  const isUp = value >= 0;
  const Icon = isUp ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[10px] font-semibold",
        isUp ? "text-success" : "text-danger",
      )}
    >
      <Icon className="size-2.5" aria-hidden="true" />
      {Math.abs(value)}%
    </span>
  );
}

export function VerificationsSlaCard({ sla }: VerificationsSlaCardProps) {
  const averageDays =
    sla.averageDays == null
      ? "—"
      : sla.averageDays.toLocaleString("en-IN", {
          maximumFractionDigits: 1,
        });

  return (
    <OperationsCard
      title="SLA Performance"
      subtitle={`Target ${sla.targetDays} days`}
      className="employers-analytics-card min-w-0"
    >
      <div className="flex min-h-44 flex-col justify-center gap-3 xl:min-h-36 xl:gap-2.5">
        <div className="rounded-xl border border-success/20 bg-success/10 px-3 py-3 text-center max-sm:py-2.5">
          <p className="text-[11px] font-medium text-muted max-sm:text-[10px]">
            Average days to decision
          </p>
          <p className="mt-1.5 text-3xl font-bold tabular-nums tracking-tight text-foreground max-sm:text-2xl xl:text-2xl">
            {averageDays}
          </p>
          <div className="mt-1.5 flex items-center justify-center gap-1.5">
            <TrendBadge value={sla.averageDaysTrendPercent} />
            <span className="text-[10px] text-muted">vs prior period</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 max-sm:gap-1.5">
          <div className="rounded-lg border border-border-subtle bg-hero-bg/40 px-2.5 py-2.5 max-sm:px-2 max-sm:py-2">
            <p className="text-[10px] font-medium text-muted">Within SLA</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-success max-sm:text-base">
              {formatPercent(sla.withinSlaPercent)}
            </p>
            <TrendBadge value={sla.withinSlaTrendPercent} />
          </div>
          <div className="rounded-lg border border-border-subtle bg-hero-bg/40 px-2.5 py-2.5 max-sm:px-2 max-sm:py-2">
            <p className="text-[10px] font-medium text-muted">Beyond SLA</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-danger max-sm:text-base">
              {formatPercent(sla.beyondSlaPercent)}
            </p>
            <TrendBadge value={sla.beyondSlaTrendPercent} />
          </div>
        </div>
      </div>
    </OperationsCard>
  );
}
