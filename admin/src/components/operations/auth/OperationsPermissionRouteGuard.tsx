import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { matchOperationsRoutePermissionRule } from "../../../constants/operations-rbac-routes";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import { useOperationsPermissions } from "../../../hooks/use-operations-permissions";

type OperationsPermissionRouteGuardProps = {
  children: ReactNode;
};

/**
 * Soft route gate using the RBAC foundation.
 * SUPER_ADMIN retains full access via the permission matrix.
 * Unmatched routes stay open for authenticated users (no behavior change).
 */
export function OperationsPermissionRouteGuard({
  children,
}: OperationsPermissionRouteGuardProps) {
  const pathname = useLocation().pathname;
  const { can, isLoading, role } = useOperationsPermissions();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <p className="text-sm text-muted">Loading permissions…</p>
      </div>
    );
  }

  const rule = matchOperationsRoutePermissionRule(pathname);
  if (!rule) {
    return <>{children}</>;
  }

  const action = rule.action ?? "read";
  if (can(rule.module, action)) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="text-sm font-semibold text-foreground">Access denied</p>
      <p className="max-w-md text-sm text-muted">
        Your role{role ? ` (${role})` : ""} does not have permission to view
        this page.
      </p>
      <Link
        to={OPERATIONS_ROUTES.DASHBOARD}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface hover:bg-primary-hover"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
