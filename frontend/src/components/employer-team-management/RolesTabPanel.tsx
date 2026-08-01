"use client";

import { DepartmentFormModal } from "@/components/employer-team-management/DepartmentFormModal";
import { DepartmentsPagination } from "@/components/employer-team-management/DepartmentsPagination";
import { EmployerProfileDialog } from "@/components/employer-profile/EmployerProfileDialog";
import {
  FieldAccessMatrix,
  fieldAccessMapsEqual,
  hydrateFieldAccessDraft,
} from "@/components/employer-team-management/FieldAccessMatrix";
import { RoleFormModal } from "@/components/employer-team-management/RoleFormModal";
import { RolePermissionMatrix } from "@/components/employer-team-management/RolePermissionMatrix";
import { RolesTable } from "@/components/employer-team-management/RolesTable";
import type { RoleFieldAccessMap } from "@/constants/employer-field-access";
import {
  DEPARTMENT_COLOR_ICON_WRAP,
  EMPLOYER_TEAM_DEFAULT_PAGE_SIZE,
  EMPLOYER_TEAM_QUERY_KEYS,
  EMPLOYER_TEAM_SEARCH_DEBOUNCE_MS,
  ACCESS_LEVEL_LABELS,
} from "@/constants/employer-team-management";
import { ROUTES } from "@/constants/routes";
import { useCan } from "@/providers/employer-permission-provider";
import {
  activateRole,
  archiveRole,
  createDepartment,
  createRole,
  deactivateRole,
  deleteRole,
  duplicateRole,
  fetchDepartments,
  fetchManagedRoles,
  fetchRoleDetails,
  updateRole,
  updateRolePermissions,
} from "@/services/employer-team.service";
import type {
  CreateDepartmentPayload,
  CreateRolePayload,
  RolePermissionsMatrix,
  TeamAccessLevel,
  TeamRoleListItem,
  TeamRoleStatus,
} from "@/types/employer-team";
import { cn } from "@/utils/cn";
import { getTeamApiErrorMessage } from "@/utils/employer-team";
import { invalidateEmployerAccessCaches } from "@/utils/employer-rbac-cache";
import {
  createPermissionsForAccessLevel,
  normalizeFieldAccessForSave,
  normalizePermissionsForSave,
} from "@/utils/employer-team-permissions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Briefcase,
  Building2,
  ChevronRight,
  Headphones,
  Info,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Settings,
  Shield,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type RoleFiltersState = {
  status?: TeamRoleStatus;
  roleType?: "system" | "custom";
  accessLevel?: TeamAccessLevel;
};

const DEFAULT_FILTERS: RoleFiltersState = {};

const DEPARTMENT_ICON_MAP: Record<string, LucideIcon> = {
  building: Building2,
  users: Users,
  briefcase: Briefcase,
  headphones: Headphones,
  wallet: Wallet,
  megaphone: Megaphone,
  settings: Settings,
  shield: Shield,
};

type RolesTabPanelProps = {
  onNavigateToDepartments?: () => void;
};

