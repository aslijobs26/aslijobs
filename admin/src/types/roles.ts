/** Internal team roles for the Operations application. */
export const OPERATIONS_TEAM_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  OPERATIONS: "OPERATIONS",
  SUPPORT: "SUPPORT",
  MARKETING: "MARKETING",
  CONTENT_LANGUAGE: "CONTENT_LANGUAGE",
  SALES: "SALES",
  CUSTOM: "CUSTOM",
} as const;

export type OperationsTeamRole =
  (typeof OPERATIONS_TEAM_ROLES)[keyof typeof OPERATIONS_TEAM_ROLES];

/** @deprecated Use OPERATIONS_TEAM_ROLES */
export const ADMIN_ROLES = OPERATIONS_TEAM_ROLES;

/** @deprecated Use OperationsTeamRole */
export type AdminRole = OperationsTeamRole;
