import { z } from "zod";

export const operationsTeamLoginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Enter a valid email address")
      .optional(),
    mobileNumber: z
      .string()
      .trim()
      .regex(/^\d{10}$/, "Mobile number must be exactly 10 digits")
      .optional(),
    password: z.string().min(8).max(72),
  })
  .superRefine((value, context) => {
    if (!value.email && !value.mobileNumber) {
      context.addIssue({
        code: "custom",
        message: "Email or mobile number is required.",
        path: ["email"],
      });
    }
  });

export const operationsTeamRefreshSchema = z.object({
  refreshToken: z.string().trim().min(1),
});

export type OperationsTeamLoginBody = z.infer<typeof operationsTeamLoginSchema>;
export type OperationsTeamRefreshBody = z.infer<
  typeof operationsTeamRefreshSchema
>;
