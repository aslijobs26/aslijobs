import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import {
  canOperationsPermission,
  type OperationsPermissionAction,
  type OperationsPermissionModule,
} from "../auth/operations-rbac.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";
import { OperationsRoleModel } from "../rbac/operations-role.model.js";
import { isOperationsPermissionKey } from "../rbac/operations-permission-catalog.js";
import { projectGrantedKeysToMatrix } from "../rbac/operations-permission-projection.js";
import { OperationsTeamUserModel } from "../auth/operations-team-user.model.js";
import {
  WORK_ITEM_TYPE_LABELS,
  type WorkItemType,
} from "./operations-work.constants.js";

/**
 * One requirement group: the actor must satisfy it via a fine catalog key
 * OR (when they have no fine grants for that module) via the coarse matrix.
 */
export type WorkCapabilityRequirement = {
  fineKeys: readonly string[];
  coarseModule: OperationsPermissionModule;
  coarseAction: OperationsPermissionAction;
  label: string;
};

export type WorkTypeCapabilityDefinition = {
  workType: WorkItemType;
  moduleLabel: string;
  capabilityLabel: string;
  /** Every group must be satisfied (AND). */
  requirements: readonly WorkCapabilityRequirement[];
};

/**
 * Canonical WorkItem → required domain capabilities.
 * Permissions come from the existing catalog — no duplicate RBAC lists on teams.
 */
export const WORK_TYPE_CAPABILITY_REGISTRY: Record<
  WorkItemType,
  WorkTypeCapabilityDefinition
> = {
  verification: {
    workType: "verification",
    moduleLabel: "Employers / Verifications",
    capabilityLabel: "Employer Verification",
    requirements: [
      {
        fineKeys: ["employers.list.view", "employers.profile.view"],
        coarseModule: "employers",
        coarseAction: "read",
        label: "Employers read",
      },
      {
        fineKeys: ["employers.profile.actions.verify"],
        coarseModule: "employers",
        coarseAction: "update",
        label: "Employer verification action",
      },
      {
        fineKeys: ["verifications.read", "verifications.update"],
        coarseModule: "verifications",
        coarseAction: "read",
        label: "Verifications access",
      },
    ],
  },
  job_operations: {
    workType: "job_operations",
    moduleLabel: "Jobs",
    capabilityLabel: "Job Moderation",
    requirements: [
      {
        fineKeys: ["jobs.list.view", "jobs.detail.view"],
        coarseModule: "jobs",
        coarseAction: "read",
        label: "Jobs read",
      },
      {
        fineKeys: [
          "jobs.detail.actions.approve",
          "jobs.detail.actions.reject",
        ],
        coarseModule: "jobs",
        coarseAction: "update",
        label: "Job moderation action",
      },
    ],
  },
  placements: {
    workType: "placements",
    moduleLabel: "Placements",
    capabilityLabel: "Joining / Placements",
    requirements: [
      {
        fineKeys: ["placements.list.view", "placements.detail.view"],
        coarseModule: "placements",
        coarseAction: "read",
        label: "Placements read",
      },
      {
        fineKeys: ["placements.detail.actions.update_joining"],
        coarseModule: "placements",
        coarseAction: "update",
        label: "Update joining status",
      },
    ],
  },
  support: {
    workType: "support",
    moduleLabel: "Support",
    capabilityLabel: "Support",
    requirements: [
      {
        fineKeys: ["support.read"],
        coarseModule: "support",
        coarseAction: "read",
        label: "Support read",
      },
      {
        fineKeys: ["support.update"],
        coarseModule: "support",
        coarseAction: "update",
        label: "Support update",
      },
    ],
  },
  jobseeker: {
    workType: "jobseeker",
    moduleLabel: "Candidates",
    capabilityLabel: "Jobseeker Operations",
    requirements: [
      {
        fineKeys: ["candidates.list.view", "candidates.profile.view"],
        coarseModule: "candidates",
        coarseAction: "read",
        label: "Candidates read",
      },
      {
        fineKeys: ["candidates.list.view"],
        coarseModule: "candidates",
        coarseAction: "update",
        label: "Candidates update",
      },
    ],
  },
  hiring_operations: {
    workType: "hiring_operations",
    moduleLabel: "Employers",
    capabilityLabel: "Hiring Operations",
    requirements: [
      {
        fineKeys: ["employers.list.view", "employers.profile.view"],
        coarseModule: "employers",
        coarseAction: "read",
        label: "Employers read",
      },
      {
        fineKeys: [
          "employers.profile.actions.verify",
          "employers.profile.actions.activate",
        ],
        coarseModule: "employers",
        coarseAction: "update",
        label: "Employers update",
      },
    ],
  },
  employer: {
    workType: "employer",
    moduleLabel: "Employers",
    capabilityLabel: "Employer Operations",
    requirements: [
      {
        fineKeys: ["employers.list.view", "employers.profile.view"],
        coarseModule: "employers",
        coarseAction: "read",
        label: "Employers read",
      },
      {
        fineKeys: [
          "employers.profile.actions.verify",
          "employers.profile.actions.activate",
          "employers.profile.actions.suspend",
        ],
        coarseModule: "employers",
        coarseAction: "update",
        label: "Employers update",
      },
    ],
  },
};

