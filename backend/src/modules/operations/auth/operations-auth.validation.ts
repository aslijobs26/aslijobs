import { z } from "zod";

export const operationsTeamLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),
  password: z.string().min(8).max(72),
});

export const operationsTeamRefreshSchema = z.object({
  refreshToken: z.string().trim().min(1),
});

export type OperationsTeamLoginBody = z.infer<typeof operationsTeamLoginSchema>;
export type OperationsTeamRefreshBody = z.infer<
  typeof operationsTeamRefreshSchema
>;
