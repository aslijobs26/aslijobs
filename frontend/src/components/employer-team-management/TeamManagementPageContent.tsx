"use client";

import { DepartmentsTabPanel } from "@/components/employer-team-management/DepartmentsTabPanel";
import { InviteMemberModal } from "@/components/employer-team-management/InviteMemberModal";
import { MembersTabPanel } from "@/components/employer-team-management/MembersTabPanel";
import { RolesTabPanel } from "@/components/employer-team-management/RolesTabPanel";
import { TeamManagementStatsCards } from "@/components/employer-team-management/TeamManagementStatsCards";
import { TeamManagementTabs } from "@/components/employer-team-management/TeamManagementTabs";
import { Can } from "@/components/rbac/Can";
import {
  EMPLOYER_TEAM_DEFAULT_TAB,
  EMPLOYER_TEAM_PAGE_SUBTITLE,
  EMPLOYER_TEAM_PAGE_TITLE,
  EMPLOYER_TEAM_QUERY_KEYS,
  type EmployerTeamTabId,
} from "@/constants/employer-team-management";
import { inviteTeamMember, fetchTeamStats } from "@/services/employer-team.service";
import type { InviteMemberPayload } from "@/types/employer-team";
import { getTeamApiErrorMessage } from "@/utils/employer-team";
import { invalidateEmployerAccessCaches } from "@/utils/employer-rbac-cache";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, TableProperties } from "lucide-react";
import { useState } from "react";

export function TeamManagementPageContent() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<EmployerTeamTabId>(
    EMPLOYER_TEAM_DEFAULT_TAB,
  );
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteNotice, setInviteNotice] = useState<string | null>(null);

  const statsQuery = useQuery({
    queryKey: EMPLOYER_TEAM_QUERY_KEYS.stats(),
    queryFn: fetchTeamStats,
    staleTime: 30_000,
  });

  const inviteMutation = useMutation({
    mutationFn: inviteTeamMember,
    onSuccess: async (result) => {
      setInviteError(null);
      setInviteOpen(false);
      await invalidateEmployerAccessCaches(queryClient);
      if (!result.emailDelivered) {
        setInviteNotice(
          result.message ||
            result.emailError ||
            "Invitation created but email delivery failed. Use Resend Invitation after email is configured.",
        );
        return;
      }
      setInviteNotice(null);
    },
    onError: (error) => setInviteError(getTeamApiErrorMessage(error)),
  });

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pt-5 pb-[calc(5.875rem+env(safe-area-inset-bottom)+0.75rem)] sm:gap-5 sm:px-6 sm:pt-6 md:pb-6 lg:px-8 lg:pb-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-2xl">
            {EMPLOYER_TEAM_PAGE_TITLE}
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-[0.9375rem]">
            {EMPLOYER_TEAM_PAGE_SUBTITLE}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 sm:shrink-0">
          <Can module="team_management" action="read">
            <button
              type="button"
              onClick={() => setActiveTab("roles")}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-surface px-3 text-xs font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
            >
              <TableProperties
                className="size-3.5 sm:size-4"
                aria-hidden="true"
              />
              Permission Matrix
            </button>
          </Can>
          <Can module="team_management" action="create">
            <button
              type="button"
              onClick={() => {
                setInviteError(null);
                setInviteOpen(true);
              }}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
            >
              <Plus
                className="size-3.5 sm:size-4"
                aria-hidden="true"
                strokeWidth={2.5}
              />
              Invite Member
            </button>
          </Can>
        </div>
      </header>

      <TeamManagementStatsCards
        stats={statsQuery.data}
        isLoading={statsQuery.isLoading}
      />

      {inviteNotice ? (
        <p
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 sm:text-sm"
        >
          {inviteNotice}
        </p>
      ) : null}
      <div className="space-y-4">
        <TeamManagementTabs activeTab={activeTab} onChange={setActiveTab} />

        <div
          role="tabpanel"
          aria-labelledby={`team-tab-${activeTab}`}
          className="min-w-0"
        >
          {activeTab === "departments" ? (
            <div className="rounded-xl border border-border-subtle bg-surface p-3 shadow-sm sm:p-4 lg:p-5">
              <DepartmentsTabPanel />
            </div>
          ) : null}
          {activeTab === "members" ? (
            <div className="rounded-xl border border-border-subtle bg-surface p-3 shadow-sm sm:p-4 lg:p-5">
              <MembersTabPanel onOpenRoles={() => setActiveTab("roles")} />
            </div>
          ) : null}
          {activeTab === "roles" ? (
            <RolesTabPanel
              onNavigateToDepartments={() => setActiveTab("departments")}
            />
          ) : null}
        </div>
      </div>

      {inviteOpen ? (
        <InviteMemberModal
          mode="invite"
          isSubmitting={inviteMutation.isPending}
          errorMessage={inviteError}
          onClose={() => {
            if (inviteMutation.isPending) return;
            setInviteOpen(false);
            setInviteError(null);
          }}
          onSubmitInvite={(payload: InviteMemberPayload) => {
            inviteMutation.mutate(payload);
          }}
          onSubmitEdit={() => undefined}
        />
      ) : null}
    </div>
  );
}
