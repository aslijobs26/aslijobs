"use client";

import {
  EMPLOYER_DASHBOARD_AI_EMPTY,
  EMPLOYER_DASHBOARD_AI_TITLE,
  EMPLOYER_DASHBOARD_HERO_ROW_HEIGHT_CLASS,
} from "@/constants/employer-dashboard-home";
import type { EmployerDashboardInsight } from "@/utils/employer-dashboard-home";
import { Sparkles } from "lucide-react";

type DashboardAiAssistantProps = {
  insights: EmployerDashboardInsight[];
  isLoading?: boolean;
};

export function DashboardAiAssistant({
  insights,
  isLoading = false,
}: DashboardAiAssistantProps) {
  return (
    <section
      className={`flex h-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface p-4 shadow-sm ${EMPLOYER_DASHBOARD_HERO_ROW_HEIGHT_CLASS}`}
    >
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary-light text-primary">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <h2 className="text-sm font-bold text-foreground">
          {EMPLOYER_DASHBOARD_AI_TITLE}
        </h2>
      </div>

      <ul className="scrollbar-hidden mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <li
                key={index}
                className="h-12 shrink-0 animate-pulse rounded-lg bg-hero-bg"
                aria-hidden="true"
              />
            ))
          : null}

        {!isLoading && insights.length === 0 ? (
          <li className="rounded-lg border border-dashed border-border-subtle bg-hero-bg/60 px-3 py-4 text-sm text-muted">
            {EMPLOYER_DASHBOARD_AI_EMPTY}
          </li>
        ) : null}

        {!isLoading
          ? insights.map((insight) => (
              <li
                key={insight.id}
                className="shrink-0 rounded-lg border border-border-subtle bg-hero-bg/50 px-2.5 py-2 transition-colors hover:border-primary/20 hover:bg-primary-light/40"
              >
                <p className="text-xs font-semibold text-foreground">
                  {insight.title}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[0.6875rem] leading-relaxed text-muted">
                  {insight.detail}
                </p>
              </li>
            ))
          : null}
      </ul>
    </section>
  );
}
