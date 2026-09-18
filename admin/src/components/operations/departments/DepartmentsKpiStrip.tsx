import {
  Building2,
  CheckCircle2,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { OperationsDepartmentMetrics } from "../../../types/operations-team";
import { cn } from "../../../utils/cn";

interface DepartmentsKpiStripProps {
  metrics: OperationsDepartmentMetrics | undefined;
  isLoading?: boolean;
}

const KPI_CARDS: Array<{
  id: keyof OperationsDepartmentMetrics;
  label: string;
  caption: (metrics: OperationsDepartmentMetrics) => string;
  icon: LucideIcon;
  iconWrap: string;
  iconColor: string;
  cardClassName: string;
}> = [
  {
    id: "totalDepartments",
    label: "Total Departments",
    caption: () => "Across organization",
    icon: Building2,
    iconWrap: "bg-primary/20",
    iconColor: "text-primary",
    cardClassName:
      "border-primary/20 bg-gradient-to-br from-primary/10 to-white dark:from-primary/15 dark:to-surface",
  },
  {
    id: "activeDepartments",
    label: "Active Departments",
    caption: (metrics) =>
      metrics.totalDepartments > 0
        ? `${Math.round((metrics.activeDepartments / metrics.totalDepartments) * 100)}% of total`
        : "No departments yet",
    icon: CheckCircle2,
    iconWrap: "bg-success/20",
    iconColor: "text-success",
    cardClassName:
      "border-success/20 bg-gradient-to-br from-success/10 to-white dark:from-success/15 dark:to-surface",
  },
  {
    id: "departmentsWithTeams",
    label: "Departments with Teams",
    caption: (metrics) =>
      metrics.totalDepartments > 0
        ? `${Math.round((metrics.departmentsWithTeams / metrics.totalDepartments) * 100)}% have teams`
        : "No team assignments",
    icon: UsersRound,
    iconWrap: "bg-violet-500/20",
    iconColor: "text-violet-600",
    cardClassName:
      "border-violet-200/80 bg-gradient-to-br from-violet-50 to-white dark:border-violet-500/25 dark:from-violet-500/10 dark:to-surface",
  },
  {
    id: "totalMembers",
    label: "Total Members",
    caption: () => "Across all departments",
    icon: Users,
    iconWrap: "bg-amber-500/20",
    iconColor: "text-amber-600",
    cardClassName:
      "border-amber-200/80 bg-gradient-to-br from-amber-50 to-white dark:border-amber-500/25 dark:from-amber-500/10 dark:to-surface",
  },
];

export function DepartmentsKpiStrip({
  metrics,
  isLoading,
}: DepartmentsKpiStripProps) {
  return (
    <section
      aria-label="Department overview KPIs"
      className="grid grid-cols-2 gap-2.5 lg:grid-cols-4"
    >
      {KPI_CARDS.map((item) => {
        const Icon = item.icon;
        const value = metrics?.[item.id];
        return (
          <article
            key={item.id}
            className={cn(
              "ops-brand-border-glow flex min-w-0 flex-col justify-between rounded-xl border p-3.5 shadow-sm",
              item.cardClassName,
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted">{item.label}</p>
                <p className="mt-1.5 text-2xl font-bold leading-none tracking-tight tabular-nums text-foreground">
                  {isLoading || value == null
                    ? "—"
                    : value.toLocaleString("en-IN")}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
                  item.iconWrap,
                  item.iconColor,
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              {metrics && !isLoading ? item.caption(metrics) : "Loading…"}
            </p>
          </article>
        );
      })}
    </section>
  );
}
