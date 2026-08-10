"use client";

import { SettingsSection } from "@/components/job-seeker-settings/SettingsSection";
import {
  SITE_DEFAULT_LANGUAGE,
  SITE_LANGUAGE_OPTIONS,
} from "@/constants/site-language";
import { cn } from "@/utils/cn";
import { showAppToast } from "@/utils/share-job";
import { Check } from "lucide-react";
import { useState } from "react";

const LANGUAGE_STORAGE_KEY = "aslijobs.job-seeker.settings.language";

function readStoredLanguage(): string {
  if (typeof window === "undefined") {
    return SITE_DEFAULT_LANGUAGE.value;
  }
  return (
    window.localStorage.getItem(LANGUAGE_STORAGE_KEY)?.trim() ||
    SITE_DEFAULT_LANGUAGE.value
  );
}

export function LanguageSettingsPanel() {
  const [selected, setSelected] = useState(readStoredLanguage);

  const handleSelect = (value: string) => {
    setSelected(value);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
    const label =
      SITE_LANGUAGE_OPTIONS.find((option) => option.value === value)?.label ??
      value;
    showAppToast(`Language preference saved: ${label}`, "success");
  };

  return (
    <SettingsSection
      title="Language"
      description="Choose your preferred language for the job seeker workspace."
    >
      <ul className="divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-surface">
        {SITE_LANGUAGE_OPTIONS.map((option) => {
          const isActive = option.value === selected;
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
        preference is saved for this browser.
      </p>
    </SettingsSection>
  );
}
