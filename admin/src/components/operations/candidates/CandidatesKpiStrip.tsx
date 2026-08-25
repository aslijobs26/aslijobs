import {
  Briefcase,
  CheckCircle2,
  Star,
  UserPlus,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { OperationsCandidatesKpis } from "../../../types/operations-candidates";
import { cn } from "../../../utils/cn";

interface CandidatesKpiStripProps {
  kpis: OperationsCandidatesKpis;
}

const KPI_CONFIG: {
  id: keyof Pick<
    OperationsCandidatesKpis,
    | "totalCandidates"
    | "newThisWeek"
    | "activeApplications"
    | "shortlisted"
    | "hired"
    | "rejected"
  >;
  label: string;
  icon: LucideIcon;
  iconWrap: string;
  iconColor: string;
  caption: (kpis: OperationsCandidatesKpis) => string;
}[] = [
  {
    id: "totalCandidates",
    label: "Total Candidates",
    icon: Users,
    iconWrap: "bg-success/10",
    iconColor: "text-success",
    caption: () => "All time",
  },
  {
    id: "newThisWeek",
    label: "New This Week",
    icon: UserPlus,
    iconWrap: "bg-chart-accent/10",
    iconColor: "text-chart-accent",
    caption: (kpis) =>
      kpis.newThisWeekChangePercent == null
        ? "Registered candidates"
        : `${kpis.newThisWeekChangePercent >= 0 ? "↑" : "↓"} ${Math.abs(kpis.newThisWeekChangePercent)}% vs last week`,
  },
  {
    id: "activeApplications",
    label: "Active Applications",
    icon: Briefcase,
    iconWrap: "bg-warning/10",
    iconColor: "text-warning",
    caption: () => "Ongoing",
  },
  {
    id: "shortlisted",
    label: "Shortlisted",
    icon: Star,
    iconWrap: "bg-chart-accent-alt/10",
    iconColor: "text-chart-accent-alt",
    caption: (kpis) =>
      kpis.shortlistedPercent == null
        ? "Applications"
        : `${kpis.shortlistedPercent}% of candidates`,
  },
  {
    id: "hired",
    label: "Hired",
    icon: CheckCircle2,
    iconWrap: "bg-success/10",
    iconColor: "text-success",
    caption: (kpis) =>
      kpis.hiredPercent == null
        ? "Selected + joined"
        : `${kpis.hiredPercent}% of candidates`,
  },
  {
    id: "rejected",
    label: "Rejected",
    icon: XCircle,
    iconWrap: "bg-danger/10",
    iconColor: "text-danger",
    caption: (kpis) =>
      kpis.rejectedPercent == null
        ? "Applications"
        : `${kpis.rejectedPercent}% of candidates`,
  },
];

function formatCount(value: number): string {
  return value.toLocaleString("en-IN");
}

export function CandidatesKpiStrip({ kpis }: CandidatesKpiStripProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {KPI_CONFIG.map((item) => {
        const Icon = item.icon;
        const caption = item.caption(kpis);
        const isPositiveTrend =
          item.id === "newThisWeek" &&
          kpis.newThisWeekChangePercent != null &&
          kpis.newThisWeekChangePercent >= 0;

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
                  {formatCount(kpis[item.id])}
                </p>
                <p
                  className={cn(
                    "mt-1.5 text-[10px] leading-snug",
                    item.id === "newThisWeek" && kpis.newThisWeekChangePercent != null
                      ? isPositiveTrend
                        ? "text-success"
                        : "text-danger"
                      : "text-muted",
                  )}
                >
                  {caption}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-md sm:size-9 xl:size-10 xl:rounded-lg",
                  item.iconWrap,
                )}
              >
                <Icon
                  className={cn("size-3.5 sm:size-4 xl:size-5", item.iconColor)}
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
