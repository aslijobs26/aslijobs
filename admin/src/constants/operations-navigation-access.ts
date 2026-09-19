import type {
  OperationsPermissionAction,
  OperationsPermissionModule,
} from "./operations-permissions";
import { matchOperationsRoutePermissionRule } from "./operations-rbac-routes";
import { OPERATIONS_ROUTES } from "./operations-routes";
import type {
  OperationsNavItem,
  OperationsNavSection,
} from "./operations-navigation";

export type OperationsPermissionCheck = (
  module: OperationsPermissionModule,
  action?: OperationsPermissionAction,
) => boolean;

export function canAccessOperationsNavItem(
  item: Pick<
    OperationsNavItem,
    "allowAuthenticated" | "requiredPermission" | "requiredAnyPermissions"
  >,
  can: OperationsPermissionCheck,
  isAuthenticated: boolean,
  canKey?: OperationsPermissionKeyCheck,
): boolean {
  if (item.allowAuthenticated) {
    return isAuthenticated;
  }
  if (item.requiredAnyPermissions && item.requiredAnyPermissions.length > 0) {
    return item.requiredAnyPermissions.some((permission) =>
      canAccessModuleAction(
        permission.module,
        permission.action ?? "read",
        can,
        canKey,
      ),
    );
  }
  if (item.requiredPermission) {
    return canAccessModuleAction(
      item.requiredPermission.module,
      item.requiredPermission.action ?? "read",
      can,
      canKey,
    );
  }
  return false;
}

export type OperationsPermissionKeyCheck = (key: string) => boolean;

/**
 * Module/page visibility: prefer list.view / module.view fine keys for read.
 * Field-only grants must not unlock navigation (projection also excludes them).
 * Profile/detail-only grants do not unlock list navigation items.
 */
function canAccessModuleAction(
  module: OperationsPermissionModule,
  action: OperationsPermissionAction,
  can: OperationsPermissionCheck,
  canKey?: OperationsPermissionKeyCheck,
): boolean {
  if (action !== "read" || !canKey) {
    return can(module, action);
  }
  if (canKey(`${module}.list.view`) || canKey(`${module}.view`)) {
    return true;
  }
  // Detail/profile-only access is enforced by route guards, not list nav.
  if (
    canKey(`${module}.profile.view`) ||
    canKey(`${module}.detail.view`)
  ) {
    return false;
  }
  return can(module, action);
}

export function filterOperationsNavSections(
  sections: OperationsNavSection[],
  can: OperationsPermissionCheck,
  isAuthenticated: boolean,
  canKey?: OperationsPermissionKeyCheck,
): OperationsNavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        canAccessOperationsNavItem(item, can, isAuthenticated, canKey),
      ),
    }))
    .filter((section) => section.items.length > 0);
}

export function canAccessOperationsPath(
  pathname: string,
  can: OperationsPermissionCheck,
  isAuthenticated: boolean,
  canKey?: OperationsPermissionKeyCheck,
): boolean {
  const rule = matchOperationsRoutePermissionRule(pathname);
  if (!rule) {
    return isAuthenticated;
  }
  if (rule.allowAuthenticated) {
    return isAuthenticated;
  }
  return canAccessModuleAction(
    rule.module,
    rule.action ?? "read",
    can,
    canKey,
  );
}

export function getOrganizationEntryPath(
  can: OperationsPermissionCheck,
): string {
  if (can("team", "read")) {
    return OPERATIONS_ROUTES.ORGANIZATION;
  }
  if (can("roles", "read")) {
    return OPERATIONS_ROUTES.ROLES;
  }
  if (can("departments", "read")) {
    return OPERATIONS_ROUTES.DEPARTMENTS;
  }
  if (can("settings", "read")) {
    return OPERATIONS_ROUTES.SETTINGS;
  }
  return OPERATIONS_ROUTES.HOME;
}