export function getWorkTypeCapability(
  workType: WorkItemType,
): WorkTypeCapabilityDefinition {
  return WORK_TYPE_CAPABILITY_REGISTRY[workType];
}

export function listRequiredPermissionLabels(workType: WorkItemType): string[] {
  return getWorkTypeCapability(workType).requirements.map((req) => req.label);
}

function moduleHasFineGrants(
  grantedKeys: readonly string[],
  module: OperationsPermissionModule,
): boolean {
  const prefix = `${module}.`;
  return grantedKeys.some(
    (key) => key === module || key.startsWith(prefix),
  );
}

function satisfiesRequirement(
  grantedKeys: readonly string[],
  permissions: OperationsResolvedAccess["permissions"],
  requirement: WorkCapabilityRequirement,
): boolean {
  if (requirement.fineKeys.some((key) => grantedKeys.includes(key))) {
    return true;
  }
  if (moduleHasFineGrants(grantedKeys, requirement.coarseModule)) {
    return false;
  }
  return canOperationsPermission(
    permissions,
    requirement.coarseModule,
    requirement.coarseAction,
  );
}

/** Pure capability check against resolved access (or Super Admin). */
export function accessHasWorkCapability(
  access: Pick<
    OperationsResolvedAccess,
    "isSuperAdmin" | "grantedKeys" | "permissions"
  >,
  workType: WorkItemType,
): boolean {
  if (access.isSuperAdmin) {
    return true;
  }
  const definition = getWorkTypeCapability(workType);
  return definition.requirements.every((requirement) =>
    satisfiesRequirement(access.grantedKeys, access.permissions, requirement),
  );
}

/** Capability check from a role's grant key list (CUSTOM roles). */
export function roleGrantsHaveWorkCapability(
  grantedKeys: readonly string[],
  workType: WorkItemType,
  isSuperAdmin = false,
): boolean {
  if (isSuperAdmin) {
    return true;
  }
  const permissions = projectGrantedKeysToMatrix(grantedKeys, false);
  return accessHasWorkCapability(
    { isSuperAdmin: false, grantedKeys: [...grantedKeys], permissions },
    workType,
  );
}

export function capabilityRejectionMessage(workType: WorkItemType): string {
  const definition = getWorkTypeCapability(workType);
  return `This task requires ${definition.capabilityLabel} permissions (${definition.moduleLabel}). The selected assignee/team cannot perform this task.`;
}

export function assertAccessHasWorkCapability(
  access: Pick<
    OperationsResolvedAccess,
    "isSuperAdmin" | "grantedKeys" | "permissions"
  >,
  workType: WorkItemType,
): void {
  if (!accessHasWorkCapability(access, workType)) {
    throw new AppError(
      capabilityRejectionMessage(workType),
      HTTP_STATUS.BAD_REQUEST,
      {
        code: "WORK_CAPABILITY_MISMATCH",
        workType,
        capabilityLabel: getWorkTypeCapability(workType).capabilityLabel,
      },
    );
  }
}

export type CapabilityGrantSnapshot = {
  roleId: string | null;
  isSuperAdmin: boolean;
  grantedKeys: string[];
};

/**
 * Load role grant maps for a set of users (batch).
 * Super Admin users are marked without loading a role document.
 */
export async function loadCapabilitySnapshotsForUsers(
  users: Array<{
    _id: mongoose.Types.ObjectId | string;
    role?: string;
    roleId?: mongoose.Types.ObjectId | string | null;
  }>,
): Promise<Map<string, CapabilityGrantSnapshot>> {
  const result = new Map<string, CapabilityGrantSnapshot>();
  const roleIds = new Set<string>();

  for (const user of users) {
    const id = String(user._id);
    if (user.role === "SUPER_ADMIN") {
      result.set(id, {
        roleId: null,
        isSuperAdmin: true,
        grantedKeys: [],
      });
      continue;
    }
    const roleId = user.roleId ? String(user.roleId) : null;
    if (roleId && mongoose.isValidObjectId(roleId)) {
      roleIds.add(roleId);
    } else {
      result.set(id, {
        roleId: null,
        isSuperAdmin: false,
        grantedKeys: [],
      });
    }
  }

  if (roleIds.size > 0) {
    const roles = await OperationsRoleModel.find({
      _id: { $in: [...roleIds] },
      status: "active",
    })
      .select("_id grants")
      .lean();

    const grantsByRole = new Map<string, string[]>();
    for (const role of roles) {
      const keys = (role.grants ?? [])
        .filter((grant) => grant.access === "allow")
        .map((grant) => grant.key)
        .filter((key) => isOperationsPermissionKey(key));
      grantsByRole.set(String(role._id), keys);
    }

    for (const user of users) {
      const id = String(user._id);
      if (result.has(id)) continue;
      const roleId = user.roleId ? String(user.roleId) : null;
      result.set(id, {
        roleId,
        isSuperAdmin: false,
        grantedKeys: roleId ? grantsByRole.get(roleId) ?? [] : [],
      });
    }
  }

  return result;
}

