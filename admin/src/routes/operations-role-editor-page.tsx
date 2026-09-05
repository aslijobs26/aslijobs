import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { PermissionTreeBuilder } from "../components/operations/team/PermissionTreeBuilder";
import { getOperationsApiErrorMessage } from "../components/operations/team/team-format";
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

export function OperationsRoleEditorPage() {
  const { roleId } = useParams();
  const isEdit = Boolean(roleId);
  const navigate = useNavigate();
  const { isSuperAdmin, canCreateRoles, canManageUsers, canAssignRoles, delegatableKeys } =
    useOperationsPermissions();
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
  const [error, setError] = useState("");

  useEffect(() => {
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
    setGrants(role.grants ?? []);
  }, [detailQuery.data]);

  const parentOptions = useMemo(
    () =>
      (rolesQuery.data?.roles ?? []).filter((role) => role.id !== roleId),
    [roleId, rolesQuery.data?.roles],
  );

  const submit = async () => {
    setError("");
    try {
      const input = {
        name: name.trim(),
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
        navigate(`${OPERATIONS_ROUTES.ROLES}/${roleId}`);
      } else {
        const created = await createMutation.mutateAsync(input);
        navigate(`${OPERATIONS_ROUTES.ROLES}/${created.id}`);
      }
    } catch (submitError) {
      setError(
        getOperationsApiErrorMessage(submitError, "Unable to save this role."),
      );
    }
  };

  const busy = createMutation.isPending || updateMutation.isPending;

  return (
    <OperationsLayout
      title={isEdit ? "Edit role" : "Create role"}
      subtitle="Assign exact module, page, section, field and action permissions. Delegation is explicit."
    >
      <div className="grid gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="space-y-3 rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
          <label className="grid gap-1 text-xs font-semibold text-muted">
            Role name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-muted">
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="rounded-lg border border-border-subtle bg-hero-bg/50 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-muted">
            Department
            <select
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground"
            >
              <option value="">None</option>
              {(departmentsQuery.data?.departments ?? []).map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-muted">
            Parent role
            <select
              value={parentRoleId}
              onChange={(event) => setParentRoleId(event.target.value)}
              className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground"
            >
              <option value="">{isSuperAdmin ? "None (top-level)" : "Your role"}</option>
              {parentOptions.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={canCreate}
              disabled={!isSuperAdmin && !canCreateRoles}
              onChange={(event) => setCanCreate(event.target.checked)}
            />
            Can create roles
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={canManage}
              disabled={!isSuperAdmin && !canManageUsers}
              onChange={(event) => setCanManage(event.target.checked)}
            />
            Can manage users
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={canAssign}
              disabled={!isSuperAdmin && !canAssignRoles}
              onChange={(event) => setCanAssign(event.target.checked)}
            />
            Can assign roles
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button
            type="button"
            disabled={busy || name.trim().length < 2}
            onClick={() => void submit()}
            className="h-10 w-full rounded-lg bg-primary text-sm font-semibold text-surface hover:bg-primary-hover disabled:opacity-60"
          >
            {busy ? "Saving…" : isEdit ? "Save role" : "Create role"}
          </button>
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">Permission builder</h2>
          <p className="mt-1 text-xs text-muted">
            Module → page → section → field → action. Check Delegatable only when
            this role may pass that permission to a child role.
          </p>
          <div className="mt-4">
            {catalogQuery.isPending ? (
              <div className="h-80 animate-pulse rounded-xl bg-hero-bg" />
            ) : (
              <PermissionTreeBuilder
                tree={catalogQuery.data?.tree ?? []}
                grants={grants}
                onChange={setGrants}
                allowedKeys={delegatableKeys}
                isSuperAdmin={isSuperAdmin}
              />
            )}
          </div>
        </div>
      </div>
    </OperationsLayout>
  );
}
