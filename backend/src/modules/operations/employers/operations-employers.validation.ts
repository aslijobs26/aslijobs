import { z } from "zod";

export const listOperationsEmployersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().max(200).optional().default(""),
});

export type ListOperationsEmployersQuery = z.infer<
  typeof listOperationsEmployersQuerySchema
>;

export const operationsEmployerIdParamsSchema = z.object({
  employerId: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid employer id."),
});

export type OperationsEmployerIdParams = z.infer<
  typeof operationsEmployerIdParamsSchema
>;
