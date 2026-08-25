"use client";

import { JobSeekerSettingsPageSkeleton } from "@/components/job-seeker-dashboard/skeletons/JobSeekerPageSkeletons";
import { AccountSettingsPanel } from "@/components/job-seeker-settings/AccountSettingsPanel";
import { ConnectedAppsPanel } from "@/components/job-seeker-settings/ConnectedAppsPanel";
import { DeactivateAccountModal } from "@/components/job-seeker-settings/DeactivateAccountModal";
import { LanguageSettingsPanel } from "@/components/job-seeker-settings/LanguageSettingsPanel";
import { NotificationsSettingsPanel } from "@/components/job-seeker-settings/NotificationsSettingsPanel";
import { PreferencesSettingsPanel } from "@/components/job-seeker-settings/PreferencesSettingsPanel";
import { PrivacySecurityPanel } from "@/components/job-seeker-settings/PrivacySecurityPanel";
import { SettingsNav } from "@/components/job-seeker-settings/SettingsNav";
import { JOB_SEEKER_RESUME_QUERY_KEY } from "@/constants/job-seeker-profile";
import { JOB_SEEKER_GENDER_OPTIONS } from "@/constants/job-seeker-register";
import {
  JOB_SEEKER_SETTINGS_DEFAULT_SECTION,
  JOB_SEEKER_SETTINGS_NAV_ITEMS,
  type JobSeekerSettingsSectionId,
} from "@/constants/job-seeker-settings";
import { ROUTES } from "@/constants/routes";
import { useJobSeekerProfile } from "@/hooks/useJobSeekerProfile";
import { fetchMyResume } from "@/services/job-seeker-resume.service";
import {
  getJobSeekerAppPreferences,
  type JobSeekerAppPreferences,
} from "@/utils/job-seeker-settings-preferences";
import {
  computeProfileStrength,
  formatCurrentLocation,
  formatWhatsappNumber,
  getInitials,
  jobTypeLabel,
  languageLabel,
} from "@/utils/job-seeker-profile";
import { resolveMediaUrl } from "@/utils/resolve-media-url";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

function isSettingsSectionId(value: string): value is JobSeekerSettingsSectionId {
  return JOB_SEEKER_SETTINGS_NAV_ITEMS.some((item) => item.id === value);
}

