import { z } from "zod";

const objectId = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid id.");

export const listOperationsTeamsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(80).optional().default(""),
  status: z.enum(["active", "archived", "all"]).optional().default("active"),
  departmentId: z.union([objectId, z.literal("")]).optional().default(""),
  orgUnitId: z.union([objectId, z.literal("")]).optional().default(""),
  regionId: z.union([objectId, z.literal("")]).optional().default(""),
  stateId: z.union([objectId, z.literal("")]).optional().default(""),
  cityId: z.union([objectId, z.literal("")]).optional().default(""),
  leadUserId: z.union([objectId, z.literal("")]).optional().default(""),
  sort: z.enum(["name", "createdAt", "updatedAt"]).optional().default("name"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const createOperationsTeamBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(2).max(40),
  description: z.string().trim().max(400).optional().default(""),
  departmentId: objectId,
  orgUnitId: objectId,
  leadUserId: z.union([objectId, z.literal(""), z.null()]).optional(),
});

export const updateOperationsTeamBodySchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    code: z.string().trim().min(2).max(40).optional(),
    description: z.string().trim().max(400).optional(),
    departmentId: objectId.optional(),
    orgUnitId: objectId.optional(),
    leadUserId: z.union([objectId, z.literal(""), z.null()]).optional(),
    status: z.enum(["active", "archived"]).optional(),
    expectedRevision: z.coerce.number().int().min(1),
  })
  .refine((body) => Object.keys(body).some((key) => key !== "expectedRevision"), {
    message: "At least one field is required.",
  });

export const operationsTeamIdParamsSchema = z.object({
  teamId: objectId,
});

export const addOperationsTeamMemberBodySchema = z.object({
  userId: objectId,
  expectedRevision: z.coerce.number().int().min(1),
});

export const removeOperationsTeamMemberBodySchema = z.object({
  expectedRevision: z.coerce.number().int().min(1),
  replacementLeadUserId: z.union([objectId, z.literal("")]).optional().default(""),
});

export const operationsTeamMemberParamsSchema = z.object({
  teamId: objectId,
  memberId: objectId,
});

export const listTeamMembersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(80).optional().default(""),
  status: z
    .enum(["active", "inactive", "suspended", "all"])
    .optional()
    .default("active"),
});

export type ListOperationsTeamsQuery = z.infer<
  typeof listOperationsTeamsQuerySchema
>;
export type CreateOperationsTeamBody = z.infer<
  typeof createOperationsTeamBodySchema
>;
export type UpdateOperationsTeamBody = z.infer<
  typeof updateOperationsTeamBodySchema
>;
export type OperationsTeamIdParams = z.infer<
  typeof operationsTeamIdParamsSchema
>;
export type AddOperationsTeamMemberBody = z.infer<
  typeof addOperationsTeamMemberBodySchema
>;
export type RemoveOperationsTeamMemberBody = z.infer<
  typeof removeOperationsTeamMemberBodySchema
>;
export type ListTeamMembersQuery = z.infer<typeof listTeamMembersQuerySchema>;
