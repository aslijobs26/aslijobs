"use client";

import type { EmployerApplicationStats } from "@/types/employer-applications";
import { Briefcase, FileText, Star, Users } from "lucide-react";

type CandidatesKpiStripProps = {
  stats: EmployerApplicationStats | undefined;
  isLoading: boolean;
};

const KPI_ITEMS: {
  key: keyof EmployerApplicationStats;
  label: string;
  icon: typeof Users;
}[] = [
  { key: "total", label: "Total Candidates", icon: Users },
  { key: "submitted", label: "New Applications", icon: FileText },
  { key: "shortlisted", label: "Shortlisted", icon: Star },
  { key: "interview_scheduled", label: "Interview Scheduled", icon: Briefcase },
];

export function CandidatesKpiStrip({
  stats,
  isLoading,
}: CandidatesKpiStripProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {KPI_ITEMS.map((item) => {
        const Icon = item.icon;
        const value = stats?.[item.key];

        return (
          <div
            key={item.key}
            className="flex w-full max-w-40 flex-col rounded-xl border border-border-subtle bg-surface px-3 py-2.5 shadow-sm transition-[border-color,box-shadow] hover:border-primary/25 hover:shadow-md sm:w-40"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold leading-none tracking-tight text-foreground">
              {isLoading ? (
                <span className="inline-block h-7 w-9 animate-pulse rounded bg-primary-light/50" />
              ) : (
                (value ?? 0)
              )}
            </p>
            <p className="mt-1.5 text-xs font-semibold leading-tight text-muted">
              {item.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
