import type {
  OperationsPermissionAction,
  OperationsPermissionModule,
} from "../auth/operations-rbac.js";
import {
  operationsAccessCan,
  operationsAccessCanKey,
} from "./operations-access.service.js";
import type { OperationsResolvedAccess } from "./operations-access.types.js";

/**
 * Canonical list/entry view keys for modules that use fine-grained catalogs.
 * Module navigation and aggregates require an entry key when fine grants exist.
 */
export const OPERATIONS_MODULE_ENTRY_VIEW_KEYS: Partial<
  Record<OperationsPermissionModule, readonly string[]>
> = {
  candidates: ["candidates.list.view"],
  employers: ["employers.list.view"],
  jobs: ["jobs.list.view"],
  placements: ["placements.list.view"],
  my_work: ["my_work.list.view"],
  team: [
    "team.members.view",
    "team.organization.view",
    "team.teams.view",
  ],
  roles: ["roles.view"],
  departments: ["departments.view"],
  settings: ["settings.view"],
  verifications: ["verifications.view"],
  whatsapp: ["whatsapp.view"],
  support: ["support.view"],
  dashboard: ["dashboard.view"],
  reports: ["reports.view"],
  campaigns: ["campaigns.view"],
  billing: ["billing.view"],
  journey_alerts: ["journey_alerts.view"],
  work_queue: ["work_queue.view"],
  escalations: ["escalations.view"],
  activity_logs: ["activity_logs.view"],
};

function hasFineGrantsForModule(
  access: OperationsResolvedAccess,
  module: OperationsPermissionModule,
): boolean {
  const prefix = `${module}.`;
  return access.grantedKeys.some(
    (key) => key === module || key.startsWith(prefix),
  );
}

/**
 * Module-level access for navigation, dashboard widgets, and search.
 *
 * When the role uses fine grants for a module, entry requires an explicit
 * list/view key (or module.view). Field-only grants never unlock the module.
 * Legacy enum roles without fine grants fall back to coarse can(module, read).
 */
export function operationsAccessCanModule(
  access: OperationsResolvedAccess | undefined,
  module: OperationsPermissionModule,
  action: OperationsPermissionAction = "read",
): boolean {
  if (!access) {
    return false;
  }
  if (access.isSuperAdmin) {
    return true;
  }

  if (action !== "read") {
    return operationsAccessCan(access, module, action);
  }

  if (!hasFineGrantsForModule(access, module)) {
    return operationsAccessCan(access, module, "read");
  }

  const entryKeys = OPERATIONS_MODULE_ENTRY_VIEW_KEYS[module];
  if (entryKeys && entryKeys.length > 0) {
    if (entryKeys.some((key) => operationsAccessCanKey(access, key))) {
      return true;
    }
    // Profile/detail-only access still counts as module access for deep links,
    // but list nav should prefer list.view. Allow profile/detail.view as a
    // secondary entry so authorized detail pages are not falsely denied.
    const profileKey = `${module}.profile.view`;
    const detailKey = `${module}.detail.view`;
    if (
      operationsAccessCanKey(access, profileKey) ||
      operationsAccessCanKey(access, detailKey)
    ) {
      return true;
    }
    return false;
  }

  return (
    operationsAccessCanKey(access, `${module}.view`) ||
    operationsAccessCan(access, module, "read")
  );
}

/**
 * List page requires list.view when fine grants exist; otherwise coarse read.
 */
export function operationsAccessCanModuleList(
  access: OperationsResolvedAccess | undefined,
  module: OperationsPermissionModule,
): boolean {
  if (!access) {
    return false;
  }
  if (access.isSuperAdmin) {
    return true;
  }
  if (!hasFineGrantsForModule(access, module)) {
    return operationsAccessCan(access, module, "read");
  }
  const listKey = `${module}.list.view`;
  if (operationsAccessCanKey(access, listKey)) {
    return true;
  }
  // Modules without a list page use module.view
  return operationsAccessCanKey(access, `${module}.view`);
}
