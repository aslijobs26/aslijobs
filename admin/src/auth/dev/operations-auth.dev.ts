/**
 * TEMPORARY development-only Operations authentication.
 *
 * Remove or disable this module when the real Operations auth API is live.
 * Credentials here are for local development and testing only — never use in production.
 */

import type {
  OperationsLoginInput,
  OperationsLoginResponse,
  OperationsSessionResponse,
} from "../../types/operations-auth";
import { OPERATIONS_TEAM_ROLES } from "../../types/roles";
import {
  buildSuperAdminPermissions,
  resolveEffectiveOperationsPermissions,
} from "../../constants/operations-permissions";

const DEV_ADMIN_EMAIL = "admin@aslijobs.com";
const DEV_ADMIN_PASSWORD = "Admin@123";

export const DEV_OPERATIONS_AUTH_TOKEN_PREFIX = "dev-operations-";

export function isDevOperationsAccessToken(token: string): boolean {
  return token.startsWith(DEV_OPERATIONS_AUTH_TOKEN_PREFIX);
}

function createDevLoginResponse(): OperationsLoginResponse {
  const now = Date.now();

  return {
    accessToken: `${DEV_OPERATIONS_AUTH_TOKEN_PREFIX}access-${now}`,
    refreshToken: `${DEV_OPERATIONS_AUTH_TOKEN_PREFIX}refresh-${now}`,
    accessTokenExpiresAt: new Date(now + 3_600_000).toISOString(),
    refreshTokenExpiresAt: new Date(now + 7 * 86_400_000).toISOString(),
    user: {
      id: "dev-operations-admin",
      fullName: "Operations Admin",
      email: DEV_ADMIN_EMAIL,
      role: OPERATIONS_TEAM_ROLES.SUPER_ADMIN,
      permissions: buildSuperAdminPermissions(),
    },
  };
}

export async function loginDevOperationsTeam(
  input: OperationsLoginInput,
): Promise<OperationsLoginResponse> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 350);
  });

  const email = input.email.trim().toLowerCase();

  if (email !== DEV_ADMIN_EMAIL || input.password !== DEV_ADMIN_PASSWORD) {
    throw new Error("Invalid email or password.");
  }

  return createDevLoginResponse();
}

export async function fetchDevOperationsSession(
  user: OperationsSessionResponse["user"],
): Promise<OperationsSessionResponse> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 120);
  });

  return {
    user: {
      ...user,
      permissions: resolveEffectiveOperationsPermissions(
        user.role,
        user.permissions,
      ),
    },
  };
}

export async function logoutDevOperationsTeam(): Promise<void> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 100);
  });
}
