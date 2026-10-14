"use client";

import { SettingsSection } from "@/components/job-seeker-settings/SettingsSection";
import { SITE_LANGUAGE_OPTIONS } from "@/constants/site-language";
import { useSiteLanguage, writeSiteLanguage } from "@/i18n/site-language";
import { cn } from "@/utils/cn";
import { showAppToast } from "@/utils/share-job";
import { Check } from "lucide-react";

export function LanguageSettingsPanel() {
  const selected = useSiteLanguage();

  const handleSelect = (value: string) => {
    const option = SITE_LANGUAGE_OPTIONS.find((item) => item.value === value);
    if (!option) {
      return;
    }
    writeSiteLanguage(option);
    showAppToast(`Language preference saved: ${option.label}`, "success");
  };

  return (
    <SettingsSection
      title="Language"
      description="Choose your preferred language for the job seeker website and WhatsApp notifications."
    >
      <ul className="divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-surface">
        {SITE_LANGUAGE_OPTIONS.map((option) => {
          const isActive = option.value === selected.value;
          return (
            <li key={option.value}>
              <button
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors",
                  "hover:bg-hero-bg/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
                  isActive && "bg-primary-light/40",
                )}
              >
                <span className="text-xs font-semibold text-foreground sm:text-sm">
                  {option.label}
                </span>
                {isActive ? (
                  <Check
                    className="size-4 shrink-0 text-primary"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[11px] text-muted sm:text-xs">
        Full interface translation for every language is rolling out. Your
        preference is saved to this browser and your account.
      </p>
    </SettingsSection>
  );
}
