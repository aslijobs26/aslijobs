import { z } from "zod";

const objectId = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid id.");

export const listOperationsTeamQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(80).optional().default(""),
  status: z
    .enum(["", "active", "inactive", "suspended"])
    .optional()
    .default(""),
  roleId: z.union([objectId, z.literal("")]).optional().default(""),
  departmentId: z.union([objectId, z.literal("")]).optional().default(""),
});

export const createOperationsTeamMemberBodySchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  mobileNumber: z.string().trim().regex(/^\d{10}$/, "Enter a 10-digit mobile number."),
  password: z.string().min(8).max(72),
  roleId: objectId,
  departmentId: z.union([objectId, z.literal(""), z.null()]).optional(),
  status: z.enum(["active", "inactive"]).optional().default("active"),
});

export const updateOperationsTeamMemberBodySchema = z.object({
  fullName: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().max(120).optional(),
  mobileNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Enter a 10-digit mobile number.")
    .optional(),
  password: z.string().min(8).max(72).optional(),
  roleId: objectId.optional(),
  departmentId: z.union([objectId, z.literal(""), z.null()]).optional(),
});

export const updateOperationsTeamMemberStatusBodySchema = z.object({
  status: z.enum(["active", "inactive", "suspended"]),
  reason: z.string().trim().max(400).optional().default(""),
});

export const operationsTeamMemberIdParamsSchema = z.object({
  memberId: objectId,
});

export type ListOperationsTeamQuery = z.infer<typeof listOperationsTeamQuerySchema>;
export type CreateOperationsTeamMemberBody = z.infer<
  typeof createOperationsTeamMemberBodySchema
>;
export type UpdateOperationsTeamMemberBody = z.infer<
  typeof updateOperationsTeamMemberBodySchema
>;
export type UpdateOperationsTeamMemberStatusBody = z.infer<
  typeof updateOperationsTeamMemberStatusBodySchema
>;
export type OperationsTeamMemberIdParams = z.infer<
  typeof operationsTeamMemberIdParamsSchema
>;
