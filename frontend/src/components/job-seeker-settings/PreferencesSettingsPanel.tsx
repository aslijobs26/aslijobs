"use client";

import { SettingsSection } from "@/components/job-seeker-settings/SettingsSection";
import { SettingsSwitch } from "@/components/job-seeker-settings/SettingsSwitch";
import { ROUTES } from "@/constants/routes";
import type { JobSeekerPublic } from "@/types/job-seeker";
import type { JobSeekerAppPreferences } from "@/utils/job-seeker-settings-preferences";
import {
  setJobSeekerAppPreference,
  type JobSeekerAppPreferenceKey,
} from "@/utils/job-seeker-settings-preferences";
import {
  formatExpectedSalary,
  jobTypeLabel,
  workModeLabel,
} from "@/utils/job-seeker-profile";
import { showAppToast } from "@/utils/share-job";
import Link from "next/link";

type PreferencesSettingsPanelProps = {
  jobSeeker: JobSeekerPublic;
  preferences: JobSeekerAppPreferences;
  onPreferencesChange: (next: JobSeekerAppPreferences) => void;
};

const APP_ROWS: { key: JobSeekerAppPreferenceKey; label: string; description: string }[] =
  [
    {
      key: "darkMode",
      label: "Dark Mode",
      description: "Use a darker appearance when supported.",
    },
    {
      key: "dataSaver",
      label: "Data Saver",
      description: "Reduce image and media load where possible.",
    },
    {
      key: "showJobRecommendations",
      label: "Show Job Recommendations",
      description: "Surface recommended jobs in your dashboard.",
    },
    {
      key: "showAiTips",
      label: "Show AI Tips",
      description: "Show helpful Asli AI tips while you browse.",
    },
  ];

export function PreferencesSettingsPanel({
  jobSeeker,
  preferences,
  onPreferencesChange,
}: PreferencesSettingsPanelProps) {
  const handleToggle = (key: JobSeekerAppPreferenceKey, value: boolean) => {
    const previous = preferences;
    try {
      const next = setJobSeekerAppPreference(jobSeeker.id, key, value);
      onPreferencesChange(next);
      showAppToast("Preferences updated", "success");
    } catch {
      onPreferencesChange(previous);
      showAppToast("Unable to save preferences", "error");
    }
  };

  const preferenceRows = [
    { label: "Job Role", value: jobSeeker.jobRole.trim() || "—" },
    {
      label: "Preferred Job Type",
      value: jobTypeLabel(jobSeeker.jobType) || "—",
    },
    {
      label: "Work Mode",
      value: workModeLabel(jobSeeker.workMode) || "—",
    },
    {
      label: "Preferred Location",
      value: jobSeeker.preferredJobLocation.trim() || "—",
    },
    {
      label: "Expected Salary",
      value: formatExpectedSalary(jobSeeker) || "—",
    },
  ];

  return (
    <div className="space-y-4">
      <SettingsSection
        title="Job Preferences"
        description="These preferences power job matching. Edit them on your profile."
        action={
          <Link
            href={`${ROUTES.JOB_SEEKER_PROFILE}?tab=preferences`}
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-primary px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Edit preferences
          </Link>
        }
      >
        <dl className="divide-y divide-border-subtle rounded-xl border border-border-subtle">
          {preferenceRows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 px-4 py-3"
            >
              <dt className="text-sm text-muted">{row.label}</dt>
              <dd className="truncate text-right text-sm font-semibold text-foreground">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </SettingsSection>

      <SettingsSection
        title="App Preferences"
        description="Control how the job seeker workspace behaves on this device."
      >
        <ul className="space-y-4">
          {APP_ROWS.map((row) => (
            <li
              key={row.key}
              className="flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {row.label}
                </p>
                <p className="mt-0.5 text-xs text-muted">{row.description}</p>
              </div>
              <SettingsSwitch
                label={row.label}
                checked={preferences[row.key]}
                onCheckedChange={(checked) => handleToggle(row.key, checked)}
              />
            </li>
          ))}
        </ul>
      </SettingsSection>
    </div>
  );
}
