"use client";

import { SettingsSection } from "@/components/employer-settings/SettingsSection";
import { EMPLOYER_SETTINGS_PLATFORM_INTEGRATIONS } from "@/constants/employer-settings";
import { Link2 } from "lucide-react";

export function IntegrationsPanel() {
  return (
    <SettingsSection
      title="Integrations"
      description="These services are configured at the platform level. Employers cannot connect or disconnect them from Settings."
    >
      <ul className="space-y-3" role="list">
        {EMPLOYER_SETTINGS_PLATFORM_INTEGRATIONS.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-3 rounded-xl border border-border-subtle px-3.5 py-3"
          >
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
              <Link2 className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {item.title}
                </p>
                <span className="rounded-full bg-hero-bg px-2 py-0.5 text-[0.6875rem] font-semibold text-muted">
                  Managed by AsliJobs
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </SettingsSection>
  );
}
