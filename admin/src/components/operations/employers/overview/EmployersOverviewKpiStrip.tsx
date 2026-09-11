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
  cardClassName: string;
}[] = [
  {
    valueKey: "totalEmployers",
    trendKey: "totalEmployersTrendPercent",
    captionKey: "totalEmployersCaption",
    label: "Total Employers",
    icon: Users,
    iconWrap: "bg-primary/20",
    iconColor: "text-primary",
    cardClassName:
      "border-primary/20 bg-gradient-to-br from-primary/10 to-white dark:from-primary/15 dark:to-surface",
  },
  {
    valueKey: "newRegistrations",
    trendKey: "newRegistrationsTrendPercent",
    captionKey: "newRegistrationsCaption",
    label: "New Registrations",
    icon: UserPlus,
    iconWrap: "bg-sky-500/20",
    iconColor: "text-sky-600",
    cardClassName:
      "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white dark:border-sky-500/25 dark:from-sky-500/10 dark:to-surface",
  },
  {
    valueKey: "verifiedEmployers",
    trendKey: "verifiedEmployersTrendPercent",
    captionKey: "verifiedEmployersCaption",
    label: "Verified Employers",
    icon: CheckCircle2,
    iconWrap: "bg-success/20",
    iconColor: "text-success",
    cardClassName:
      "border-success/20 bg-gradient-to-br from-success/10 to-white dark:from-success/15 dark:to-surface",
  },
  {
    valueKey: "activeEmployers",
    trendKey: "activeEmployersTrendPercent",
    captionKey: "activeEmployersCaption",
    label: "Active Employers",
    icon: Building2,
    iconWrap: "bg-warning/20",
    iconColor: "text-warning",
    cardClassName:
      "border-warning/25 bg-gradient-to-br from-warning/10 to-white dark:from-warning/15 dark:to-surface",
  },
  {
    valueKey: "employersHiring",
    trendKey: "employersHiringTrendPercent",
    captionKey: "employersHiringCaption",
    label: "Employers Hiring",
    icon: BriefcaseBusiness,
    iconWrap: "bg-violet-500/20",
    iconColor: "text-violet-600",
    cardClassName:
      "border-violet-200/80 bg-gradient-to-br from-violet-50 to-white dark:border-violet-500/25 dark:from-violet-500/10 dark:to-surface",
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
      className="grid grid-cols-2 gap-2.5 max-lg:gap-2 max-sm:gap-1.5 lg:grid-cols-5"
    >
      {KPI_CARDS.map((card) => {
        const Icon = card.icon;
        const trend = kpis[card.trendKey];
        const isUp = trend != null && trend >= 0;
        const TrendIcon = isUp ? TrendingUp : TrendingDown;

        return (
          <article
            key={card.valueKey}
            className={cn(
              "ops-brand-border-glow flex min-w-0 flex-col justify-between rounded-xl border p-3.5 shadow-sm max-lg:p-3 max-sm:p-2.5 max-lg:last:col-span-2 lg:last:col-span-1",
              card.cardClassName,
            )}
          >
            <div className="flex items-start justify-between gap-2 max-sm:gap-1.5">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted max-sm:text-[10px]">
                  {card.label}
                </p>
                <p className="mt-1.5 text-2xl font-bold leading-none tracking-tight tabular-nums text-foreground max-lg:text-xl max-sm:mt-1 max-sm:text-lg">
                  {formatCount(kpis[card.valueKey])}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg max-lg:size-8 max-sm:size-7",
                  card.iconWrap,
                  card.iconColor,
                )}
              >
                <Icon className="size-4 max-sm:size-3.5" aria-hidden="true" />
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] max-sm:mt-2 max-sm:text-[10px]">
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
