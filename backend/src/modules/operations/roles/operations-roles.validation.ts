import { z } from "zod";

const objectId = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid id.");

const grantSchema = z.object({
  key: z.string().trim().min(3).max(160),
  access: z.literal("allow").optional().default("allow"),
  canDelegate: z.boolean().optional().default(false),
});

export const listOperationsRolesQuerySchema = z.object({
  search: z.string().trim().max(80).optional().default(""),
  status: z.enum(["active", "archived", "all"]).optional().default("active"),
  departmentId: z.union([objectId, z.literal("")]).optional().default(""),
});

export const createOperationsRoleBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(400).optional().default(""),
  departmentId: z.union([objectId, z.literal(""), z.null()]).optional(),
  parentRoleId: z.union([objectId, z.literal(""), z.null()]).optional(),
  status: z.enum(["active"]).optional().default("active"),
  canCreateRoles: z.boolean().optional().default(false),
  canManageUsers: z.boolean().optional().default(false),
  canAssignRoles: z.boolean().optional().default(false),
  grants: z.array(grantSchema).optional().default([]),
});

export const updateOperationsRoleBodySchema = createOperationsRoleBodySchema
  .partial()
  .extend({
    status: z.enum(["active", "archived"]).optional(),
  });

export const archiveOperationsRoleBodySchema = z.object({
  reassignRoleId: z.union([objectId, z.literal("")]).optional().default(""),
});

export const operationsRoleIdParamsSchema = z.object({
  roleId: objectId,
});

export type ListOperationsRolesQuery = z.infer<
  typeof listOperationsRolesQuerySchema
>;
export type CreateOperationsRoleBody = z.infer<
  typeof createOperationsRoleBodySchema
>;
export type UpdateOperationsRoleBody = z.infer<
  typeof updateOperationsRoleBodySchema
>;
export type ArchiveOperationsRoleBody = z.infer<
  typeof archiveOperationsRoleBodySchema
>;
export type OperationsRoleIdParams = z.infer<
  typeof operationsRoleIdParamsSchema
>;
