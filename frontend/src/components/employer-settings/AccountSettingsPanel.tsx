"use client";

import { ProfileSummaryCard } from "@/components/employer-settings/ProfileSummaryCard";
import { SettingCard } from "@/components/employer-settings/SettingCard";
import { SecurityPanel } from "@/components/employer-settings/SecurityPanel";
import { ROUTES } from "@/constants/routes";
import { Bell, Briefcase, Building2, Users } from "lucide-react";

type AccountSettingsPanelProps = {
  displayName: string;
  roleLabel: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  avatarInitials: string;
  loginEmail: string;
  memberSinceLabel: string;
  lastLoginLabel: string;
  editHref: string;
  canEditProfile: boolean;
  principalType: "owner" | "member" | undefined;
  showCompanyQuickLink: boolean;
  showUserAccessQuickLink: boolean;
  showJobPreferencesQuickLink: boolean;
  onOpenNotifications: () => void;
  onOpenJobPreferences: () => void;
};

export function AccountSettingsPanel({
  displayName,
  roleLabel,
  email,
  phone,
  avatarUrl,
  avatarInitials,
  loginEmail,
  memberSinceLabel,
  lastLoginLabel,
  editHref,
  canEditProfile,
  principalType,
  showCompanyQuickLink,
  showUserAccessQuickLink,
  showJobPreferencesQuickLink,
  onOpenNotifications,
  onOpenJobPreferences,
}: AccountSettingsPanelProps) {
  return (
    <div className="space-y-4">
      <ProfileSummaryCard
        displayName={displayName}
        roleLabel={roleLabel}
        email={email}
        phone={phone}
        avatarUrl={avatarUrl}
        avatarInitials={avatarInitials}
        editHref={editHref}
        canEdit={canEditProfile}
        details={[
          { label: "Login Email", value: loginEmail || "—" },
          { label: "Current Plan", value: "Not available" },
          { label: "Member Since", value: memberSinceLabel },
          { label: "Last Login", value: lastLoginLabel },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {showCompanyQuickLink ? (
          <SettingCard
            title="Company Settings"
            description="Update company profile"
            icon={Building2}
            href={ROUTES.EMPLOYER_COMPANY_PROFILE}
            iconClassName="bg-primary-light text-primary"
          />
        ) : null}
        {showUserAccessQuickLink ? (
          <SettingCard
            title="User & Access"
            description="Roles and permissions"
            icon={Users}
            href={ROUTES.EMPLOYER_TEAM_MANAGEMENT}
            iconClassName="bg-resource-resume-icon-surface text-resource-resume-icon"
          />
        ) : null}
        <SettingCard
          title="Notifications"
          description="Inbox and retention"
          icon={Bell}
          onClick={onOpenNotifications}
          iconClassName="bg-benefit-voice-surface text-benefit-voice-icon"
        />
        {showJobPreferencesQuickLink ? (
          <SettingCard
            title="Job Preferences"
            description="Jobs workspace"
            icon={Briefcase}
            onClick={onOpenJobPreferences}
            iconClassName="bg-benefit-verified-surface text-benefit-verified-icon"
          />
        ) : null}
      </div>

      <SecurityPanel principalType={principalType} roleLabel={roleLabel} />
    </div>
  );
}
