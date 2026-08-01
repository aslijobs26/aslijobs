"use client";

import { InviteMemberModal } from "@/components/employer-team-management/InviteMemberModal";
import { MembersTable } from "@/components/employer-team-management/MembersTable";
import { TeamMembersSidebar } from "@/components/employer-team-management/TeamMembersSidebar";
import { DepartmentsPagination } from "@/components/employer-team-management/DepartmentsPagination";
import { EmployerProfileDialog } from "@/components/employer-profile/EmployerProfileDialog";
import {
  EMPLOYER_TEAM_DEFAULT_PAGE_SIZE,
  EMPLOYER_TEAM_QUERY_KEYS,
  EMPLOYER_TEAM_SEARCH_DEBOUNCE_MS,
} from "@/constants/employer-team-management";
import { useEmployerProfile } from "@/hooks/useEmployerProfile";
import {
  activateTeamMember,
  cancelTeamInvitation,
  deactivateTeamMember,
  fetchDepartments,
  fetchTeamMembers,
  fetchTeamRoles,
  inviteTeamMember,
  removeTeamMember,
  resendTeamInvitation,
  updateTeamMember,
} from "@/services/employer-team.service";
import type {
  InviteMemberPayload,
  TeamMemberListItem,
  TeamMemberStatus,
  UpdateMemberPayload,
} from "@/types/employer-team";
import { getTeamApiErrorMessage } from "@/utils/employer-team";
import { invalidateEmployerAccessCaches } from "@/utils/employer-rbac-cache";
import { useCan } from "@/providers/employer-permission-provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Filter, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type MemberFilters = {
  departmentId: string;
  roleId: string;
  status?: TeamMemberStatus;
};

const DEFAULT_FILTERS: MemberFilters = {
  departmentId: "",
  roleId: "",
  status: undefined,
};

type MembersTabPanelProps = {
  onOpenRoles?: () => void;
};

