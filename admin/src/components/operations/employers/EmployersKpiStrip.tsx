import {
  AlertCircle,
  Ban,
  Briefcase,
  CheckCircle2,
  Clock,
  UserCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { OperationsEmployerKpis } from "../../../types/operations-employers";
import { cn } from "../../../utils/cn";

interface EmployersKpiStripProps {
  kpis: OperationsEmployerKpis;
}

const KPI_CONFIG: {
  id: keyof Pick<
    OperationsEmployerKpis,
    | "totalEmployers"
    | "newEmployersToday"
    | "newThisWeek"
    | "activeEmployers"
    | "verifiedEmployers"
    | "pendingVerification"
    | "suspended"
    | "rejected"
  >;
  label: string;
  icon: LucideIcon;
  iconWrap: string;
  iconColor: string;
  caption: (kpis: OperationsEmployerKpis) => string;
}[] = [
  {
    id: "totalEmployers",
    label: "Total Employers",
    icon: Users,
    iconWrap: "bg-success/10",
    iconColor: "text-success",
    caption: () => "All time",
  },
  {
    id: "newEmployersToday",
    label: "New Employers Today",
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
    caption: () => "This week",
  },
  {
    id: "activeEmployers",
    label: "Active Employers",
    icon: Briefcase,
    iconWrap: "bg-warning/10",
    iconColor: "text-warning",
    caption: (kpis) =>
      kpis.activeEmployersPercent == null
        ? "Active"
        : `${kpis.activeEmployersPercent}% of total`,
  },
  {
    id: "verifiedEmployers",
    label: "Verified Employers",
    icon: CheckCircle2,
    iconWrap: "bg-success/10",
    iconColor: "text-success",
    caption: (kpis) =>
      kpis.verifiedEmployersPercent == null
        ? "Verified"
        : `${kpis.verifiedEmployersPercent}% of total`,
  },
  {
    id: "pendingVerification",
    label: "Pending Verification",
    icon: Clock,
    iconWrap: "bg-warning/10",
    iconColor: "text-warning",
    caption: (kpis) =>
      kpis.pendingVerificationPercent == null
        ? "Under review"
        : `${kpis.pendingVerificationPercent}% of total`,
  },
  {
    id: "suspended",
    label: "Suspended",
    icon: Ban,
    iconWrap: "bg-danger/10",
    iconColor: "text-danger",
    caption: (kpis) =>
      kpis.suspendedPercent == null
        ? "Suspended"
        : `${kpis.suspendedPercent}% of total`,
  },
  {
    id: "rejected",
    label: "Rejected",
    icon: AlertCircle,
    iconWrap: "bg-danger/10",
    iconColor: "text-danger",
    caption: (kpis) =>
      kpis.rejectedPercent == null
        ? "Rejected"
        : `${kpis.rejectedPercent}% of total`,
  },
];

function formatCount(value: number): string {
  return value.toLocaleString("en-IN");
}

export function EmployersKpiStrip({ kpis }: EmployersKpiStripProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-4 2xl:grid-cols-8">
      {KPI_CONFIG.map((item) => {
        const Icon = item.icon;
        const caption = item.caption(kpis);

        return (
          <article
            key={item.id}
            className="flex min-w-0 flex-col justify-between rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm ops-brand-border-glow transition-shadow sm:p-3"
          >
            <div className="flex items-start justify-between gap-1.5">
              <span
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-lg sm:size-8",
                  item.iconWrap,
                  item.iconColor,
                )}
              >
                <Icon className="size-3.5 sm:size-4" aria-hidden="true" />
              </span>
            </div>

            <div className="mt-2 min-w-0">
              <p className="line-clamp-2 text-[10px] font-semibold text-muted">
                {item.label}
              </p>
              <p className="mt-0.5 text-base font-bold tabular-nums tracking-tight text-foreground sm:text-lg">
                {formatCount(kpis[item.id])}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-muted">{caption}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
