import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { OperationsEmployersOverviewKpis } from "../../../../types/operations-employers";
import { cn } from "../../../../utils/cn";

interface EmployersOverviewKpiStripProps {
  kpis: OperationsEmployersOverviewKpis;
}

const KPI_CARDS: {
  valueKey: keyof Pick<
    OperationsEmployersOverviewKpis,
    | "totalEmployers"
    | "newRegistrations"
    | "verifiedEmployers"
    | "activeEmployers"
    | "employersHiring"
  >;
  trendKey: keyof Pick<
    OperationsEmployersOverviewKpis,
    | "totalEmployersTrendPercent"
    | "newRegistrationsTrendPercent"
    | "verifiedEmployersTrendPercent"
    | "activeEmployersTrendPercent"
    | "employersHiringTrendPercent"
  >;
  captionKey: keyof Pick<
    OperationsEmployersOverviewKpis,
    | "totalEmployersCaption"
    | "newRegistrationsCaption"
    | "verifiedEmployersCaption"
    | "activeEmployersCaption"
    | "employersHiringCaption"
  >;
  label: string;
  icon: LucideIcon;
  iconWrap: string;
  iconColor: string;
}[] = [
  {
    valueKey: "totalEmployers",
    trendKey: "totalEmployersTrendPercent",
    captionKey: "totalEmployersCaption",
    label: "Total Employers",
    icon: Users,
    iconWrap: "bg-primary-light",
    iconColor: "text-primary",
  },
  {
    valueKey: "newRegistrations",
    trendKey: "newRegistrationsTrendPercent",
    captionKey: "newRegistrationsCaption",
    label: "New Registrations",
    icon: UserPlus,
    iconWrap: "bg-chart-accent/10",
    iconColor: "text-chart-accent",
  },
  {
    valueKey: "verifiedEmployers",
    trendKey: "verifiedEmployersTrendPercent",
    captionKey: "verifiedEmployersCaption",
    label: "Verified Employers",
    icon: CheckCircle2,
    iconWrap: "bg-success/10",
    iconColor: "text-success",
  },
  {
    valueKey: "activeEmployers",
    trendKey: "activeEmployersTrendPercent",
    captionKey: "activeEmployersCaption",
    label: "Active Employers",
    icon: Building2,
    iconWrap: "bg-warning/10",
    iconColor: "text-warning",
  },
  {
    valueKey: "employersHiring",
    trendKey: "employersHiringTrendPercent",
    captionKey: "employersHiringCaption",
    label: "Employers Hiring",
    icon: BriefcaseBusiness,
    iconWrap: "bg-chart-accent-alt/10",
    iconColor: "text-chart-accent-alt",
  },
];

function formatCount(value: number): string {
  return value.toLocaleString("en-IN");
}

export function EmployersOverviewKpiStrip({
  kpis,
}: EmployersOverviewKpiStripProps) {
  return (
    <section
      aria-label="Employer overview KPIs"
      className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-5"
    >
      {KPI_CARDS.map((card) => {
        const Icon = card.icon;
        const trend = kpis[card.trendKey];
        const isUp = trend != null && trend >= 0;
        const TrendIcon = isUp ? TrendingUp : TrendingDown;

        return (
          <article
            key={card.valueKey}
            className="flex min-w-0 flex-col justify-between rounded-xl border border-border-subtle bg-surface p-3 shadow-sm ops-brand-border-glow sm:p-3.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted">{card.label}</p>
                <p className="mt-1.5 text-xl font-bold leading-none tracking-tight tabular-nums text-foreground sm:text-2xl">
                  {formatCount(kpis[card.valueKey])}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
                  card.iconWrap,
                  card.iconColor,
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
              {trend != null ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-semibold",
                    isUp ? "text-success" : "text-danger",
                  )}
                >
                  <TrendIcon className="size-3" aria-hidden="true" />
                  {Math.abs(trend)}%
                </span>
              ) : null}
              <span className="truncate font-medium text-muted">
                {kpis[card.captionKey]}
              </span>
            </div>
          </article>
        );
      })}
    </section>
  );
}
