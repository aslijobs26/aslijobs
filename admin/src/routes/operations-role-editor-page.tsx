import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsFilterSelect } from "../components/operations/jobs/OperationsFilterSelect";
import { PermissionMatrixPanel } from "../components/operations/roles/PermissionMatrixPanel";
import { getOperationsApiErrorMessage } from "../components/operations/team/team-format";
import {
  OperationsFormField,
  operationsFieldInputClassName,
  operationsFieldTextareaClassName,
} from "../components/ui/OperationsFormField";
import { OPERATIONS_ROUTES } from "../constants/operations-routes";
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

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [parentRoleId, setParentRoleId] = useState("");
  const [canCreate, setCanCreate] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [canAssign, setCanAssign] = useState(false);
  const [grants, setGrants] = useState<OperationsRoleGrant[]>([]);
  const [initialGrants, setInitialGrants] = useState<OperationsRoleGrant[]>([]);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(!isEdit);

  useEffect(() => {
    if (!isEdit) {
      setHydrated(true);
      return;
    }
    const role = detailQuery.data?.role;
    if (!role) {
      return;
    }
    setName(role.name);
    setDescription(role.description);
    setDepartmentId(role.departmentId ?? "");
    setParentRoleId(role.parentRoleId ?? "");
    setCanCreate(role.canCreateRoles);
    setCanManage(role.canManageUsers);
    setCanAssign(role.canAssignRoles);
    const nextGrants = role.grants ?? [];
    setGrants(nextGrants);
    setInitialGrants(nextGrants);
    setHydrated(true);
  }, [detailQuery.data, isEdit]);

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

  const submit = async () => {
    setError("");
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError("Role name is required.");
      return;
    }
    try {
      const input = {
        name: trimmedName,
        description: description.trim(),
        departmentId: departmentId || null,
        parentRoleId: parentRoleId || null,
        canCreateRoles: canCreate,
        canManageUsers: canManage,
        canAssignRoles: canAssign,
        grants,
      };
      if (isEdit && roleId) {
        await updateMutation.mutateAsync({ roleId, input });
        navigate(OPERATIONS_ROUTES.ROLES);
      } else {
        await createMutation.mutateAsync(input);
        navigate(OPERATIONS_ROUTES.ROLES);
      }
    } catch (submitError) {
      setError(
        getOperationsApiErrorMessage(submitError, "Unable to save this role."),
      );
    }
  };

  const busy = createMutation.isPending || updateMutation.isPending;
  const pageTitle = isEdit ? "Edit Role" : "Create Role";

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
          </div>
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
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter role name"
                required
                minLength={2}
                maxLength={80}
                className={operationsFieldInputClassName}
              />
            </OperationsFormField>

            <OperationsFormField label="Description">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Enter role description"
                rows={4}
                maxLength={400}
                className={operationsFieldTextareaClassName}
              />
            </OperationsFormField>

            <OperationsFormField label="Department">
              <OperationsFilterSelect
                label="Department"
                value={departmentId}
                options={departmentOptions}
                onChange={setDepartmentId}
                hideSearch={departmentOptions.length <= 8}
                triggerClassName="h-9 rounded-lg text-xs"
              />
            </OperationsFormField>

            <OperationsFormField label="Parent role">
              <OperationsFilterSelect
                label="Parent role"
                value={parentRoleId}
                options={parentRoleOptions}
                onChange={setParentRoleId}
                hideSearch={parentRoleOptions.length <= 8}
                triggerClassName="h-9 rounded-lg text-xs"
              />
            </OperationsFormField>

            <div className="space-y-2 border-t border-border-subtle pt-3">
              <label className="flex items-center gap-2.5 text-[13px] text-foreground">
                <input
                  type="checkbox"
                  checked={canCreate}
                  disabled={!isSuperAdmin && !canCreateRoles}
                  onChange={(event) => setCanCreate(event.target.checked)}
                  className="size-4 rounded border-border-subtle text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                Can create roles
              </label>
              <label className="flex items-center gap-2.5 text-[13px] text-foreground">
                <input
                  type="checkbox"
                  checked={canManage}
                  disabled={!isSuperAdmin && !canManageUsers}
                  onChange={(event) => setCanManage(event.target.checked)}
                  className="size-4 rounded border-border-subtle text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                Can manage users
              </label>
              <label className="flex items-center gap-2.5 text-[13px] text-foreground">
                <input
                  type="checkbox"
                  checked={canAssign}
                  disabled={!isSuperAdmin && !canAssignRoles}
                  onChange={(event) => setCanAssign(event.target.checked)}
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
                disabled={busy || name.trim().length < 2 || !hydrated}
                className={cn(
                  "h-9 flex-1 rounded-lg bg-primary px-3 text-[12px] font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60",
                )}
              >
                {busy
                  ? "Saving…"
                  : isEdit
                    ? "Save role"
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
              grants={grants}
              onChange={setGrants}
              initialGrants={initialGrants}
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