export function MembersTabPanel({ onOpenRoles }: MembersTabPanelProps) {
  const queryClient = useQueryClient();
  const { can } = useCan();
  const canCreateMember = can("team_management", "create");
  const employerProfileQuery = useEmployerProfile();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(EMPLOYER_TEAM_DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState<MemberFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"invite" | "edit" | null>(null);
  const [editing, setEditing] = useState<TeamMemberListItem | null>(null);
  const [invitePrefill, setInvitePrefill] = useState<{
    email?: string;
    roleId?: string;
    departmentId?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<TeamMemberListItem | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const isFirstSearchDebounce = useRef(true);

  useEffect(() => {
    if (isFirstSearchDebounce.current) {
      isFirstSearchDebounce.current = false;
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, EMPLOYER_TEAM_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const listParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      departmentId: filters.departmentId || undefined,
      roleId: filters.roleId || undefined,
      status: filters.status,
      page,
      limit,
      sort: "joined_newest" as const,
    }),
    [debouncedSearch, filters, page, limit],
  );

  const membersQuery = useQuery({
    queryKey: EMPLOYER_TEAM_QUERY_KEYS.members(listParams),
    queryFn: () => fetchTeamMembers(listParams),
    placeholderData: (previous) => previous,
  });

  const departmentsQuery = useQuery({
    queryKey: EMPLOYER_TEAM_QUERY_KEYS.departments({
      status: "active",
      limit: 100,
      page: 1,
    }),
    queryFn: () => fetchDepartments({ status: "active", limit: 100, page: 1 }),
    staleTime: 30_000,
  });

  const rolesQuery = useQuery({
    queryKey: EMPLOYER_TEAM_QUERY_KEYS.roles(),
    queryFn: fetchTeamRoles,
    staleTime: 30_000,
  });

  const invalidateAll = async () => {
    await invalidateEmployerAccessCaches(queryClient);
  };

  const inviteMutation = useMutation({
    mutationFn: inviteTeamMember,
    onSuccess: async (result) => {
      setModalMode(null);
      setInvitePrefill({});
      await invalidateAll();
      if (!result.emailDelivered) {
        setActionError(
          result.message ||
            result.emailError ||
            "Invitation created but email delivery failed. Use Resend Invitation after email is configured.",
        );
        return;
      }
      setFormError(null);
      setActionError(null);
    },
    onError: (error) => setFormError(getTeamApiErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateMemberPayload;
    }) => updateTeamMember(id, payload),
    onSuccess: async () => {
      setFormError(null);
      setModalMode(null);
      setEditing(null);
      await invalidateAll();
    },
    onError: (error) => setFormError(getTeamApiErrorMessage(error)),
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      type,
      member,
    }: {
      type: "activate" | "deactivate" | "resend" | "cancel" | "remove";
      member: TeamMemberListItem;
    }) => {
      if (type === "activate") return activateTeamMember(member.id);
      if (type === "deactivate") return deactivateTeamMember(member.id);
      if (type === "resend") return resendTeamInvitation(member.id);
      if (type === "cancel") return cancelTeamInvitation(member.id);
      return removeTeamMember(member.id);
    },
    onSuccess: async (result, variables) => {
      setConfirmRemove(null);
      await invalidateAll();
      if (
        variables.type === "resend" &&
        result &&
        typeof result === "object" &&
        "emailDelivered" in result &&
        result.emailDelivered === false
      ) {
        const resendResult = result as {
          emailDelivered: boolean;
          emailError: string | null;
          message: string;
        };
        setActionError(
          resendResult.message ||
            resendResult.emailError ||
            "Invitation updated but email delivery failed.",
        );
        return;
      }
      setActionError(null);
    },
    onError: (error) => setActionError(getTeamApiErrorMessage(error)),
  });

  const pagination = membersQuery.data?.pagination;
  const activeFilterCount =
    (filters.departmentId ? 1 : 0) +
    (filters.roleId ? 1 : 0) +
    (filters.status ? 1 : 0);

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(16rem,1fr)]">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search members</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by name, email or role..."
                className="h-10 w-full rounded-xl border border-border-subtle bg-surface pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <button
              type="button"
              onClick={() => setFiltersOpen((current) => !current)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 text-sm font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Filter className="size-4" aria-hidden="true" />
              Filter
              {activeFilterCount > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.6875rem] font-bold text-surface">
                  {activeFilterCount}
                </span>
              ) : (
                <ChevronDown className="size-3.5 text-muted" aria-hidden="true" />
              )}
            </button>
          </div>
          {canCreateMember ? (
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setEditing(null);
                setInvitePrefill({});
                setModalMode("invite");
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Plus className="size-4" aria-hidden="true" strokeWidth={2.5} />
              Invite Member
            </button>
          ) : null}
        </div>

        {filtersOpen ? (
          <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Filters</h3>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-primary-light"
                aria-label="Close filters"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Department</span>
                <select
                  value={filters.departmentId}
                  onChange={(event) => {
                    setFilters((current) => ({
                      ...current,
                      departmentId: event.target.value,
                    }));
                    setPage(1);
                  }}
                  className="h-10 w-full rounded-lg border border-border-subtle px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All</option>
                  {(departmentsQuery.data?.departments ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Role</span>
                <select
                  value={filters.roleId}
                  onChange={(event) => {
                    setFilters((current) => ({
                      ...current,
                      roleId: event.target.value,
                    }));
                    setPage(1);
                  }}
                  className="h-10 w-full rounded-lg border border-border-subtle px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All</option>
                  {(rolesQuery.data ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Status</span>
                <select
                  value={filters.status ?? ""}
                  onChange={(event) => {
                    setFilters((current) => ({
                      ...current,
                      status: (event.target.value || undefined) as
                        | TeamMemberStatus
                        | undefined,
                    }));
                    setPage(1);
                  }}
                  className="h-10 w-full rounded-lg border border-border-subtle px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="invited">Invited</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={() => {
                setFilters(DEFAULT_FILTERS);
                setPage(1);
              }}
              className="mt-3 text-sm font-semibold text-primary"
            >
              Clear filters
            </button>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
          <MembersTable
            members={membersQuery.data?.members ?? []}
            currentUserEmail={employerProfileQuery.data?.emailAddress}
            isLoading={membersQuery.isLoading}
            isError={membersQuery.isError}
            onRetry={() => {
              void membersQuery.refetch();
            }}
            onEdit={(member) => {
              setFormError(null);
              setEditing(member);
              setModalMode("edit");
            }}
            onActivate={(member) =>
              actionMutation.mutate({ type: "activate", member })
            }
            onDeactivate={(member) =>
              actionMutation.mutate({ type: "deactivate", member })
            }
            onResend={(member) =>
              actionMutation.mutate({ type: "resend", member })
            }
            onCancelInvite={(member) =>
              actionMutation.mutate({ type: "cancel", member })
            }
            onRemove={(member) => {
              setActionError(null);
              setConfirmRemove(member);
            }}
          />
          {pagination ? (
            <DepartmentsPagination
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              isLoading={membersQuery.isFetching}
              entityLabel="members"
              onPageChange={setPage}
              onLimitChange={(next) => {
                setLimit(next);
                setPage(1);
              }}
            />
          ) : null}
        </div>
      </div>

      <div className="min-w-0">
        <TeamMembersSidebar
          onInvite={(prefill) => {
            setFormError(null);
            setEditing(null);
            setInvitePrefill(prefill ?? {});
            setModalMode("invite");
          }}
          onOpenRoles={() => onOpenRoles?.()}
        />
      </div>

      {modalMode ? (
        <InviteMemberModal
          mode={modalMode}
          member={editing}
          initialEmail={invitePrefill.email}
          initialRoleId={invitePrefill.roleId}
          initialDepartmentId={invitePrefill.departmentId}
          isSubmitting={inviteMutation.isPending || updateMutation.isPending}
          errorMessage={formError}
          onClose={() => {
            if (inviteMutation.isPending || updateMutation.isPending) return;
            setModalMode(null);
            setEditing(null);
            setFormError(null);
          }}
          onSubmitInvite={(payload: InviteMemberPayload) => {
            inviteMutation.mutate(payload);
          }}
          onSubmitEdit={(payload) => {
            if (!editing) return;
            updateMutation.mutate({ id: editing.id, payload });
          }}
        />
      ) : null}

      {confirmRemove ? (
        <EmployerProfileDialog
          title="Remove team member"
          description={`${confirmRemove.fullName} will be removed from your organization.`}
          onClose={() => {
            if (actionMutation.isPending) return;
            setConfirmRemove(null);
            setActionError(null);
          }}
          footer={
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmRemove(null)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border-subtle px-4 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  actionMutation.mutate({
                    type: "remove",
                    member: confirmRemove,
                  })
                }
                disabled={actionMutation.isPending}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionMutation.isPending ? "Removing…" : "Remove"}
              </button>
            </div>
          }
        >
          {actionError ? (
            <p role="alert" className="text-sm text-red-700">
              {actionError}
            </p>
          ) : (
            <p className="text-sm text-muted">
              This soft-deletes the member and clears department head assignment
              if applicable.
            </p>
          )}
        </EmployerProfileDialog>
      ) : null}
    </div>
  );
}