export function RolesTabPanel({
  onNavigateToDepartments,
}: RolesTabPanelProps) {
  const queryClient = useQueryClient();
  const { can } = useCan();
  const canCreateRole = can("team_management", "create");
  const canUpdateRole = can("team_management", "update");
  const canDeleteRole = can("team_management", "delete");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(EMPLOYER_TEAM_DEFAULT_PAGE_SIZE);
  const [filters] = useState<RoleFiltersState>(DEFAULT_FILTERS);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [matrixDraft, setMatrixDraft] = useState<RolePermissionsMatrix | null>(
    null,
  );
  const [fieldAccessDraft, setFieldAccessDraft] =
    useState<RoleFieldAccessMap | null>(null);
  const [matrixEditing, setMatrixEditing] = useState(false);
  const [matrixTab, setMatrixTab] = useState<"module" | "field">("module");
  const [unsavedConfirm, setUnsavedConfirm] = useState<{
    kind: "tab" | "role";
    nextTab?: "module" | "field";
    nextRoleId?: string | null;
  } | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<TeamRoleListItem | null>(null);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [departmentFormError, setDepartmentFormError] = useState<string | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "archive" | "deactivate" | "delete" | "duplicate";
    role: TeamRoleListItem;
  } | null>(null);
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
      status: filters.status,
      roleType: filters.roleType,
      accessLevel: filters.accessLevel,
      page,
      limit,
      sort: "name_asc" as const,
    }),
    [debouncedSearch, filters, page, limit],
  );

  const rolesQuery = useQuery({
    queryKey: EMPLOYER_TEAM_QUERY_KEYS.rolesManage(listParams),
    queryFn: () => fetchManagedRoles(listParams),
    placeholderData: (previous) => previous,
  });

  const departmentsQuery = useQuery({
    queryKey: EMPLOYER_TEAM_QUERY_KEYS.departments({
      status: "active",
      limit: 20,
      page: 1,
      sort: "name_asc",
    }),
    queryFn: () =>
      fetchDepartments({
        status: "active",
        limit: 20,
        page: 1,
        sort: "name_asc",
      }),
    staleTime: 30_000,
  });

  const roles = rolesQuery.data?.roles ?? [];

  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles[0]!.id);
    }
  }, [roles, selectedRoleId]);

  const detailsQuery = useQuery({
    queryKey: EMPLOYER_TEAM_QUERY_KEYS.roleDetails(selectedRoleId ?? ""),
    queryFn: () => fetchRoleDetails(selectedRoleId!),
    enabled: Boolean(selectedRoleId),
  });

  useEffect(() => {
    if (detailsQuery.data && !matrixEditing) {
      setMatrixDraft(detailsQuery.data.permissions);
      setFieldAccessDraft(
        hydrateFieldAccessDraft(detailsQuery.data.fieldAccess),
      );
    }
  }, [detailsQuery.data, matrixEditing]);

  const isFieldDirty = useMemo(() => {
    if (!matrixEditing || !fieldAccessDraft || !detailsQuery.data) {
      return false;
    }
    return !fieldAccessMapsEqual(
      fieldAccessDraft,
      hydrateFieldAccessDraft(detailsQuery.data.fieldAccess),
    );
  }, [detailsQuery.data, fieldAccessDraft, matrixEditing]);

  const isModuleDirty = useMemo(() => {
    if (!matrixEditing || !matrixDraft || !detailsQuery.data) {
      return false;
    }
    return (
      JSON.stringify(matrixDraft) !==
      JSON.stringify(detailsQuery.data.permissions)
    );
  }, [detailsQuery.data, matrixDraft, matrixEditing]);

  const isMatrixDirty = isFieldDirty || isModuleDirty;

  const discardMatrixEdits = () => {
    setMatrixDraft(
      detailsQuery.data?.permissions ??
        createPermissionsForAccessLevel("limited"),
    );
    setFieldAccessDraft(
      hydrateFieldAccessDraft(detailsQuery.data?.fieldAccess ?? null),
    );
    setMatrixEditing(false);
    setUnsavedConfirm(null);
  };

  const requestRoleChange = (nextRoleId: string | null) => {
    if (isMatrixDirty) {
      setUnsavedConfirm({ kind: "role", nextRoleId });
      return;
    }
    setSelectedRoleId(nextRoleId);
    setMatrixEditing(false);
  };

  const requestTabChange = (nextTab: "module" | "field") => {
    if (isMatrixDirty && nextTab !== matrixTab) {
      setUnsavedConfirm({ kind: "tab", nextTab });
      return;
    }
    setMatrixTab(nextTab);
  };

  const invalidateTeamQueries = async () => {
    await invalidateEmployerAccessCaches(queryClient);
  };

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: async (created) => {
      setFormError(null);
      setModalMode(null);
      setSelectedRoleId(created.id);
      await invalidateTeamQueries();
    },
    onError: (error) => setFormError(getTeamApiErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CreateRolePayload;
    }) => updateRole(id, payload),
    onSuccess: async () => {
      setFormError(null);
      setModalMode(null);
      setEditing(null);
      await invalidateTeamQueries();
    },
    onError: (error) => setFormError(getTeamApiErrorMessage(error)),
  });

  const createDepartmentMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: async () => {
      setDepartmentFormError(null);
      setDepartmentModalOpen(false);
      await invalidateTeamQueries();
    },
    onError: (error) => setDepartmentFormError(getTeamApiErrorMessage(error)),
  });

  const permissionsMutation = useMutation({
    mutationFn: () => {
      const payload = {
        permissions: normalizePermissionsForSave(matrixDraft),
        fieldAccess: normalizeFieldAccessForSave(fieldAccessDraft),
      };
      return updateRolePermissions(selectedRoleId!, payload);
    },
    onSuccess: async () => {
      setMatrixEditing(false);
      setActionError(null);
      setUnsavedConfirm(null);
      await invalidateTeamQueries();
    },
    onError: (error) => setActionError(getTeamApiErrorMessage(error)),
  });

  const runRoleAction = useMutation({
    mutationFn: async (action: {
      type: "archive" | "deactivate" | "delete" | "duplicate";
      role: TeamRoleListItem;
    }) => {
      const { type, role } = action;
      if (type === "archive") return archiveRole(role.id);
      if (type === "deactivate") return deactivateRole(role.id);
      if (type === "duplicate") return duplicateRole(role.id);
      return deleteRole(role.id);
    },
    onSuccess: async (_result, action) => {
      if (action.type === "delete" && selectedRoleId === action.role.id) {
        setSelectedRoleId(null);
      }
      setConfirmAction(null);
      setActionError(null);
      await invalidateTeamQueries();
    },
    onError: (error) => setActionError(getTeamApiErrorMessage(error)),
  });

  const activateMutation = useMutation({
    mutationFn: (roleId: string) => activateRole(roleId),
    onSuccess: async () => {
      setActionError(null);
      await invalidateTeamQueries();
    },
    onError: (error) => setActionError(getTeamApiErrorMessage(error)),
  });

  const departments = departmentsQuery.data?.departments ?? [];

  return (
    <div className="space-y-4">
      {actionError ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {actionError}
        </p>
      ) : null}

      <div className="grid items-stretch gap-4 xl:grid-cols-[14rem_minmax(0,1fr)_minmax(18rem,22rem)]">
        {/* Departments column */}
        <aside className="flex flex-col rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-foreground">
                Departments
              </h3>
              <p className="mt-0.5 text-xs leading-snug text-muted">
                Organize your team into departments.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDepartmentFormError(null);
                setDepartmentModalOpen(true);
              }}
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-2.5 text-xs font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Plus className="size-3.5 shrink-0" aria-hidden="true" />
              Add Department
            </button>
          </div>

          <ul className="flex-1 space-y-2">
            {departments.slice(0, 6).map((department) => {
              const colorKey =
                department.color && department.color in DEPARTMENT_COLOR_ICON_WRAP
                  ? department.color
                  : "primary";
              const DeptIcon =
                DEPARTMENT_ICON_MAP[department.icon || "building"] ?? Building2;
              return (
                <li key={department.id}>
                  <Link
                    href={ROUTES.employerTeamDepartment(department.id)}
                    className="flex items-center gap-2.5 rounded-xl border border-border-subtle bg-surface px-2.5 py-2.5 transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <span
                      className={cn(
                        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
                        DEPARTMENT_COLOR_ICON_WRAP[colorKey],
                      )}
                    >
                      <DeptIcon className="size-3.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {department.name}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {department.memberCount} Member
                        {department.memberCount === 1 ? "" : "s"}
                      </span>
                    </span>
                    <ChevronRight
                      className="size-4 shrink-0 text-muted"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
            {departments.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border-subtle px-3 py-8 text-center text-xs text-muted">
                No departments yet
              </li>
            ) : null}
          </ul>

          <button
            type="button"
            onClick={() => onNavigateToDepartments?.()}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 text-sm font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            View All Departments
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </aside>

        {/* Roles column */}
        <section className="flex min-w-0 flex-col rounded-xl border border-border-subtle bg-surface shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border-subtle p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-foreground">Roles</h3>
              <p className="mt-0.5 text-xs text-muted">
                Create and manage roles for your team.
              </p>
            </div>
            {canCreateRole ? (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setFormError(null);
                  setModalMode("create");
                }}
                className="inline-flex h-8 shrink-0 items-center gap-1 self-start rounded-lg border border-primary bg-surface px-2.5 text-xs font-semibold text-primary hover:bg-primary-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Create Role
              </button>
            ) : null}
          </div>

          <div className="border-b border-border-subtle p-4">
            <label className="relative block">
              <span className="sr-only">Search roles</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search roles..."
                className="h-10 w-full rounded-xl border border-border-subtle bg-surface pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>

          <div className="min-w-0 flex-1">
            <RolesTable
              roles={roles}
              selectedRoleId={selectedRoleId}
              isLoading={rolesQuery.isLoading}
              isError={rolesQuery.isError}
              canUpdate={canUpdateRole}
              canDelete={canDeleteRole}
              canCreate={canCreateRole}
              onRetry={() => void rolesQuery.refetch()}
              onSelect={(role) => {
                setSelectedRoleId(role.id);
                setMatrixEditing(false);
              }}
              onEdit={(role) => {
                setEditing(role);
                setFormError(null);
                setModalMode("edit");
              }}
              onDelete={(role) => {
                setActionError(null);
                setConfirmAction({ type: "delete", role });
              }}
              onDuplicate={(role) => {
                setActionError(null);
                setConfirmAction({ type: "duplicate", role });
              }}
              onArchive={(role) => {
                setActionError(null);
                setConfirmAction({ type: "archive", role });
              }}
              onDeactivate={(role) => {
                setActionError(null);
                setConfirmAction({ type: "deactivate", role });
              }}
              onActivate={(role) => activateMutation.mutate(role.id)}
            />
          </div>

          <DepartmentsPagination
            page={rolesQuery.data?.pagination.page ?? page}
            limit={rolesQuery.data?.pagination.limit ?? limit}
            total={rolesQuery.data?.pagination.total ?? 0}
            totalPages={rolesQuery.data?.pagination.totalPages ?? 1}
            onPageChange={setPage}
            onLimitChange={(next) => {
              setLimit(next);
              setPage(1);
            }}
            isLoading={rolesQuery.isFetching}
            entityLabel="roles"
            minTotalToShow={1}
            showRowsPerPage={false}
          />
        </section>

        {/* Permissions column */}
        <aside className="flex min-w-0 flex-col rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-foreground">
                Permissions
              </h3>
              <p className="mt-0.5 text-xs text-muted">
                Manage permissions for the selected role.
              </p>
            </div>
            <label className="block shrink-0">
              <span className="sr-only">Select Role</span>
              <select
                value={selectedRoleId ?? ""}
                onChange={(event) => {
                  requestRoleChange(event.target.value || null);
                }}
                className="h-9 min-w-[9rem] rounded-lg border border-border-subtle bg-surface px-2 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                aria-label="Select Role"
              >
                {roles.length === 0 ? (
                  <option value="">Select Role</option>
                ) : null}
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} ({ACCESS_LEVEL_LABELS[role.accessLevel]})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div
            role="tablist"
            aria-label="Permission views"
            className="mb-4 flex gap-4 border-b border-border-subtle"
          >
            <button
              type="button"
              role="tab"
              aria-selected={matrixTab === "module"}
              onClick={() => requestTabChange("module")}
              className={cn(
                "relative pb-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                matrixTab === "module" ? "text-primary" : "text-muted hover:text-foreground",
              )}
            >
              Module Access
              {matrixTab === "module" ? (
                <span
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary"
                  aria-hidden="true"
                />
              ) : null}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={matrixTab === "field"}
              onClick={() => requestTabChange("field")}
              className={cn(
                "relative pb-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                matrixTab === "field" ? "text-primary" : "text-muted hover:text-foreground",
              )}
            >
              Field Level Access
              {matrixTab === "field" ? (
                <span
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary"
                  aria-hidden="true"
                />
              ) : null}
            </button>
          </div>

          <div className="min-w-0 flex-1">
            {matrixTab === "field" ? (
              !selectedRoleId ? (
                <div className="rounded-lg border border-dashed border-border-subtle bg-hero-bg/50 px-3 py-10 text-center">
                  <p className="text-sm font-semibold text-foreground">
                    Select a role
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Choose a role to configure field-level access.
                  </p>
                </div>
              ) : (
                <FieldAccessMatrix
                  value={
                    fieldAccessDraft ??
                    hydrateFieldAccessDraft(detailsQuery.data?.fieldAccess)
                  }
                  editable={matrixEditing}
                  isLoading={detailsQuery.isLoading}
                  errorMessage={
                    detailsQuery.isError
                      ? getTeamApiErrorMessage(detailsQuery.error)
                      : null
                  }
                  copyRoles={roles
                    .filter((role) => role.id !== selectedRoleId)
                    .map((role) => ({ id: role.id, name: role.name }))}
                  onChange={setFieldAccessDraft}
                  onReset={() =>
                    setFieldAccessDraft(
                      hydrateFieldAccessDraft(
                        detailsQuery.data?.fieldAccess ?? null,
                      ),
                    )
                  }
                  onCopyFromRole={async (roleId) => {
                    try {
                      const details = await fetchRoleDetails(roleId);
                      setFieldAccessDraft(
                        hydrateFieldAccessDraft(details.fieldAccess),
                      );
                    } catch (error) {
                      setActionError(getTeamApiErrorMessage(error));
                    }
                  }}
                />
              )
            ) : detailsQuery.isLoading || !matrixDraft ? (
              <div className="h-64 animate-pulse rounded-lg bg-hero-bg" />
            ) : (
              <RolePermissionMatrix
                permissions={matrixDraft}
                editable={matrixEditing}
                compact
                onChange={setMatrixDraft}
              />
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-border-subtle pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex items-start gap-2 text-xs text-muted">
              <Info
                className="mt-0.5 size-3.5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span>
                {isMatrixDirty
                  ? "You have unsaved permission changes for this role."
                  : "Changes to permissions will be applied to all users assigned to this role."}
              </span>
            </p>
            {matrixEditing ? (
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  disabled={permissionsMutation.isPending}
                  onClick={discardMatrixEdits}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-border-subtle px-3 text-sm font-semibold text-foreground hover:bg-hero-bg"
                >
                  Cancel
                </button>
                {canUpdateRole ? (
                  <button
                    type="button"
                    disabled={
                      permissionsMutation.isPending ||
                      !matrixDraft ||
                      !fieldAccessDraft
                    }
                    onClick={() => permissionsMutation.mutate()}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-surface hover:bg-primary-hover disabled:opacity-50"
                  >
                    {permissionsMutation.isPending ? "Saving..." : "Save"}
                  </button>
                ) : null}
              </div>
            ) : canUpdateRole ? (
              <button
                type="button"
                disabled={!detailsQuery.data}
                onClick={() => setMatrixEditing(true)}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 self-end rounded-lg border border-primary bg-surface px-3 text-sm font-semibold text-primary hover:bg-primary-light/50 disabled:opacity-50"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                Edit Permissions
              </button>
            ) : null}
          </div>
        </aside>
      </div>

      {unsavedConfirm
        ? createPortal(
            <EmployerProfileDialog
              title="Unsaved changes"
              description="You have unsaved permission changes. Discard them and continue?"
              onClose={() => setUnsavedConfirm(null)}
              footer={
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setUnsavedConfirm(null)}
                    className="inline-flex h-10 items-center rounded-lg border border-border-subtle px-4 text-sm font-semibold"
                  >
                    Keep editing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const pending = unsavedConfirm;
                      discardMatrixEdits();
                      if (pending.kind === "tab" && pending.nextTab) {
                        setMatrixTab(pending.nextTab);
                      }
                      if (pending.kind === "role") {
                        setSelectedRoleId(pending.nextRoleId ?? null);
                      }
                    }}
                    className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover"
                  >
                    Discard
                  </button>
                </div>
              }
            >
              <p className="text-sm text-muted">
                Leaving this view without saving will discard your latest edits.
              </p>
            </EmployerProfileDialog>,
            document.body,
          )
        : null}

      {modalMode ? (
        <RoleFormModal
          mode={modalMode}
          role={editing}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          errorMessage={formError}
          onClose={() => {
            setModalMode(null);
            setEditing(null);
            setFormError(null);
          }}
          onSubmit={(payload) => {
            if (modalMode === "create") {
              createMutation.mutate(payload);
              return;
            }
            if (editing) {
              updateMutation.mutate({ id: editing.id, payload });
            }
          }}
        />
      ) : null}

      {departmentModalOpen ? (
        <DepartmentFormModal
          mode="create"
          isSubmitting={createDepartmentMutation.isPending}
          errorMessage={departmentFormError}
          onClose={() => {
            if (createDepartmentMutation.isPending) return;
            setDepartmentModalOpen(false);
            setDepartmentFormError(null);
          }}
          onSubmit={(payload: CreateDepartmentPayload) => {
            createDepartmentMutation.mutate(payload);
          }}
        />
      ) : null}

      {confirmAction
        ? createPortal(
            <EmployerProfileDialog
              title={
                confirmAction.type === "delete"
                  ? "Delete Role"
                  : confirmAction.type === "archive"
                    ? "Archive Role"
                    : confirmAction.type === "duplicate"
                      ? "Duplicate Role"
                      : "Deactivate Role"
              }
              description={
                confirmAction.type === "delete"
                  ? confirmAction.role.memberCount > 0
                    ? `“${confirmAction.role.name}” still has ${confirmAction.role.memberCount} member(s). Reassign or remove those members before deleting this role.`
                    : `Permanently delete “${confirmAction.role.name}”? This cannot be undone.`
                  : confirmAction.type === "archive"
                    ? `Archive “${confirmAction.role.name}”? Existing members keep the role, but it cannot be assigned to new members.`
                    : confirmAction.type === "duplicate"
                      ? `Create a copy of “${confirmAction.role.name}” with the same permissions?`
                      : `Deactivate “${confirmAction.role.name}”? It will no longer be assignable.`
              }
              onClose={() => {
                if (runRoleAction.isPending) return;
                setConfirmAction(null);
                setActionError(null);
              }}
              footer={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {actionError ? (
                    <p role="alert" className="text-sm text-red-600">
                      {actionError}
                    </p>
                  ) : (
                    <span className="hidden sm:block" />
                  )}
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      disabled={runRoleAction.isPending}
                      onClick={() => {
                        setConfirmAction(null);
                        setActionError(null);
                      }}
                      className="inline-flex h-10 items-center rounded-lg border border-border-subtle px-4 text-sm font-semibold"
                    >
                      {confirmAction.type === "delete" &&
                      confirmAction.role.memberCount > 0
                        ? "Close"
                        : "Cancel"}
                    </button>
                    {!(
                      confirmAction.type === "delete" &&
                      confirmAction.role.memberCount > 0
                    ) ? (
                      <button
                        type="button"
                        disabled={runRoleAction.isPending}
                        onClick={() => runRoleAction.mutate(confirmAction)}
                        className={cn(
                          "inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-surface disabled:opacity-50",
                          confirmAction.type === "delete"
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-primary hover:bg-primary-hover",
                        )}
                      >
                        {runRoleAction.isPending
                          ? "Working..."
                          : confirmAction.type === "delete"
                            ? "Delete"
                            : confirmAction.type === "archive"
                              ? "Archive"
                              : confirmAction.type === "duplicate"
                                ? "Duplicate"
                                : "Deactivate"}
                      </button>
                    ) : null}
                  </div>
                </div>
              }
            >
              {confirmAction.type === "delete" &&
              confirmAction.role.memberCount > 0 ? (
                <p className="text-sm text-muted">
                  Delete is blocked until this role has no assigned members
                  (including invited members).
                </p>
              ) : (
                <p className="text-sm text-muted">
                  This action applies immediately for your organization.
                </p>
              )}
            </EmployerProfileDialog>,
            document.body,
          )
        : null}
    </div>
  );
}
