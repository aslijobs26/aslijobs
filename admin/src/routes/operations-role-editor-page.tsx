import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsFilterSelect } from "../components/operations/jobs/OperationsFilterSelect";
import { PermissionMatrixPanel } from "../components/operations/roles/PermissionMatrixPanel";
import { getOperationsApiErrorMessage } from "../components/operations/team/team-format";
import {
  OperationsFormField,
  operationsFieldInputClassName,
  operationsFieldTextareaClassName,
} from "../components/ui/OperationsFormField";
import {
  OPERATIONS_ROUTES,
  operationsRoleEditPath,
} from "../constants/operations-routes";
import { useOperationsDepartments } from "../hooks/use-operations-departments";
import { useOperationsPermissions } from "../hooks/use-operations-permissions";
import {
  useCreateOperationsRole,
  useOperationsPermissionCatalog,
  useOperationsRoleDetail,
  useOperationsRoles,
  useUpdateOperationsRole,
} from "../hooks/use-operations-roles";
import type { OperationsRoleGrant } from "../types/operations-team";
import { cn } from "../utils/cn";
import {
  diffRoleGrantKeys,
  saveRolePreviewDraft,
} from "../utils/operations-role-preview";

type RoleEditorDraft = {
  name: string;
  description: string;
  departmentId: string;
  parentRoleId: string;
  canCreateRoles: boolean;
  canManageUsers: boolean;
  canAssignRoles: boolean;
  grants: OperationsRoleGrant[];
  initialGrants: OperationsRoleGrant[];
  /** Revision captured when the draft was last synced from the server. */
  baseRevision: number | null;
  hydratedFromRoleId: string | null;
};

function emptyDraft(): RoleEditorDraft {
  return {
    name: "",
    description: "",
    departmentId: "",
    parentRoleId: "",
    canCreateRoles: false,
    canManageUsers: false,
    canAssignRoles: false,
    grants: [],
    initialGrants: [],
    baseRevision: null,
    hydratedFromRoleId: null,
  };
}

function isConflictError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 409;
}

