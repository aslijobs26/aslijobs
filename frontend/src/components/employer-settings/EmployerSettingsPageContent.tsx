"use client";

import { AccountSettingsPanel } from "@/components/employer-settings/AccountSettingsPanel";
import { ActivityLogsPanel } from "@/components/employer-settings/ActivityLogsPanel";
import { ApplicationSettingsPanel } from "@/components/employer-settings/ApplicationSettingsPanel";
import { BillingPanel } from "@/components/employer-settings/BillingPanel";
import { CompanySettingsPanel } from "@/components/employer-settings/CompanySettingsPanel";
import { DataPrivacyPanel } from "@/components/employer-settings/DataPrivacyPanel";
import { IntegrationsPanel } from "@/components/employer-settings/IntegrationsPanel";
import { JobPreferencesPanel } from "@/components/employer-settings/JobPreferencesPanel";
import { NotificationsSettingsPanel } from "@/components/employer-settings/NotificationsSettingsPanel";
import { SecurityPanel } from "@/components/employer-settings/SecurityPanel";
import { SettingsNav } from "@/components/employer-settings/SettingsNav";
import { UserAccessSettingsPanel } from "@/components/employer-settings/UserAccessSettingsPanel";
import {
  EMPLOYER_SETTINGS_DEFAULT_SECTION,
  EMPLOYER_SETTINGS_NAV_ITEMS,
  type EmployerSettingsSectionId,
} from "@/constants/employer-settings";
import { ROUTES } from "@/constants/routes";
import { useEmployerProfile } from "@/hooks/useEmployerProfile";
import { useCan } from "@/providers/employer-permission-provider";
import { resolveMediaUrl } from "@/utils/resolve-media-url";
import { getInitials } from "@/utils/employer-team";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, type ReactNode } from "react";

function isSettingsSectionId(value: string): value is EmployerSettingsSectionId {
  return EMPLOYER_SETTINGS_NAV_ITEMS.some((item) => item.id === value);
}

function formatMemberSince(value: string | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
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

export function EmployerSettingsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can, canField, session, isLoading: permissionsLoading } = useCan();
  const employerProfileQuery = useEmployerProfile();
  const employer = employerProfileQuery.data;

  const visibleNavItems = useMemo(() => {
    return EMPLOYER_SETTINGS_NAV_ITEMS.filter((item) => {
      if (item.permissionModule && !can(item.permissionModule, "read")) {
        return false;
      }
      if (
        item.settingsFieldKey &&
        !canField("settings", item.settingsFieldKey)
      ) {
        return false;
      }
      return true;
    });
  }, [can, canField]);

  const requestedSection = searchParams.get("section")?.trim() ?? "";
  const activeSection: EmployerSettingsSectionId = useMemo(() => {
    if (isSettingsSectionId(requestedSection)) {
      const allowed = visibleNavItems.some(
        (item) => item.id === requestedSection,
      );
      if (allowed) {
        return requestedSection;
      }
    }
    return visibleNavItems[0]?.id ?? EMPLOYER_SETTINGS_DEFAULT_SECTION;
  }, [requestedSection, visibleNavItems]);

  const setActiveSection = useCallback(
    (sectionId: EmployerSettingsSectionId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (sectionId === EMPLOYER_SETTINGS_DEFAULT_SECTION) {
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

  const displayName = useMemo(() => {
    if (!employer) {
      return "Employer";
    }
    const personName = `${employer.firstName} ${employer.lastName}`.trim();
    if (personName) {
      return personName;
    }
    if (employer.accountType === "individual") {
      return employer.establishmentName.trim() || "Employer";
    }
    return employer.companyName.trim() || "Employer";
  }, [employer]);

  const roleLabel = useMemo(() => {
    if (session?.principalType === "member" && session.actor?.roleName) {
      return session.actor.roleName;
    }
    if (session?.isSuperAdmin || session?.principalType === "owner") {
      return "Primary Admin";
    }
    return session?.roleName?.trim() || "Employer";
  }, [session]);

  const email =
    session?.actor?.email?.trim() || employer?.emailAddress?.trim() || "";
  const phone =
    employer?.whatsappNumber?.trim() ||
    employer?.alternatePhone?.trim() ||
    "";
  const avatarUrl = resolveMediaUrl(
    employer?.profilePhoto?.url ?? employer?.companyLogo?.url ?? null,
  );
  const editHref =
    session?.principalType === "member"
      ? ROUTES.EMPLOYER_TEAM_MEMBER_PROFILE
      : ROUTES.EMPLOYER_COMPANY_PROFILE;

  const canEditProfile =
    session?.principalType === "member"
      ? true
      : can("company_profile", "update");

  if (permissionsLoading || employerProfileQuery.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-muted">Loading settings...</p>
      </div>
    );
  }

  if (employerProfileQuery.isError || !employer) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <p className="text-sm font-semibold text-foreground">
          Unable to load account settings
        </p>
        <button
          type="button"
          onClick={() => void employerProfileQuery.refetch()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface hover:bg-primary-hover"
        >
          Retry
        </button>
      </div>
    );
  }

  let content: ReactNode = null;

  switch (activeSection) {
    case "account":
      content = (
        <AccountSettingsPanel
          displayName={displayName}
          roleLabel={roleLabel}
          email={email}
          phone={phone}
          avatarUrl={avatarUrl || null}
          avatarInitials={getInitials(displayName)}
          loginEmail={email}
          memberSinceLabel={formatMemberSince(employer.createdAt)}
          lastLoginLabel={formatLastLogin(
            session?.actor?.lastActiveAt ?? employer.lastLoginAt,
          )}
          editHref={editHref}
          canEditProfile={canEditProfile}
          principalType={session?.principalType}
          showCompanyQuickLink={can("company_profile", "read")}
          showUserAccessQuickLink={can("team_management", "read")}
          showJobPreferencesQuickLink={can("jobs", "read")}
          onOpenNotifications={() => setActiveSection("notifications")}
          onOpenJobPreferences={() => setActiveSection("job-preferences")}
        />
      );
      break;
    case "company":
      content = (
        <CompanySettingsPanel
          employer={employer}
          canUpdate={can("company_profile", "update")}
        />
      );
      break;
    case "user-access":
      content = (
        <UserAccessSettingsPanel
          canInvite={can("team_management", "create")}
        />
      );
      break;
    case "notifications":
      content = <NotificationsSettingsPanel recipientScope="employer" />;
      break;
    case "job-preferences":
      content = (
        <JobPreferencesPanel canCreateJob={can("jobs", "create")} />
      );
      break;
    case "application":
      content = <ApplicationSettingsPanel />;
      break;
    case "integrations":
      content = <IntegrationsPanel />;
      break;
    case "billing":
      content = <BillingPanel />;
      break;
    case "security":
      content = (
        <SecurityPanel
          principalType={session?.principalType}
          roleLabel={roleLabel}
        />
      );
      break;
    case "data-privacy":
      content = <DataPrivacyPanel />;
      break;
    case "activity-logs":
      content = <ActivityLogsPanel />;
      break;
    default:
      content = null;
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(16rem,18.5rem)_minmax(0,1fr)] xl:grid-cols-[minmax(17rem,20rem)_minmax(0,1fr)]">
        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <SettingsNav
            items={visibleNavItems}
            activeId={activeSection}
            onSelect={setActiveSection}
          />
        </aside>
        <div className="min-w-0">{content}</div>
      </div>
    </div>
  );
}
