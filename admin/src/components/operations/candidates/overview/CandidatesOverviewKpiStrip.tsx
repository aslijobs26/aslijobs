import { Briefcase, FileCheck, ShieldCheck, TrendingDown, TrendingUp, UserPlus, Users, type LucideIcon } from "lucide-react";
import type { OperationsCandidatesOverviewKpis } from "../../../../types/operations-candidates";
import { cn } from "../../../../utils/cn";

interface Props {
  kpis: OperationsCandidatesOverviewKpis;
}

const CARDS: Array<{
  value: keyof OperationsCandidatesOverviewKpis;
  trend: keyof OperationsCandidatesOverviewKpis;
  caption: keyof OperationsCandidatesOverviewKpis;
  label: string;
  icon: LucideIcon;
  tone: string;
  wrap: string;
  card: string;
}> = [
  {
    value: "totalJobseekers",
    trend: "totalJobseekersTrendPercent",
    caption: "totalJobseekersCaption",
    label: "Total Jobseekers",
    icon: Users,
    tone: "text-primary",
    wrap: "bg-primary/20",
    card: "border-primary/20 bg-gradient-to-br from-primary/10 to-white dark:from-primary/15 dark:to-surface",
  },
  {
    value: "newRegistrations",
    trend: "newRegistrationsTrendPercent",
    caption: "newRegistrationsCaption",
    label: "New Registrations",
    icon: UserPlus,
    tone: "text-sky-600",
    wrap: "bg-sky-500/20",
    card: "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white dark:border-sky-500/25 dark:from-sky-500/10 dark:to-surface",
  },
  {
    value: "profileCompleted",
    trend: "profileCompletedTrendPercent",
    caption: "profileCompletedCaption",
    label: "Registration Complete",
    icon: FileCheck,
    tone: "text-success",
    wrap: "bg-success/20",
    card: "border-success/20 bg-gradient-to-br from-success/10 to-white dark:from-success/15 dark:to-surface",
  },
  {
    value: "verifiedJobseekers",
    trend: "verifiedJobseekersTrendPercent",
    caption: "verifiedJobseekersCaption",
    label: "WhatsApp Verified",
    icon: ShieldCheck,
    tone: "text-warning",
    wrap: "bg-warning/20",
    card: "border-warning/25 bg-gradient-to-br from-warning/10 to-white dark:from-warning/15 dark:to-surface",
  },
  {
    value: "activeJobseekers",
    trend: "activeJobseekersTrendPercent",
    caption: "activeJobseekersCaption",
    label: "Active Jobseekers",
    icon: Briefcase,
    tone: "text-violet-600",
    wrap: "bg-violet-500/20",
    card: "border-violet-200/80 bg-gradient-to-br from-violet-50 to-white dark:border-violet-500/25 dark:from-violet-500/10 dark:to-surface",
  },
];

export function CandidatesOverviewKpiStrip({ kpis }: Props) {
  return (
    <section
      aria-label="Jobseeker overview KPIs"
      className="grid grid-cols-2 gap-2.5 max-lg:gap-2 max-sm:gap-1.5 lg:grid-cols-5"
    >
      {CARDS.map((card) => {
        const Icon = card.icon;
        const value = kpis[card.value];
        const trend = kpis[card.trend];
        const caption = kpis[card.caption];
        const trendNumber = typeof trend === "number" ? trend : null;
        const isUp = trendNumber != null && trendNumber >= 0;
        const TrendIcon = isUp ? TrendingUp : TrendingDown;
        return (
          <article
            key={card.label}
            className={cn(
              "ops-brand-border-glow flex min-w-0 flex-col justify-between rounded-xl border p-3.5 shadow-sm max-lg:p-3 max-sm:p-2.5 max-lg:last:col-span-2 lg:last:col-span-1",
              card.card,
            )}
          >
            <div className="flex items-start justify-between gap-2 max-sm:gap-1.5">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted max-sm:text-[10px]">
                  {card.label}
                </p>
                <p className="mt-1.5 text-2xl font-bold leading-none tracking-tight tabular-nums text-foreground max-lg:text-xl max-sm:mt-1 max-sm:text-lg">
                  {typeof value === "number" ? value.toLocaleString("en-IN") : "0"}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg max-lg:size-8 max-sm:size-7",
                  card.wrap,
                  card.tone,
                )}
              >
                <Icon className="size-4 max-sm:size-3.5" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] max-sm:mt-2 max-sm:text-[10px]">
              {trendNumber != null ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-semibold",
                    isUp ? "text-success" : "text-danger",
                  )}
                >
                  <TrendIcon className="size-3" aria-hidden="true" />
                  {Math.abs(trendNumber)}%
                </span>
              ) : null}
              <span className="truncate font-medium text-muted">
                {typeof caption === "string" ? caption : ""}
              </span>
            </div>
          </article>
        );
      })}
    </section>
  );
}
