"use client";

import { SettingsSection } from "@/components/job-seeker-settings/SettingsSection";
import { SITE_LANGUAGE_OPTIONS } from "@/constants/site-language";
import { runLocationLanguageDetection } from "@/i18n/detect-location-language";
import {
  isAutomaticLocationLanguageEnabled,
  readLanguagePreferenceSource,
  setAutomaticLocationLanguageEnabled,
  subscribeAutomaticLocationLanguage,
} from "@/i18n/location-language-preference";
import { useSiteLanguage, writeSiteLanguage } from "@/i18n/site-language";
import { useTranslate } from "@/i18n/translate";
import { reverseGeocodeLanguageRegionFromCoords } from "@/services/language-region.service";
import { cn } from "@/utils/cn";
import { showAppToast } from "@/utils/share-job";
import { Check } from "lucide-react";
import { useId, useSyncExternalStore } from "react";

export function LanguageSettingsPanel() {
  const selected = useSiteLanguage();
  const t = useTranslate();
  const locationSettingId = useId();
  const useLocation = useSyncExternalStore(
    subscribeAutomaticLocationLanguage,
    isAutomaticLocationLanguageEnabled,
    () => true,
  );

  const handleSelect = (value: string) => {
    const option = SITE_LANGUAGE_OPTIONS.find((item) => item.value === value);
    if (!option) {
      return;
    }
    writeSiteLanguage(option);
    showAppToast(`Language preference saved: ${option.label}`, "success");
  };

  const handleLocationSetting = () => {
    const next = !useLocation;
    setAutomaticLocationLanguageEnabled(next);
    if (!next) {
      return;
    }
    const source = readLanguagePreferenceSource();
    if (source === "manual" || source === "automatic") {
      return;
    }
    void runLocationLanguageDetection(
      { reverseGeocode: reverseGeocodeLanguageRegionFromCoords },
      { force: true },
    );
  };

  return (
    <SettingsSection
      dataTour="seeker-settings-language"
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
      <div className="mt-4 flex items-start justify-between gap-4 rounded-2xl border border-border-subtle bg-surface px-4 py-3.5">
        <div className="min-w-0">
          <p
            id={locationSettingId}
            className="text-xs font-semibold text-foreground sm:text-sm"
          >
            {t("languageSettings.useLocation")}
          </p>
          <p className="mt-1 text-[11px] text-muted sm:text-xs">
            {t("languageSettings.useLocationHint")}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={useLocation}
          aria-labelledby={locationSettingId}
          onClick={handleLocationSetting}
          className={cn(
            "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            useLocation ? "bg-primary" : "bg-border-subtle",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
              useLocation ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>
      <p className="mt-3 text-[11px] text-muted sm:text-xs">
        Full interface translation for every language is rolling out. Your
        preference is saved to this browser and your account.
      </p>
    </SettingsSection>
  );
}
