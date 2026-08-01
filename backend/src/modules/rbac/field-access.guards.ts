import { AppError } from "../../middleware/error.middleware.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import {
  canAccessField,
  getFieldLevel,
  type ResolvedRbacContext,
} from "./rbac.engine.js";
import type { TeamPermissionModule } from "../team/team-permissions.js";

/**
 * Assert that every listed catalog field is editable for the current principal.
 * Throws AppError 403 when not allowed.
 */
export function assertFieldsEditable(
  context: ResolvedRbacContext | undefined | null,
  moduleKey: TeamPermissionModule,
  fieldKeys: string[],
): void {
  if (!context) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  if (context.isSuperAdmin) {
    return;
  }
  for (const fieldKey of fieldKeys) {
    if (!canAccessField(context, moduleKey, fieldKey, "write")) {
      throw new AppError(
        `You do not have permission to update field: ${fieldKey}`,
        HTTP_STATUS.FORBIDDEN,
      );
    }
  }
}

export function assertFieldReadable(
  context: ResolvedRbacContext | undefined | null,
  moduleKey: TeamPermissionModule,
  fieldKey: string,
): void {
  if (!context) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  if (getFieldLevel(context, moduleKey, fieldKey) === "hidden") {
    throw new AppError(
      "You do not have permission to access this field.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
}

/**
 * Reject query filters that target hidden fields.
 */
export function assertSearchFiltersAllowed(
  context: ResolvedRbacContext | undefined | null,
  moduleKey: TeamPermissionModule,
  filters: Array<{ field: string; active: boolean }>,
): void {
  if (!context || context.isSuperAdmin) {
    return;
  }
  for (const filter of filters) {
    if (!filter.active) continue;
    if (getFieldLevel(context, moduleKey, filter.field) === "hidden") {
      throw new AppError(
        `You cannot filter or search by a hidden field: ${filter.field}`,
        HTTP_STATUS.FORBIDDEN,
      );
    }
  }
}
