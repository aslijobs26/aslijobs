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
}> = [
  { value: "totalJobseekers", trend: "totalJobseekersTrendPercent", caption: "totalJobseekersCaption", label: "Total Jobseekers", icon: Users, tone: "text-primary", wrap: "bg-primary-light" },
  { value: "newRegistrations", trend: "newRegistrationsTrendPercent", caption: "newRegistrationsCaption", label: "New Registrations", icon: UserPlus, tone: "text-chart-accent", wrap: "bg-chart-accent/10" },
  { value: "profileCompleted", trend: "profileCompletedTrendPercent", caption: "profileCompletedCaption", label: "Registration Complete", icon: FileCheck, tone: "text-success", wrap: "bg-success/10" },
  { value: "verifiedJobseekers", trend: "verifiedJobseekersTrendPercent", caption: "verifiedJobseekersCaption", label: "WhatsApp Verified", icon: ShieldCheck, tone: "text-warning", wrap: "bg-warning/10" },
  { value: "activeJobseekers", trend: "activeJobseekersTrendPercent", caption: "activeJobseekersCaption", label: "Active Jobseekers", icon: Briefcase, tone: "text-chart-accent-alt", wrap: "bg-chart-accent-alt/10" },
];

export function CandidatesOverviewKpiStrip({ kpis }: Props) {
  return (
    <section aria-label="Jobseeker overview KPIs" className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-5">
      {CARDS.map((card) => {
        const Icon = card.icon;
        const value = kpis[card.value];
        const trend = kpis[card.trend];
        const caption = kpis[card.caption];
        const trendNumber = typeof trend === "number" ? trend : null;
        const isUp = trendNumber != null && trendNumber >= 0;
        const TrendIcon = isUp ? TrendingUp : TrendingDown;
        return (
          <article key={card.label} className="flex min-w-0 flex-col justify-between rounded-xl border border-border-subtle bg-surface p-3 shadow-sm ops-brand-border-glow sm:p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted">{card.label}</p>
                <p className="mt-1.5 text-xl font-bold leading-none tracking-tight tabular-nums text-foreground sm:text-2xl">
                  {typeof value === "number" ? value.toLocaleString("en-IN") : "0"}
                </p>
              </div>
              <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-lg", card.wrap, card.tone)}>
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
              {trendNumber != null ? (
                <span className={cn("inline-flex items-center gap-0.5 font-semibold", isUp ? "text-success" : "text-danger")}>
                  <TrendIcon className="size-3" aria-hidden="true" />{Math.abs(trendNumber)}%
                </span>
              ) : null}
              <span className="truncate font-medium text-muted">{typeof caption === "string" ? caption : ""}</span>
            </div>
          </article>
        );
      })}
    </section>
  );
}