export function snapshotHasWorkCapability(
  snapshot: CapabilityGrantSnapshot,
  workType: WorkItemType,
): boolean {
  if (snapshot.isSuperAdmin) {
    return true;
  }
  return roleGrantsHaveWorkCapability(snapshot.grantedKeys, workType, false);
}

export async function userIdsHaveWorkCapability(input: {
  userIds: string[];
  workType: WorkItemType;
}): Promise<Set<string>> {
  if (input.userIds.length === 0) {
    return new Set();
  }
  const users = await OperationsTeamUserModel.find({
    _id: { $in: input.userIds },
    status: "active",
  })
    .select("_id role roleId")
    .lean();

  const snapshots = await loadCapabilitySnapshotsForUsers(users);
  const capable = new Set<string>();
  for (const user of users) {
    const snapshot = snapshots.get(String(user._id));
    if (snapshot && snapshotHasWorkCapability(snapshot, input.workType)) {
      capable.add(String(user._id));
    }
  }
  return capable;
}

/**
 * A department (Team Queue) is eligible when at least one active member
 * in that department can complete the work type.
 */
export async function departmentHasWorkCapability(
  departmentId: string,
  workType: WorkItemType,
): Promise<boolean> {
  if (!mongoose.isValidObjectId(departmentId)) {
    return false;
  }
  const members = await OperationsTeamUserModel.find({
    departmentId,
    status: "active",
  })
    .select("_id role roleId")
    .limit(500)
    .lean();
  if (members.length === 0) {
    return false;
  }
  const snapshots = await loadCapabilitySnapshotsForUsers(members);
  return members.some((member) => {
    const snapshot = snapshots.get(String(member._id));
    return snapshot
      ? snapshotHasWorkCapability(snapshot, workType)
      : false;
  });
}

/**
 * An Organization Ops Team is eligible when at least one active member
 * on that team can complete the work type.
 */
export async function teamHasWorkCapability(
  teamId: string,
  workType: WorkItemType,
): Promise<boolean> {
  if (!mongoose.isValidObjectId(teamId)) {
    return false;
  }
  const members = await OperationsTeamUserModel.find({
    teamId,
    status: "active",
  })
    .select("_id role roleId")
    .limit(500)
    .lean();
  if (members.length === 0) {
    return false;
  }
  const snapshots = await loadCapabilitySnapshotsForUsers(members);
  return members.some((member) => {
    const snapshot = snapshots.get(String(member._id));
    return snapshot
      ? snapshotHasWorkCapability(snapshot, workType)
      : false;
  });
}

/** Derived capability labels for every work type a set of members can perform. */
export async function resolveCapabilitiesForMembers(
  members: Array<{
    _id: mongoose.Types.ObjectId | string;
    role?: string;
    roleId?: mongoose.Types.ObjectId | string | null;
  }>,
): Promise<
  Array<{
    workType: WorkItemType;
    typeLabel: string;
    moduleLabel: string;
    capabilityLabel: string;
    available: boolean;
  }>
> {
  const snapshots = await loadCapabilitySnapshotsForUsers(members);
  const workTypes = Object.keys(WORK_TYPE_CAPABILITY_REGISTRY) as WorkItemType[];

  return workTypes.map((workType) => {
    const definition = getWorkTypeCapability(workType);
    const available = members.some((member) => {
      const snapshot = snapshots.get(String(member._id));
      return snapshot
        ? snapshotHasWorkCapability(snapshot, workType)
        : false;
    });
    return {
      workType,
      typeLabel: WORK_ITEM_TYPE_LABELS[workType],
      moduleLabel: definition.moduleLabel,
      capabilityLabel: definition.capabilityLabel,
      available,
    };
  });
}

export function buildCapabilitySummary(workType: WorkItemType) {
  const definition = getWorkTypeCapability(workType);
  return {
    workType,
    typeLabel: WORK_ITEM_TYPE_LABELS[workType],
    moduleLabel: definition.moduleLabel,
    capabilityLabel: definition.capabilityLabel,
    requiredPermissions: definition.requirements.map((req) => ({
      label: req.label,
      fineKeys: [...req.fineKeys],
      coarse: `${req.coarseModule}.${req.coarseAction}`,
    })),
  };
}
