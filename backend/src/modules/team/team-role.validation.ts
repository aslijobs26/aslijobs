import { z } from "zod";
import {
  TEAM_PERMISSION_ACTIONS,
  TEAM_PERMISSION_MODULES,
} from "./team-permissions.js";
import {
  TEAM_ACCESS_LEVELS,
  TEAM_ROLE_COLORS,
  TEAM_ROLE_DESCRIPTION_MAX_LENGTH,
  TEAM_ROLE_ICONS,
  TEAM_ROLE_LIST_SORTS,
  TEAM_ROLE_NAME_MAX_LENGTH,
  TEAM_ROLE_NAME_MIN_LENGTH,
  TEAM_ROLE_STATUSES,
} from "./team.constants.js";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid id");

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value ?? "");

const modulePermissionSchema = z.object({
  fullAccess: z.boolean(),
  create: z.boolean(),
  read: z.boolean(),
  update: z.boolean(),
  delete: z.boolean(),
  export: z.boolean(),
  fields: z.record(z.string(), z.boolean()).optional(),
});

const permissionsMatrixSchema = z
  .record(z.enum(TEAM_PERMISSION_MODULES), modulePermissionSchema.partial())
  .optional();

const fieldAccessSchema = z
  .record(z.enum(TEAM_PERMISSION_MODULES), z.record(z.string(), z.boolean()))
  .nullable()
  .optional();

export const roleIdParamsSchema = z.object({
  roleId: objectIdSchema,
});

export const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(TEAM_ROLE_NAME_MIN_LENGTH, "Role name is required")
    .max(TEAM_ROLE_NAME_MAX_LENGTH),
  description: optionalTrimmed(TEAM_ROLE_DESCRIPTION_MAX_LENGTH),
  accessLevel: z.enum(TEAM_ACCESS_LEVELS).optional().default("limited"),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  color: z.enum(TEAM_ROLE_COLORS).optional().default("primary"),
  icon: z.enum(TEAM_ROLE_ICONS).optional().default("shield"),
  cloneRoleId: objectIdSchema.optional(),
  permissions: permissionsMatrixSchema,
  fieldAccess: fieldAccessSchema,
});

export const updateRoleSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(TEAM_ROLE_NAME_MIN_LENGTH)
      .max(TEAM_ROLE_NAME_MAX_LENGTH)
      .optional(),
    description: optionalTrimmed(TEAM_ROLE_DESCRIPTION_MAX_LENGTH).optional(),
    accessLevel: z.enum(TEAM_ACCESS_LEVELS).optional(),
    status: z.enum(TEAM_ROLE_STATUSES).optional(),
    color: z.enum(TEAM_ROLE_COLORS).optional(),
    icon: z.enum(TEAM_ROLE_ICONS).optional(),
    permissions: permissionsMatrixSchema,
    fieldAccess: fieldAccessSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const updateRolePermissionsSchema = z.object({
  permissions: z.record(
    z.enum(TEAM_PERMISSION_MODULES),
    modulePermissionSchema.partial(),
  ),
  fieldAccess: fieldAccessSchema,
});

export const duplicateRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(TEAM_ROLE_NAME_MIN_LENGTH, "Role name is required")
    .max(TEAM_ROLE_NAME_MAX_LENGTH)
    .optional(),
});

const optionalDateString = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine(
    (value) => value === "" || !Number.isNaN(Date.parse(value)),
    "Invalid date",
  );

export const listRolesQuerySchema = z.object({
  search: z.string().trim().optional().default(""),
  status: z.enum(TEAM_ROLE_STATUSES).optional(),
  roleType: z.enum(["system", "custom"]).optional(),
  accessLevel: z.enum(TEAM_ACCESS_LEVELS).optional(),
  createdFrom: optionalDateString,
  createdTo: optionalDateString,
  sort: z.enum(TEAM_ROLE_LIST_SORTS).optional().default("name_asc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateRolePermissionsInput = z.infer<
  typeof updateRolePermissionsSchema
>;
export type DuplicateRoleInput = z.infer<typeof duplicateRoleSchema>;
export type ListRolesQuery = z.infer<typeof listRolesQuerySchema>;

/** Re-export for consumers that need action/module constants with validation. */
export { TEAM_PERMISSION_ACTIONS, TEAM_PERMISSION_MODULES };
