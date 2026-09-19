import { env } from "../../../config/env.js";

/**
 * Canonical Admin/Organization app origin.
 * Uses existing ADMIN_URL (local default http://localhost:5173).
 */
export function getOperationsAdminAppUrl(): string {
  return env.ADMIN_URL.replace(/\/+$/, "");
}

/** Organization/Admin login URL for invitation emails. */
export function getOperationsAdminLoginUrl(): string {
  return `${getOperationsAdminAppUrl()}/login`;
}
