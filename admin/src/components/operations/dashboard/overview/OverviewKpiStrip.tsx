import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../../constants/operations-routes";
import { cn } from "../../../../utils/cn";
import type { OperationsDashboardOverview } from "../../../../types/operations-dashboard-overview";
import {
  Building2,
  Briefcase,
  Users,
  UsersRound,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

const ICONS = {
  jobseekers: Users,
  employers: Building2,
  jobs: Briefcase,
  placements: UsersRound,
} as const;

const CARD_TONES = {
  jobseekers: {
    card: "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white hover:border-sky-300 dark:border-sky-500/25 dark:from-sky-500/10 dark:to-surface dark:hover:border-sky-400/40",
    iconWrap: "bg-sky-500/20 text-sky-600 dark:text-sky-400",
  },
  employers: {
    card: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white hover:border-emerald-300 dark:border-emerald-500/25 dark:from-emerald-500/10 dark:to-surface dark:hover:border-emerald-400/40",
    iconWrap: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  },
  jobs: {
    card: "border-orange-200/80 bg-gradient-to-br from-orange-50 to-white hover:border-orange-300 dark:border-orange-500/25 dark:from-orange-500/10 dark:to-surface dark:hover:border-orange-400/40",
    iconWrap: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
  },
  placements: {
    card: "border-violet-200/80 bg-gradient-to-br from-violet-50 to-white hover:border-violet-300 dark:border-violet-500/25 dark:from-violet-500/10 dark:to-surface dark:hover:border-violet-400/40",
    iconWrap: "bg-violet-500/20 text-violet-600 dark:text-violet-400",
  },
} as const;

export function OverviewKpiStrip({
  kpis,
}: {
  kpis: OperationsDashboardOverview["kpis"];
}) {
  if (kpis.length === 0) {
    return (
      <p className="rounded-xl border border-border-subtle bg-surface px-4 py-6 text-center text-[12px] text-muted">
        No KPI modules available for your permissions.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = ICONS[kpi.id];
        const tone = CARD_TONES[kpi.id];
        return (
          <Link
            key={kpi.id}
            to={kpi.href}
            className={cn(
              "ops-brand-border-glow rounded-xl border p-4 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              tone.card,
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[22px] font-semibold tabular-nums text-foreground">
                  {kpi.value.toLocaleString("en-IN")}
                </p>
                <p className="mt-1 text-[12px] font-medium text-muted">
                  {kpi.label}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-lg",
                  tone.iconWrap,
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
            </div>
            <p className="mt-3 flex items-center gap-1 text-[11px]">
              {kpi.trendDirection === "up" ? (
                <TrendingUp className="size-3.5 text-emerald-600" aria-hidden />
              ) : kpi.trendDirection === "down" ? (
                <TrendingDown className="size-3.5 text-rose-600" aria-hidden />
              ) : null}
              <span
                className={cn(
                  "font-semibold",
                  kpi.trendDirection === "up" && "text-emerald-700",
                  kpi.trendDirection === "down" && "text-rose-700",
                  kpi.trendDirection === "neutral" && "text-muted",
                )}
              >
                {kpi.trendPercent == null
                  ? "No prior period"
                  : `${kpi.trendPercent > 0 ? "↑" : kpi.trendPercent < 0 ? "↓" : ""} ${Math.abs(kpi.trendPercent)}%`}
              </span>
              <span className="text-muted">vs previous period</span>
            </p>
          </Link>
        );
      })}
    </div>
  );
}

export function OverviewModuleTabs({
  active,
}: {
  active:
    | "overview"
    | "jobseekers"
    | "employers"
    | "jobs"
    | "placements"
    | "support";
}) {
  const tabs = [
    { id: "overview", label: "Overview", href: OPERATIONS_ROUTES.DASHBOARD },
    {
      id: "jobseekers",
      label: "Jobseeker Operations",
      href: OPERATIONS_ROUTES.CANDIDATES,
    },
    {
      id: "employers",
      label: "Employer Operations",
      href: OPERATIONS_ROUTES.EMPLOYERS,
    },
    { id: "jobs", label: "Job Operations", href: OPERATIONS_ROUTES.JOBS },
    {
      id: "placements",
      label: "Placement Operations",
      href: OPERATIONS_ROUTES.PLACEMENTS,
    },
  ] as const;

  return (
    <div
      role="tablist"
      aria-label="Operations modules"
      className="-mx-0.5 flex min-w-0 gap-1 overflow-x-auto overscroll-x-contain border-b border-border-subtle px-0.5 pb-px scrollbar-hidden"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          to={tab.href}
          className={cn(
            "shrink-0 rounded-t-md px-3 py-2 text-[12px] font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            active === tab.id
              ? "border-b-2 border-primary text-primary"
              : "text-muted hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
      <span
        className="shrink-0 cursor-not-allowed px-3 py-2 text-[12px] font-semibold text-muted/60"
        title="Support module is not implemented yet"
      >
        Support Operations
      </span>
    </div>
  );
}
