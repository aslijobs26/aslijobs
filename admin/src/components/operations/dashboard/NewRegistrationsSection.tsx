import { Building2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import { useOperationsRegistrationMetrics } from "../../../hooks/use-operations-registration-awareness";
import type {
  OperationsRecentCandidateRegistration,
  OperationsRecentEmployerRegistration,
} from "../../../types/operations-registration-awareness";
import { OperationsBadge } from "../../ui/OperationsBadge";
import { OperationsCard } from "../../ui/OperationsCard";
import { cn } from "../../../utils/cn";

type RecentTab = "employers" | "candidates";

function formatCount(value: number | null | undefined) {
  if (value == null) {
    return "—";
  }
  return new Intl.NumberFormat("en-IN").format(value);
}

function KpiTile({
  label,
  value,
  href,
}: {
  label: string;
  value: number | null | undefined;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="flex min-h-[3.5rem] flex-col justify-center rounded-lg border border-border-subtle bg-hero-bg/30 px-3 py-2.5 transition-colors hover:border-primary/20 hover:bg-primary-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <span className="text-[20px] font-bold leading-none tabular-nums text-foreground">
        {formatCount(value)}
      </span>
      <span className="mt-1.5 text-[11px] font-medium text-muted">{label}</span>
    </Link>
  );
}

function RecentEmployerRow({
  item,
}: {
  item: OperationsRecentEmployerRegistration;
}) {
  return (
    <li>
      <Link
        to={item.actionPath}
        className="flex items-start justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-hero-bg/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-[12px] font-semibold text-foreground">
              {item.displayName}
            </span>
            {item.awarenessState === "new" ? (
              <OperationsBadge
                variant="high"
                className="px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide"
              >
                NEW
              </OperationsBadge>
            ) : null}
          </span>
          <span className="mt-0.5 block font-mono text-[10px] text-muted">
            {item.displayId}
          </span>
          <span className="mt-1 block text-[10px] text-muted">
            {item.verificationStatusLabel} · {item.registeredRelative}
          </span>
        </span>
      </Link>
    </li>
  );
}

function RecentCandidateRow({
  item,
}: {
  item: OperationsRecentCandidateRegistration;
}) {
  return (
    <li>
      <Link
        to={item.actionPath}
        className="flex items-start justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-hero-bg/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-[12px] font-semibold text-foreground">
              {item.displayName}
            </span>
            {item.awarenessState === "new" ? (
              <OperationsBadge
                variant="high"
                className="px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide"
              >
                NEW
              </OperationsBadge>
            ) : null}
          </span>
          <span className="mt-0.5 block font-mono text-[10px] text-muted">
            {item.displayId}
          </span>
          <span className="mt-1 block text-[10px] text-muted">
            {item.profileStatusLabel} · {item.registeredRelative}
          </span>
        </span>
      </Link>
    </li>
  );
}

export function NewRegistrationsSection() {
  const metricsQuery = useOperationsRegistrationMetrics();
  const [activeTab, setActiveTab] = useState<RecentTab>("employers");

  const data = metricsQuery.data;
  const employersMetrics = data?.employers ?? null;
  const candidatesMetrics = data?.candidates ?? null;

  useEffect(() => {
    if (employersMetrics == null && candidatesMetrics != null) {
      setActiveTab("candidates");
    } else if (candidatesMetrics == null && employersMetrics != null) {
      setActiveTab("employers");
    }
  }, [employersMetrics, candidatesMetrics]);

  const recentItems = useMemo(() => {
    if (!data) {
      return [];
    }
    return activeTab === "employers"
      ? data.recent.employers
      : data.recent.candidates;
  }, [activeTab, data]);

  const hasAnyMetrics =
    employersMetrics != null || candidatesMetrics != null;

  return (
    <OperationsCard
      title="New Registrations"
      subtitle="Unseen and recent employer & jobseeker sign-ups"
      className="min-w-0"
      badge={
        <span className="inline-flex size-5 items-center justify-center rounded-md bg-primary-light text-primary">
          <Building2 className="size-3" strokeWidth={2} aria-hidden="true" />
        </span>
      }
      bodyClassName="p-2.5 sm:p-3"
      action={
        <Link
          to={
            activeTab === "employers"
              ? OPERATIONS_ROUTES.EMPLOYERS
              : OPERATIONS_ROUTES.CANDIDATES
          }
          className="text-[12px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          View all →
        </Link>
      }
    >
      {metricsQuery.isLoading ? (
        <div
          className="space-y-3"
          aria-busy="true"
          aria-label="Loading new registrations"
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded-lg bg-hero-bg"
              />
            ))}
          </div>
          <div className="h-28 animate-pulse rounded-lg bg-hero-bg" />
        </div>
      ) : null}

      {metricsQuery.isError ? (
        <div className="space-y-2 py-6 text-center">
          <p className="text-sm font-medium text-danger">
            Failed to load new registrations.
          </p>
          <button
            type="button"
            onClick={() => void metricsQuery.refetch()}
            className="inline-flex h-8 items-center rounded-lg bg-primary-light px-3 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!metricsQuery.isLoading && !metricsQuery.isError && !hasAnyMetrics ? (
        <p className="py-8 text-center text-xs text-muted">
          You do not have access to registration metrics, or there is no data
          yet.
        </p>
      ) : null}

      {!metricsQuery.isLoading && !metricsQuery.isError && hasAnyMetrics ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {employersMetrics ? (
              <>
                <KpiTile
                  label="Employers today"
                  value={employersMetrics.today}
                  href={OPERATIONS_ROUTES.EMPLOYERS}
                />
                <KpiTile
                  label="Employers this week"
                  value={employersMetrics.thisWeek}
                  href={OPERATIONS_ROUTES.EMPLOYERS}
                />
              </>
            ) : null}
            {candidatesMetrics ? (
              <>
                <KpiTile
                  label="Jobseekers today"
                  value={candidatesMetrics.today}
                  href={OPERATIONS_ROUTES.CANDIDATES}
                />
                <KpiTile
                  label="Jobseekers this week"
                  value={candidatesMetrics.thisWeek}
                  href={OPERATIONS_ROUTES.CANDIDATES}
                />
              </>
            ) : null}
          </div>

          <div>
            <div
              role="tablist"
              aria-label="Recent registrations"
              className="mb-2 flex gap-1 rounded-lg bg-hero-bg/60 p-1"
            >
              {(
                [
                  {
                    id: "employers" as const,
                    label: "Employers",
                    icon: Building2,
                    count: data?.recent.employers.length ?? 0,
                    visible: employersMetrics != null,
                  },
                  {
                    id: "candidates" as const,
                    label: "Jobseekers",
                    icon: Users,
                    count: data?.recent.candidates.length ?? 0,
                    visible: candidatesMetrics != null,
                  },
                ] as const
              )
                .filter((tab) => tab.visible)
                .map((tab) => {
                  const Icon = tab.icon;
                  const selected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                        selected
                          ? "bg-surface text-foreground shadow-sm"
                          : "text-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="size-3.5" strokeWidth={2} aria-hidden="true" />
                      {tab.label}
                      <span className="tabular-nums text-muted">
                        ({tab.count})
                      </span>
                    </button>
                  );
                })}
            </div>

            {recentItems.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted">
                No recent {activeTab === "employers" ? "employer" : "jobseeker"}{" "}
                registrations.
              </p>
            ) : (
              <ul className="divide-y divide-border-subtle/80">
                {activeTab === "employers"
                  ? (recentItems as OperationsRecentEmployerRegistration[]).map(
                      (item) => (
                        <RecentEmployerRow key={item.id} item={item} />
                      ),
                    )
                  : (
                      recentItems as OperationsRecentCandidateRegistration[]
                    ).map((item) => (
                      <RecentCandidateRow key={item.id} item={item} />
                    ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </OperationsCard>
  );
}
