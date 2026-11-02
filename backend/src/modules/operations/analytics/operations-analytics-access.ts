import {
  operationsAccessCan,
  operationsAccessCanKey,
} from "../rbac/operations-access.service.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";

/**
 * Analytics is a reports surface.
 * Job list view and job export do not grant website traffic or employer analytics.
 */
export function canViewOperationsAnalytics(
  access: OperationsResolvedAccess | undefined,
): boolean {
  if (!access) return false;
  if (access.isSuperAdmin) return true;
  return (
    operationsAccessCan(access, "reports", "read") ||
    operationsAccessCanKey(access, "reports.view")
  );
}

export function canExportOperationsAnalytics(
  access: OperationsResolvedAccess | undefined,
): boolean {
  return canViewOperationsAnalytics(access);
}
