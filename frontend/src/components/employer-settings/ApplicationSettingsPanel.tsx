"use client";

import { SettingsSection } from "@/components/employer-settings/SettingsSection";
import { ROUTES } from "@/constants/routes";
import {
  EMPLOYER_APPLICATION_STATUS_LABELS,
  EMPLOYER_FORWARD_PIPELINE,
  EMPLOYER_TERMINAL_STATUSES,
} from "@/types/employer-applications";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function ApplicationSettingsPanel() {
  return (
    <div className="space-y-4">
      <SettingsSection
        title="Application Settings"
        description="Hiring stages and transitions are enforced by the applications service. Employers move candidates through the Candidates workspace."
        action={
          <Link
            href={ROUTES.EMPLOYER_CANDIDATES}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Open Candidates
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        }
      >
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Forward pipeline
          </h3>
          <ol className="mt-2 space-y-1.5">
            {EMPLOYER_FORWARD_PIPELINE.map((status, index) => (
              <li
                key={status}
                className="flex items-center gap-2 text-sm text-foreground"
              >
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-light text-[0.6875rem] font-bold text-primary">
                  {index + 1}
                </span>
                {EMPLOYER_APPLICATION_STATUS_LABELS[status] ?? status}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-semibold text-foreground">
            Terminal statuses
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {EMPLOYER_TERMINAL_STATUSES.map((status) => (
              <li
                key={status}
                className="rounded-full bg-hero-bg px-2.5 py-1 text-xs font-semibold text-muted"
              >
                {EMPLOYER_APPLICATION_STATUS_LABELS[status] ?? status}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 text-xs text-muted">
          Auto-shortlisting, custom pipelines, and employer-configurable
          workflow rules are not available in the API yet.
        </p>
      </SettingsSection>
    </div>
  );
}
