import {
  Award,
  Briefcase,
  CheckCircle2,
  Lightbulb,
  Star,
  UserCheck,
  UserPlus,
  Users,
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
    | "newCandidatesToday"
    | "newThisWeek"
    | "activeCandidates"
    | "withApplications"
    | "withoutApplications"
    | "shortlisted"
    | "hired"
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
    id: "newCandidatesToday",
    label: "New Candidates Today",
    icon: UserPlus,
    iconWrap: "bg-chart-accent/10",
    iconColor: "text-chart-accent",
    caption: () => "Today",
  },
  {
    id: "newThisWeek",
    label: "New This Week",
    icon: UserCheck,
    iconWrap: "bg-chart-accent-alt/10",
    iconColor: "text-chart-accent-alt",
    caption: () => "This Week",
  },
  {
    id: "activeCandidates",
    label: "Active Candidates",
    icon: Briefcase,
    iconWrap: "bg-warning/10",
    iconColor: "text-warning",
    caption: () => "Active Profiles",
  },
  {
    id: "withApplications",
    label: "With Applications",
    icon: CheckCircle2,
    iconWrap: "bg-success/10",
    iconColor: "text-success",
    caption: (kpis) =>
      kpis.withApplicationsPercent == null
        ? "Applied to jobs"
        : `${kpis.withApplicationsPercent}% of total`,
  },
  {
    id: "withoutApplications",
    label: "Without Applications",
    icon: Lightbulb,
    iconWrap: "bg-warning/10",
    iconColor: "text-warning",
    caption: (kpis) =>
      kpis.withoutApplicationsPercent == null
        ? "No applications yet"
        : `${kpis.withoutApplicationsPercent}% of total`,
  },
  {
    id: "shortlisted",
    label: "Shortlisted",
    icon: Star,
    iconWrap: "bg-danger/10",
    iconColor: "text-danger",
    caption: () => "By Employers",
  },
  {
    id: "hired",
    label: "Hired",
    icon: Award,
    iconWrap: "bg-chart-accent/10",
    iconColor: "text-chart-accent",
    caption: () => "By Employers",
  },
];
function formatCount(value: number): string {
  return value.toLocaleString("en-IN");
}

export function CandidatesKpiStrip({ kpis }: CandidatesKpiStripProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8">
      {KPI_CONFIG.map((item) => {
        const Icon = item.icon;
        const caption = item.caption(kpis);

        return (
          <article
            key={item.id}
            className="min-w-0 rounded-lg border border-border-subtle bg-surface px-2.5 py-2.5 shadow-sm sm:px-3 sm:py-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] leading-snug text-muted sm:text-[11px]">
                  {item.label}
                </p>
                <p className="mt-1 text-lg font-bold leading-none text-foreground sm:text-xl">
                  {formatCount(kpis[item.id])}
                </p>
                <p className="mt-1.5 text-[10px] leading-snug text-muted">
                  {caption}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-md sm:size-9",
                  item.iconWrap,
                )}
              >
                <Icon
                  className={cn("size-3.5 sm:size-4", item.iconColor)}
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
