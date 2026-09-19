import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { getOperationsApiErrorMessage } from "../components/operations/team/team-format";
import {
  OPERATIONS_ROUTES,
  operationsRoleEditPath,
} from "../constants/operations-routes";
import { useOperationsRoleDetail } from "../hooks/use-operations-roles";
import {
  loadRolePreviewDraft,
  saveRolePreviewDraft,
} from "../utils/operations-role-preview";

/**
 * Activates role preview from the saved role (or an existing draft) and
 * redirects into the real ASLI OS shell at Home.
 */
export function OperationsRolePreviewPage() {
  const { roleId = "" } = useParams();
  const navigate = useNavigate();
  const detailQuery = useOperationsRoleDetail(roleId || undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!roleId) {
      navigate(OPERATIONS_ROUTES.ROLES, { replace: true });
      return;
    }

    const existing = loadRolePreviewDraft();
    if (existing && existing.roleId === roleId) {
      navigate(OPERATIONS_ROUTES.HOME, { replace: true });
      return;
    }

    const role = detailQuery.data?.role;
    if (!role) {
      return;
    }

    saveRolePreviewDraft({
      roleId: role.id,
      roleName: role.name,
      grants: role.grants ?? [],
      canCreateRoles: role.canCreateRoles,
      canManageUsers: role.canManageUsers,
      canAssignRoles: role.canAssignRoles,
      unsaved: false,
      returnPath: operationsRoleEditPath(role.id),
      baseRevision: role.revision ?? null,
    });
    navigate(OPERATIONS_ROUTES.HOME, { replace: true });
  }, [detailQuery.data?.role, navigate, roleId]);

  useEffect(() => {
    if (detailQuery.isError) {
      setError(
        getOperationsApiErrorMessage(
          detailQuery.error,
          "Unable to load role for preview.",
        ),
      );
    }
  }, [detailQuery.error, detailQuery.isError]);

  return (
    <OperationsLayout title="Role Preview" subtitle="Preparing preview…">
      <div className="rounded-xl border border-border-subtle bg-surface p-6 text-center text-sm text-muted">
        {error ? (
          <p className="text-danger" role="alert">
            {error}
          </p>
        ) : (
          <p>Loading role preview…</p>
        )}
      </div>
    </OperationsLayout>
  );
}