export function OperationsRoleEditorPage() {
  const { roleId } = useParams();
  const isEdit = Boolean(roleId);
  const navigate = useNavigate();
  const {
    isSuperAdmin,
    canCreateRoles,
    canManageUsers,
    canAssignRoles,
    delegatableKeys,
  } = useOperationsPermissions();
  const catalogQuery = useOperationsPermissionCatalog();
  const rolesQuery = useOperationsRoles({ status: "active" });
  const departmentsQuery = useOperationsDepartments({ status: "active" });
  const detailQuery = useOperationsRoleDetail(isEdit ? roleId : undefined);
  const createMutation = useCreateOperationsRole();
  const updateMutation = useUpdateOperationsRole();

  const [draft, setDraft] = useState<RoleEditorDraft>(() => emptyDraft());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [serverConflict, setServerConflict] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const serverRole = detailQuery.data?.role;
  const serverRevision = serverRole?.revision ?? null;

  // Hydrate draft once per role load. Never overwrite dirty local edits from refetch.
  useEffect(() => {
    if (!isEdit) {
      setDraft((current) =>
        current.hydratedFromRoleId === null
          ? current
          : { ...emptyDraft(), hydratedFromRoleId: null },
      );
      return;
    }
    if (!serverRole || !roleId) {
      return;
    }
    setDraft((current) => {
      if (current.hydratedFromRoleId === roleId) {
        return current;
      }
      const nextGrants = serverRole.grants ?? [];
      return {
        name: serverRole.name,
        description: serverRole.description,
        departmentId: serverRole.departmentId ?? "",
        parentRoleId: serverRole.parentRoleId ?? "",
        canCreateRoles: serverRole.canCreateRoles,
        canManageUsers: serverRole.canManageUsers,
        canAssignRoles: serverRole.canAssignRoles,
        grants: nextGrants,
        initialGrants: nextGrants,
        baseRevision: serverRole.revision ?? 1,
        hydratedFromRoleId: roleId,
      };
    });
  }, [isEdit, roleId, serverRole]);

  // Detect true concurrent edits while the local draft is dirty.
  useEffect(() => {
    if (!isEdit || draft.baseRevision == null || serverRevision == null) {
      setServerConflict(false);
      return;
    }
    const dirty =
      draft.hydratedFromRoleId === roleId &&
      (JSON.stringify(draft.grants) !== JSON.stringify(draft.initialGrants) ||
        draft.name !== (serverRole?.name ?? draft.name));
    if (dirty && serverRevision !== draft.baseRevision) {
      setServerConflict(true);
    }
  }, [
    draft.baseRevision,
    draft.grants,
    draft.hydratedFromRoleId,
    draft.initialGrants,
    draft.name,
    isEdit,
    roleId,
    serverRevision,
    serverRole?.name,
  ]);

  const parentOptions = useMemo(
    () => (rolesQuery.data?.roles ?? []).filter((role) => role.id !== roleId),
    [roleId, rolesQuery.data?.roles],
  );

  const templateRoles = useMemo(
    () => (rolesQuery.data?.roles ?? []).filter((role) => role.id !== roleId),
    [roleId, rolesQuery.data?.roles],
  );

  const departmentOptions = useMemo(
    () => [
      { value: "", label: "None" },
      ...(departmentsQuery.data?.departments ?? []).map((department) => ({
        value: department.id,
        label: department.name,
      })),
    ],
    [departmentsQuery.data?.departments],
  );

  const parentRoleOptions = useMemo(
    () => [
      {
        value: "",
        label: isSuperAdmin ? "None (top-level)" : "Your role",
      },
      ...parentOptions.map((role) => ({
        value: role.id,
        label: role.name,
      })),
    ],
    [isSuperAdmin, parentOptions],
  );

  const grantDiff = useMemo(
    () => diffRoleGrantKeys(draft.initialGrants, draft.grants),
    [draft.grants, draft.initialGrants],
  );
  const isDirty =
    grantDiff.added.length > 0 ||
    grantDiff.removed.length > 0 ||
    (isEdit &&
      serverRole &&
      (draft.name !== serverRole.name ||
        draft.description !== serverRole.description ||
        draft.departmentId !== (serverRole.departmentId ?? "") ||
        draft.parentRoleId !== (serverRole.parentRoleId ?? "") ||
        draft.canCreateRoles !== serverRole.canCreateRoles ||
        draft.canManageUsers !== serverRole.canManageUsers ||
        draft.canAssignRoles !== serverRole.canAssignRoles));

  const busy =
    createMutation.isPending || updateMutation.isPending || isSubmitting;
  const hydrated = !isEdit || draft.hydratedFromRoleId === roleId;
  const pageTitle = isEdit ? "Edit Role" : "Create Role";

  const reloadLatest = () => {
    if (!serverRole || !roleId) return;
    const nextGrants = serverRole.grants ?? [];
    setDraft({
      name: serverRole.name,
      description: serverRole.description,
      departmentId: serverRole.departmentId ?? "",
      parentRoleId: serverRole.parentRoleId ?? "",
      canCreateRoles: serverRole.canCreateRoles,
      canManageUsers: serverRole.canManageUsers,
      canAssignRoles: serverRole.canAssignRoles,
      grants: nextGrants,
      initialGrants: nextGrants,
      baseRevision: serverRole.revision ?? 1,
      hydratedFromRoleId: roleId,
    });
    setServerConflict(false);
    setError("");
    setSuccess("Loaded the latest role from the server.");
  };

  const keepMyChanges = () => {
    setServerConflict(false);
    setError(
      "Your local changes are kept. Saving may still fail if another admin saved first — reload if you get a conflict.",
    );
  };

  const openPreview = () => {
    if (!isEdit || !roleId) return;
    saveRolePreviewDraft({
      roleId,
      roleName: draft.name.trim() || "Role",
      grants: draft.grants,
      canCreateRoles: draft.canCreateRoles,
      canManageUsers: draft.canManageUsers,
      canAssignRoles: draft.canAssignRoles,
      unsaved: Boolean(isDirty),
      returnPath: operationsRoleEditPath(roleId),
      baseRevision: draft.baseRevision,
    });
    navigate(OPERATIONS_ROUTES.HOME);
  };

  const submit = async () => {
    if (submittingRef.current) return;
    setError("");
    setSuccess("");
    const trimmedName = draft.name.trim();
    if (trimmedName.length < 2) {
      setError("Role name is required.");
      return;
    }
    if (isEdit && draft.baseRevision == null) {
      setError("This role is still loading. Wait a moment and try again.");
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const input = {
        name: trimmedName,
        description: draft.description.trim(),
        departmentId: draft.departmentId || null,
        parentRoleId: draft.parentRoleId || null,
        canCreateRoles: draft.canCreateRoles,
        canManageUsers: draft.canManageUsers,
        canAssignRoles: draft.canAssignRoles,
        grants: draft.grants,
        expectedRevision: isEdit ? draft.baseRevision! : undefined,
      };
      if (isEdit && roleId) {
        const updated = await updateMutation.mutateAsync({ roleId, input });
        const nextGrants = updated.grants ?? draft.grants;
        setDraft((current) => ({
          ...current,
          name: updated.name,
          description: updated.description,
          departmentId: updated.departmentId ?? "",
          parentRoleId: updated.parentRoleId ?? "",
          canCreateRoles: updated.canCreateRoles,
          canManageUsers: updated.canManageUsers,
          canAssignRoles: updated.canAssignRoles,
          grants: nextGrants,
          initialGrants: nextGrants,
          baseRevision: updated.revision ?? (current.baseRevision ?? 1) + 1,
          hydratedFromRoleId: roleId,
        }));
        setServerConflict(false);
        setSuccess("Role saved successfully.");
      } else {
        await createMutation.mutateAsync(input);
        navigate(OPERATIONS_ROUTES.ROLES);
      }
    } catch (submitError) {
      if (isConflictError(submitError)) {
        setServerConflict(true);
        setError(
          "Role was changed by another administrator. Reload the latest version or keep your changes and retry.",
        );
      } else {
        setError(
          getOperationsApiErrorMessage(submitError, "Unable to save this role."),
        );
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <OperationsLayout
      title={pageTitle}
      subtitle="Define role details and assign permissions"
    >
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-[18px] font-bold tracking-tight text-foreground sm:text-[20px]">
              {pageTitle}
            </h1>
            <p className="mt-0.5 text-[12px] text-muted">
              Define role details and assign permissions
            </p>
            {isEdit && isDirty ? (
              <p className="mt-1 text-[11px] font-semibold text-warning">
                Unsaved changes
                {grantDiff.added.length > 0
                  ? ` · ${grantDiff.added.length} permission${grantDiff.added.length === 1 ? "" : "s"} added`
                  : ""}
                {grantDiff.removed.length > 0
                  ? ` · ${grantDiff.removed.length} removed`
                  : ""}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isEdit ? (
              <button
                type="button"
                disabled={!hydrated}
                onClick={openPreview}
                className="h-9 rounded-lg border border-border-subtle bg-surface px-3 text-[12px] font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
              >
                Preview Role
              </button>
            ) : null}
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-1 text-[11px] text-muted"
            >
              <span>Management</span>
              <ChevronRight className="size-3 shrink-0" aria-hidden="true" />
              <Link
                to={OPERATIONS_ROUTES.ORGANIZATION}
                className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Organization
              </Link>
              <ChevronRight className="size-3 shrink-0" aria-hidden="true" />
              <Link
                to={OPERATIONS_ROUTES.ROLES}
                className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Roles &amp; Permissions
              </Link>
              <ChevronRight className="size-3 shrink-0" aria-hidden="true" />
              <span className="font-semibold text-foreground">{pageTitle}</span>
            </nav>
          </div>
        </div>

        {serverConflict ? (
          <div
            role="alert"
            className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-[12px] text-foreground"
          >
            <p className="font-semibold">Role changed elsewhere</p>
            <p className="mt-1 text-muted">
              Another administrator updated this role (or a previous save
              already applied). Choose how to continue.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  void detailQuery.refetch().then(() => reloadLatest());
                }}
                className="h-8 rounded-lg bg-primary px-3 text-[11px] font-semibold text-surface"
              >
                Reload latest
              </button>
              <button
                type="button"
                onClick={keepMyChanges}
                className="h-8 rounded-lg border border-border-subtle bg-surface px-3 text-[11px] font-semibold"
              >
                Keep my changes
              </button>
            </div>
          </div>
        ) : null}

        {grantDiff.added.length > 0 || grantDiff.removed.length > 0 ? (
          <div className="rounded-xl border border-border-subtle bg-surface px-4 py-3 text-[11px]">
            <p className="font-semibold text-foreground">
              Saved vs unsaved permissions
            </p>
            {grantDiff.added.length > 0 ? (
              <p className="mt-1 text-success">
                Added: {grantDiff.added.slice(0, 8).join(", ")}
                {grantDiff.added.length > 8
                  ? ` (+${grantDiff.added.length - 8} more)`
                  : ""}
              </p>
            ) : null}
            {grantDiff.removed.length > 0 ? (
              <p className="mt-1 text-danger">
                Removed: {grantDiff.removed.slice(0, 8).join(", ")}
                {grantDiff.removed.length > 8
                  ? ` (+${grantDiff.removed.length - 8} more)`
                  : ""}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="grid min-w-0 items-stretch gap-3 overflow-x-auto overscroll-x-contain scrollbar-hidden xl:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
          <form
            className="flex h-full min-h-[28rem] max-h-[min(42rem,calc(100dvh-10rem))] flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-4 xl:max-h-[calc(100dvh-9.5rem)]"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <OperationsFormField label="Role name" required>
              <input
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Enter role name"
                required
                minLength={2}
                maxLength={80}
                className={operationsFieldInputClassName}
              />
            </OperationsFormField>

            <OperationsFormField label="Description">
              <textarea
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Enter role description"
                rows={4}
                maxLength={400}
                className={operationsFieldTextareaClassName}
              />
            </OperationsFormField>

            <OperationsFormField label="Department">
              <OperationsFilterSelect
                label="Department"
                value={draft.departmentId}
                options={departmentOptions}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, departmentId: value }))
                }
                hideSearch={departmentOptions.length <= 8}
                triggerClassName="h-9 rounded-lg text-xs"
              />
            </OperationsFormField>

            <OperationsFormField label="Parent role">
              <OperationsFilterSelect
                label="Parent role"
                value={draft.parentRoleId}
                options={parentRoleOptions}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, parentRoleId: value }))
                }
                hideSearch={parentRoleOptions.length <= 8}
                triggerClassName="h-9 rounded-lg text-xs"
              />
            </OperationsFormField>

            <div className="space-y-2 border-t border-border-subtle pt-3">
              <label className="flex items-center gap-2.5 text-[13px] text-foreground">
                <input
                  type="checkbox"
                  checked={draft.canCreateRoles}
                  disabled={!isSuperAdmin && !canCreateRoles}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      canCreateRoles: event.target.checked,
                    }))
                  }
                  className="size-4 rounded border-border-subtle text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                Can create roles
              </label>
              <label className="flex items-center gap-2.5 text-[13px] text-foreground">
                <input
                  type="checkbox"
                  checked={draft.canManageUsers}
                  disabled={!isSuperAdmin && !canManageUsers}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      canManageUsers: event.target.checked,
                    }))
                  }
                  className="size-4 rounded border-border-subtle text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                Can manage users
              </label>
              <label className="flex items-center gap-2.5 text-[13px] text-foreground">
                <input
                  type="checkbox"
                  checked={draft.canAssignRoles}
                  disabled={!isSuperAdmin && !canAssignRoles}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      canAssignRoles: event.target.checked,
                    }))
                  }
                  className="size-4 rounded border-border-subtle text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                Can assign roles
              </label>
            </div>

            {error ? (
              <p className="text-[12px] text-danger" role="alert">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="text-[12px] text-success" role="status">
                {success}
              </p>
            ) : null}

            <div className="mt-auto flex items-center gap-2 border-t border-border-subtle pt-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => navigate(OPERATIONS_ROUTES.ROLES)}
                className="h-9 flex-1 rounded-lg border border-border-subtle bg-surface px-3 text-[12px] font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  busy ||
                  draft.name.trim().length < 2 ||
                  !hydrated ||
                  (isEdit && draft.baseRevision == null)
                }
                className={cn(
                  "h-9 flex-1 rounded-lg bg-primary px-3 text-[12px] font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60",
                )}
              >
                {busy
                  ? "Saving…"
                  : isEdit
                    ? "Save Role"
                    : "Create role"}
              </button>
            </div>
          </form>

          {catalogQuery.isPending || (isEdit && !hydrated) ? (
            <div className="h-full min-h-[28rem] max-h-[min(42rem,calc(100dvh-10rem))] animate-pulse rounded-xl border border-border-subtle bg-surface xl:max-h-[calc(100dvh-9.5rem)]" />
          ) : catalogQuery.isError ? (
            <div className="flex h-full min-h-[28rem] max-h-[min(42rem,calc(100dvh-10rem))] items-center justify-center rounded-xl border border-border-subtle bg-surface p-6 text-center text-[12px] text-danger xl:max-h-[calc(100dvh-9.5rem)]">
              {getOperationsApiErrorMessage(
                catalogQuery.error,
                "Unable to load permission catalog.",
              )}
            </div>
          ) : (
            <PermissionMatrixPanel
              tree={catalogQuery.data?.tree ?? []}
              grants={draft.grants}
              onChange={(grants) =>
                setDraft((current) => ({ ...current, grants }))
              }
              initialGrants={draft.initialGrants}
              templateRoles={templateRoles}
              allowedKeys={delegatableKeys}
              isSuperAdmin={isSuperAdmin}
            />
          )}
        </div>
      </div>
    </OperationsLayout>
  );
}