function formatDateLabel(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    // Already a date-only string like YYYY-MM-DD
    const parts = value.split("-");
    if (parts.length === 3) {
      const parsed = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2]),
      );
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    }
    return "—";
  }
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatLastLogin(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (sameDay) {
    return `Today, ${time}`;
  }

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function genderLabel(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  return (
    JOB_SEEKER_GENDER_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

export function JobSeekerSettingsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const profileQuery = useJobSeekerProfile();
  const jobSeeker = profileQuery.data;

  const resumeQuery = useQuery({
    queryKey: JOB_SEEKER_RESUME_QUERY_KEY,
    queryFn: fetchMyResume,
    staleTime: 60_000,
    enabled: Boolean(jobSeeker?.id),
  });

  const requestedSection = searchParams.get("section")?.trim() ?? "";
  const activeSection: JobSeekerSettingsSectionId = useMemo(() => {
    if (isSettingsSectionId(requestedSection)) {
      return requestedSection;
    }
    return JOB_SEEKER_SETTINGS_DEFAULT_SECTION;
  }, [requestedSection]);

  const setActiveSection = useCallback(
    (sectionId: JobSeekerSettingsSectionId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (sectionId === JOB_SEEKER_SETTINGS_DEFAULT_SECTION) {
        params.delete("section");
      } else {
        params.set("section", sectionId);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const [preferences, setPreferences] = useState<JobSeekerAppPreferences>(() =>
    getJobSeekerAppPreferences(jobSeeker?.id ?? ""),
  );
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  useEffect(() => {
    if (jobSeeker?.id) {
      setPreferences(getJobSeekerAppPreferences(jobSeeker.id));
    }
  }, [jobSeeker?.id]);

  const profileCompletionPercent = useMemo(() => {
    if (!jobSeeker) {
      return 0;
    }
    return computeProfileStrength(jobSeeker, resumeQuery.data).percent;
  }, [jobSeeker, resumeQuery.data]);

  const infoRows = useMemo(() => {
    if (!jobSeeker) {
      return [];
    }

    const phone = formatWhatsappNumber(jobSeeker.whatsappNumber) || "—";
    const location = formatCurrentLocation(jobSeeker) || "—";
    const experience =
      jobSeeker.experienceType === "fresher"
        ? "Fresher"
        : jobSeeker.experienceType === "experienced"
          ? "Experienced"
          : "—";
    const languages =
      Array.isArray(jobSeeker.languages) && jobSeeker.languages.length > 0
        ? jobSeeker.languages.map(languageLabel).join(", ")
        : "—";

    return [
      {
        label: "Full Name",
        value: jobSeeker.fullName.trim() || "—",
      },
      {
        label: "Phone Number",
        value: phone,
        verified: jobSeeker.isWhatsappVerified,
      },
      {
        label: "Location",
        value: location,
        href: `${ROUTES.JOB_SEEKER_PROFILE}?tab=overview`,
      },
      {
        label: "Date of Birth",
        value: formatDateLabel(jobSeeker.dateOfBirth),
      },
      {
        label: "Gender",
        value: genderLabel(jobSeeker.gender),
        href: `${ROUTES.JOB_SEEKER_PROFILE}?tab=overview`,
      },
      {
        label: "Experience",
        value: experience,
        href: `${ROUTES.JOB_SEEKER_PROFILE}?tab=experience`,
      },
      {
        label: "Primary Skill / Job Role",
        value: jobSeeker.jobRole.trim() || "—",
        href: `${ROUTES.JOB_SEEKER_PROFILE}?tab=preferences`,
      },
      {
        label: "Preferred Job Type",
        value: jobTypeLabel(jobSeeker.jobType) || "—",
        href: `${ROUTES.JOB_SEEKER_PROFILE}?tab=preferences`,
      },
      {
        label: "Preferred Work Location",
        value: jobSeeker.preferredJobLocation.trim() || "—",
        href: `${ROUTES.JOB_SEEKER_PROFILE}?tab=preferences`,
      },
      {
        label: "Languages",
        value: languages,
        href: `${ROUTES.JOB_SEEKER_PROFILE}?tab=overview`,
      },
    ];
  }, [jobSeeker]);

  if (profileQuery.isLoading) {
    return <JobSeekerSettingsPageSkeleton />;
  }

  if (profileQuery.isError || !jobSeeker) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <p className="text-sm font-semibold text-foreground">
          Unable to load account settings
        </p>
        <button
          type="button"
          onClick={() => void profileQuery.refetch()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface hover:bg-primary-hover"
        >
          Retry
        </button>
      </div>
    );
  }

  const phone = formatWhatsappNumber(jobSeeker.whatsappNumber);
  const avatarUrl = resolveMediaUrl(jobSeeker.profilePhoto?.url ?? null);
  const lastLoginLabel = formatLastLogin(jobSeeker.lastLoginAt);

  let content: ReactNode = null;

  switch (activeSection) {
    case "account":
      content = (
        <AccountSettingsPanel
          jobSeekerId={jobSeeker.id}
          fullName={jobSeeker.fullName}
          phone={phone}
          avatarUrl={avatarUrl || null}
          avatarInitials={getInitials(jobSeeker.fullName)}
          isPhoneVerified={jobSeeker.isWhatsappVerified}
          lastLoginLabel={lastLoginLabel}
          profileCompletionPercent={profileCompletionPercent}
          onOpenSecurity={() => setActiveSection("security")}
          infoRows={infoRows}
        />
      );
      break;
    case "preferences":
      content = (
        <PreferencesSettingsPanel
          jobSeeker={jobSeeker}
          preferences={preferences}
          onPreferencesChange={setPreferences}
        />
      );
      break;
    case "security":
      content = (
        <PrivacySecurityPanel
          jobSeeker={jobSeeker}
          lastLoginLabel={lastLoginLabel}
          onDeactivate={() => setShowDeactivateModal(true)}
        />
      );
      break;
    case "notifications":
      content = <NotificationsSettingsPanel />;
      break;
    case "language":
      content = <LanguageSettingsPanel />;
      break;
    case "integrations":
      content = <ConnectedAppsPanel jobSeeker={jobSeeker} />;
      break;
    default:
      content = null;
  }

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <header className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-[1.875rem]">
            Settings
          </h1>
          <p className="mt-1.5 text-xs text-muted sm:text-sm">
            Manage your account, preferences and privacy settings
          </p>
        </header>

        <div className="mt-5 sm:mt-6">
          <SettingsNav
            items={JOB_SEEKER_SETTINGS_NAV_ITEMS}
            activeId={activeSection}
            onSelect={setActiveSection}
          />
        </div>

        <div className="mt-5 min-w-0 sm:mt-6">{content}</div>
      </div>

      {showDeactivateModal ? (
        <DeactivateAccountModal
          onClose={() => setShowDeactivateModal(false)}
        />
      ) : null}
    </>
  );
}
