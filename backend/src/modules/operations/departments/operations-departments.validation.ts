import { z } from "zod";

const objectId = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid id.");

export const listOperationsDepartmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  /** Default 100 so option dropdowns keep working; list UI passes a smaller page size. */
  limit: z.coerce.number().int().min(1).max(100).default(100),
  search: z.string().trim().max(80).optional().default(""),
  status: z.enum(["active", "archived", "all"]).optional().default("all"),
});

export const createOperationsDepartmentBodySchema = z.object({
  name: z.string().trim().min(2, "Department name is required.").max(80),
  code: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(400).optional().default(""),
  headUserId: z.union([objectId, z.literal(""), z.null()]).optional(),
});

export const updateOperationsDepartmentBodySchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  code: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(400).optional(),
  headUserId: z.union([objectId, z.literal(""), z.null()]).optional(),
  status: z.enum(["active", "archived"]).optional(),
  expectedRevision: z.coerce.number().int().min(1).optional(),
});

export const operationsDepartmentIdParamsSchema = z.object({
  departmentId: objectId,
});

export type ListOperationsDepartmentsQuery = z.infer<
  typeof listOperationsDepartmentsQuerySchema
>;
export type CreateOperationsDepartmentBody = z.infer<
  typeof createOperationsDepartmentBodySchema
>;
export type UpdateOperationsDepartmentBody = z.infer<
  typeof updateOperationsDepartmentBodySchema
>;
export type OperationsDepartmentIdParams = z.infer<
  typeof operationsDepartmentIdParamsSchema
>;
