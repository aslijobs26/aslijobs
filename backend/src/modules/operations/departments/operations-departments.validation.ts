import { z } from "zod";

const objectId = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid id.");

export const listOperationsDepartmentsQuerySchema = z.object({
  search: z.string().trim().max(80).optional().default(""),
  status: z.enum(["active", "archived", "all"]).optional().default("active"),
});

export const createOperationsDepartmentBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(400).optional().default(""),
});

export const updateOperationsDepartmentBodySchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(400).optional(),
  status: z.enum(["active", "archived"]).optional(),
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
