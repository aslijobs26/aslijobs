import {
  Briefcase,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  PauseCircle,
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
  icon: LucideIcon;
  iconWrap: string;
  iconColor: string;
}[] = [
  {
    id: "totalJobs",
    label: "Total Jobs",
    icon: Briefcase,
    iconWrap: "bg-primary-light",
    iconColor: "text-primary",
  },
  {
    id: "pendingApprovalJobs",
    label: "Pending Approval",
    icon: Clock3,
    iconWrap: "bg-warning/10",
    iconColor: "text-warning",
  },
  {
    id: "activeJobs",
    label: "Active Jobs",
    icon: CheckCircle2,
    iconWrap: "bg-success/10",
    iconColor: "text-success",
  },
  {
    id: "pendingPaymentJobs",
    label: "Pending Payment",
    icon: Clock3,
    iconWrap: "bg-chart-accent-alt/10",
    iconColor: "text-chart-accent-alt",
  },
  {
    id: "liveJobs",
    label: "Live Jobs",
    icon: Eye,
    iconWrap: "bg-primary-soft/15",
    iconColor: "text-primary-soft",
  },
  {
    id: "expiredJobs",
    label: "Expired Jobs",
    icon: PauseCircle,
    iconWrap: "bg-danger/10",
    iconColor: "text-danger",
  },
  {
    id: "draftJobs",
    label: "Draft Jobs",
    icon: FileText,
    iconWrap: "bg-muted/15",
    iconColor: "text-muted",
  },
];

function formatCount(value: number): string {
  return value.toLocaleString("en-IN");
}

export function JobsKpiStrip({ kpis, isLoading }: JobsKpiStripProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-7">
      {KPI_CONFIG.map((item) => {
        const Icon = item.icon;

        return (
          <article
            key={item.id}
            className="min-w-0 rounded-lg border border-border-subtle bg-surface px-2.5 py-2.5 shadow-sm sm:px-3 sm:py-3 xl:px-4 xl:py-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] leading-snug text-muted sm:text-[11px] xl:text-xs">
                  {item.label}
                </p>
                <p className="mt-1 text-lg font-bold leading-none text-foreground sm:text-xl xl:mt-1.5 xl:text-2xl">
                  {isLoading ? "—" : formatCount(kpis[item.id])}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-md sm:size-9 xl:size-10 xl:rounded-lg",
                  item.iconWrap,
                )}
              >
                <Icon
                  className={cn(
                    "size-3.5 sm:size-4 xl:size-5",
                    item.iconColor,
                  )}
                  aria-hidden="true"
                />
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
