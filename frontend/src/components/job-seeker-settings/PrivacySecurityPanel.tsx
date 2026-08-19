"use client";

import { SettingsSection } from "@/components/job-seeker-settings/SettingsSection";
import { JOB_SEEKER_PROFILE_VISIBILITY_OPTIONS } from "@/constants/job-seeker-profile";
import { ROUTES } from "@/constants/routes";
import { useJobSeekerProfileMutations } from "@/components/job-seeker-profile/useJobSeekerProfileMutations";
import type {
  JobSeekerProfileVisibility,
  JobSeekerPublic,
} from "@/types/job-seeker";
import { clearJobSeekerClientSession } from "@/utils/job-seeker-session";
import { cn } from "@/utils/cn";
import { showAppToast } from "@/utils/share-job";
import { LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

type PrivacySecurityPanelProps = {
  jobSeeker: JobSeekerPublic;
  lastLoginLabel: string;
  onDeactivate: () => void;
};

export function PrivacySecurityPanel({
  jobSeeker,
  lastLoginLabel,
  onDeactivate,
}: PrivacySecurityPanelProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { updateProfile, isSaving } = useJobSeekerProfileMutations();
  const [visibility, setVisibility] = useState<JobSeekerProfileVisibility>(
    jobSeeker.profileVisibility ?? "visible",
  );

  useEffect(() => {
    setVisibility(jobSeeker.profileVisibility ?? "visible");
  }, [jobSeeker.profileVisibility]);

  const handleVisibilityChange = async (value: JobSeekerProfileVisibility) => {
    const previous = visibility;
    setVisibility(value);
    try {
      await updateProfile({ profileVisibility: value });
    } catch {
      setVisibility(previous);
    }
  };

  const handleLogout = () => {
    void clearJobSeekerClientSession(queryClient).finally(() => {
      showAppToast("Signed out successfully", "success");
      router.replace(ROUTES.JOB_SEEKER_LOGIN);
    });
  };

  return (
    <div className="space-y-4">
      <SettingsSection
        title="Account Security"
        description="Your job seeker account uses WhatsApp OTP authentication."
      >
        <div className="flex items-start gap-3 rounded-xl border border-border-subtle bg-hero-bg/50 px-4 py-3.5">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-resource-guide-icon-surface text-resource-guide-icon">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-resource-guide-icon sm:text-sm">
              Your account is secure
            </p>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              Last login: {lastLoginLabel}
            </p>
            <p className="mt-1 text-[11px] text-muted sm:text-xs">
              Password and two-factor options are not used because sign-in is
              WhatsApp OTP based.
            </p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Profile Visibility"
        description="Control who can see your job seeker profile."
      >
        <ul className="space-y-2">
          {JOB_SEEKER_PROFILE_VISIBILITY_OPTIONS.map((option) => {
            const isActive = visibility === option.value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() =>
                    void handleVisibilityChange(
                      option.value as JobSeekerProfileVisibility,
                    )
                  }
                  className={cn(
                    "flex w-full flex-col rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60",
                    isActive
                      ? "border-primary bg-primary-light/40"
                      : "border-border-subtle hover:bg-hero-bg/60",
                  )}
                >
                  <span className="text-xs font-semibold text-foreground sm:text-sm">
                    {option.label}
                  </span>
                  <span className="mt-0.5 text-[11px] text-muted sm:text-xs">
                    {option.description}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </SettingsSection>

      <SettingsSection
        title="Privacy & Legal"
        description="Review AsliJobs privacy and terms documents."
      >
        <div className="flex flex-wrap gap-2">
          <Link
            href={ROUTES.PRIVACY_POLICY}
            className="inline-flex h-9 items-center rounded-lg border border-primary px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-sm"
          >
            Privacy Policy
          </Link>
          <Link
            href={ROUTES.TERMS_AND_CONDITIONS}
            className="inline-flex h-9 items-center rounded-lg border border-primary px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-sm"
          >
            Terms & Conditions
          </Link>
        </div>
      </SettingsSection>

      <SettingsSection title="Session">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-primary px-4 text-xs font-semibold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-10 sm:text-sm"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
          <button
            type="button"
            onClick={onDeactivate}
            className="inline-flex h-9 items-center rounded-xl border border-pin-state/50 px-4 text-xs font-semibold text-pin-state transition-colors hover:bg-benefit-ai-matching-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pin-state/30 sm:h-10 sm:text-sm"
          >
            Deactivate Account
          </button>
        </div>
      </SettingsSection>
    </div>
  );
}
