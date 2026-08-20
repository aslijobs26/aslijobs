import { z } from "zod";

export const operationsTeamLoginSchema = z.object({
  mobileNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
  password: z.string().min(8).max(72),
});

export const operationsTeamRefreshSchema = z.object({
  refreshToken: z.string().trim().min(1),
});

export type OperationsTeamLoginBody = z.infer<typeof operationsTeamLoginSchema>;
export type OperationsTeamRefreshBody = z.infer<typeof operationsTeamRefreshSchema>;
