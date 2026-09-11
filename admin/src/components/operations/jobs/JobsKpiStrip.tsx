import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Clock3,
  FileCheck2,
  type LucideIcon,
} from "lucide-react";
import type { OperationsJobsKpis } from "../../../types/operations-jobs";
import { cn } from "../../../utils/cn";

interface JobsKpiStripProps {
  kpis: OperationsJobsKpis;
  isLoading?: boolean;
}

const KPI_CONFIG: {
  id: keyof OperationsJobsKpis;
  label: string;
  caption: (kpis: OperationsJobsKpis) => string;
  icon: LucideIcon;
  iconWrap: string;
  iconColor: string;
  cardClassName: string;
}[] = [
  {
    id: "totalJobs",
    label: "Total Jobs",
    caption: () => "Across all employers",
    icon: Briefcase,
    iconWrap: "bg-primary/20",
    iconColor: "text-primary",
    cardClassName:
      "border-primary/20 bg-gradient-to-br from-primary/10 to-white dark:from-primary/15 dark:to-surface",
  },
  {
    id: "pendingApprovalJobs",
    label: "Pending Approval",
    caption: (kpis) =>
      kpis.totalJobs > 0
        ? `${Math.round((kpis.pendingApprovalJobs / kpis.totalJobs) * 100)}% of total`
        : "Awaiting review",
    icon: FileCheck2,
    iconWrap: "bg-sky-500/20",
    iconColor: "text-sky-600",
    cardClassName:
      "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white dark:border-sky-500/25 dark:from-sky-500/10 dark:to-surface",
  },
  {
    id: "atRiskJobs",
    label: "At Risk of Expiry",
    caption: () => "Closing in 7 days",
    icon: AlertTriangle,
    iconWrap: "bg-warning/20",
    iconColor: "text-warning",
    cardClassName:
      "border-warning/25 bg-gradient-to-br from-warning/10 to-white dark:from-warning/15 dark:to-surface",
  },
  {
    id: "activeJobs",
    label: "Active Jobs",
    caption: (kpis) =>
      kpis.totalJobs > 0
        ? `${Math.round((kpis.activeJobs / kpis.totalJobs) * 100)}% of total`
        : "Live listings",
    icon: CheckCircle2,
    iconWrap: "bg-success/20",
    iconColor: "text-success",
    cardClassName:
      "border-success/20 bg-gradient-to-br from-success/10 to-white dark:from-success/15 dark:to-surface",
  },
  {
    id: "filledClosedJobs",
    label: "Filled / Closed",
    caption: () => "Closed + expired",
    icon: Clock3,
    iconWrap: "bg-danger/20",
    iconColor: "text-danger",
    cardClassName:
      "border-danger/20 bg-gradient-to-br from-danger/10 to-white dark:from-danger/15 dark:to-surface",
  },
];

function formatCount(value: number | undefined): string {
  return (value ?? 0).toLocaleString("en-IN");
}

function readKpi(kpis: OperationsJobsKpis, id: keyof OperationsJobsKpis): number {
  if (id === "atRiskJobs") {
    return kpis.atRiskJobs ?? 0;
  }
  if (id === "filledClosedJobs") {
    return kpis.filledClosedJobs ?? (kpis.expiredJobs ?? 0) + 0;
  }
  return kpis[id] ?? 0;
}

export function JobsKpiStrip({ kpis, isLoading }: JobsKpiStripProps) {
  return (
    <section
      aria-label="Jobs overview KPIs"
      className="grid grid-cols-2 gap-2.5 max-lg:gap-2 max-sm:gap-1.5 lg:grid-cols-5"
    >
      {KPI_CONFIG.map((item) => {
        const Icon = item.icon;
        return (
          <article
            key={item.id}
            className={cn(
              "ops-brand-border-glow flex min-w-0 flex-col justify-between rounded-xl border p-3.5 shadow-sm max-lg:p-3 max-sm:p-2.5 max-lg:last:col-span-2 lg:last:col-span-1",
              item.cardClassName,
            )}
          >
            <div className="flex items-start justify-between gap-2 max-sm:gap-1.5">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted max-sm:text-[10px]">
                  {item.label}
                </p>
                <p className="mt-1.5 text-2xl font-bold leading-none tracking-tight tabular-nums text-foreground max-lg:text-xl max-sm:mt-1 max-sm:text-lg">
                  {isLoading ? "—" : formatCount(readKpi(kpis, item.id))}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg max-lg:size-8 max-sm:size-7",
                  item.iconWrap,
                  item.iconColor,
                )}
              >
                <Icon className="size-4 max-sm:size-3.5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 truncate text-[11px] font-medium text-muted max-sm:mt-2 max-sm:text-[10px]">
              {isLoading ? "…" : item.caption(kpis)}
            </p>
          </article>
        );
      })}
    </section>
  );
}
