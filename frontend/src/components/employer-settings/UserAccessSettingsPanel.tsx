"use client";

import { SettingCard } from "@/components/employer-settings/SettingCard";
import { SettingsSection } from "@/components/employer-settings/SettingsSection";
import { TeamManagementStatsCards } from "@/components/employer-team-management/TeamManagementStatsCards";
import { EMPLOYER_TEAM_QUERY_KEYS } from "@/constants/employer-team-management";
import { ROUTES } from "@/constants/routes";
import { fetchTeamStats } from "@/services/employer-team.service";
import { useQuery } from "@tanstack/react-query";
import { Building2, Shield, UserPlus, Users } from "lucide-react";
import Link from "next/link";

type UserAccessSettingsPanelProps = {
  canInvite: boolean;
};

export function UserAccessSettingsPanel({
  canInvite,
}: UserAccessSettingsPanelProps) {
  const statsQuery = useQuery({
    queryKey: EMPLOYER_TEAM_QUERY_KEYS.stats(),
    queryFn: fetchTeamStats,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="space-y-4">
      <SettingsSection
        title="User & Access"
        description="Team members, roles, departments, and permissions are managed in Team Management."
        action={
          <Link
            href={ROUTES.EMPLOYER_TEAM_MANAGEMENT}
            className="inline-flex min-h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-xs font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-9 sm:px-3 sm:text-sm"
          >
            Open Team Management
          </Link>
        }
      >
        <TeamManagementStatsCards
          stats={statsQuery.data}
          isLoading={statsQuery.isLoading}
        />
      </SettingsSection>

      <div className="grid gap-3 sm:grid-cols-2">
        <SettingCard
          title="Team Members"
          description="Invites, active members, and status"
          icon={Users}
          href={ROUTES.EMPLOYER_TEAM_MANAGEMENT}
        />
        <SettingCard
          title="Roles & Permissions"
          description="Module and field-level access"
          icon={Shield}
          href={ROUTES.EMPLOYER_TEAM_MANAGEMENT}
        />
        <SettingCard
          title="Departments"
          description="Structure and department heads"
          icon={Building2}
          href={ROUTES.EMPLOYER_TEAM_MANAGEMENT}
        />
        {canInvite ? (
          <SettingCard
            title="Invite Members"
            description="Send a new team invitation"
            icon={UserPlus}
            href={ROUTES.EMPLOYER_TEAM_MANAGEMENT}
          />
        ) : null}
      </div>
    </div>
  );
}
