"use client";

import { SettingCard } from "@/components/employer-settings/SettingCard";
import { SettingsSection } from "@/components/employer-settings/SettingsSection";
import { EMPLOYER_JOBS_QUERY_KEYS } from "@/constants/employer-jobs";
import { ROUTES } from "@/constants/routes";
import { fetchEmployerJobStats } from "@/services/employer-jobs.service";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Plus } from "lucide-react";
import Link from "next/link";

type JobPreferencesPanelProps = {
  canCreateJob: boolean;
};

export function JobPreferencesPanel({ canCreateJob }: JobPreferencesPanelProps) {
  const statsQuery = useQuery({
    queryKey: EMPLOYER_JOBS_QUERY_KEYS.stats(),
    queryFn: fetchEmployerJobStats,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const stats = statsQuery.data?.stats;

  return (
    <div className="space-y-4">
      <SettingsSection
        title="Job Preferences"
        description="Job defaults are configured per job when you post or edit. There is no separate employer-wide defaults API yet."
        action={
          <Link
            href={ROUTES.EMPLOYER_JOBS}
            className="inline-flex min-h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Open Jobs
          </Link>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              {
                label: "Active jobs",
                value: stats?.countsByStatus.active ?? stats?.activeJobs ?? null,
              },
              {
                label: "Draft jobs",
                value: stats?.countsByStatus.draft ?? null,
              },
              {
                label: "Closed jobs",
                value: stats?.countsByStatus.closed ?? null,
              },
            ] as const
          ).map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border-subtle px-3 py-3"
            >
              <p className="text-xs font-medium text-muted">{item.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                {statsQuery.isLoading ? "—" : (item.value ?? 0)}
              </p>
            </div>
          ))}
        </div>
      </SettingsSection>

      <div className="grid gap-3 sm:grid-cols-2">
        <SettingCard
          title="Jobs workspace"
          description="Review and manage posted jobs"
          icon={Briefcase}
          href={ROUTES.EMPLOYER_JOBS}
        />
        {canCreateJob ? (
          <SettingCard
            title="Post a job"
            description="Set type, salary, and expiry on each posting"
            icon={Plus}
            href={ROUTES.POST_JOB}
          />
        ) : null}
      </div>
    </div>
  );
}
