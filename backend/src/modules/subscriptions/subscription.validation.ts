import { z } from "zod";

export const enterpriseEnquiryBodySchema = z.object({
  contactName: z.string().trim().min(2, "Enter your name").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{10,16}$/, "Enter a valid phone number"),
  email: z
    .string()
    .trim()
    .max(200)
    .optional()
    .default("")
    .refine((value) => value === "" || z.email().safeParse(value).success, {
      message: "Enter a valid email address",
    }),
  companyName: z.string().trim().max(200).optional().default(""),
  expectedMonthlyHires: z.coerce.number().int().min(1).max(100_000).optional(),
  message: z.string().trim().max(2000).optional().default(""),
});

export type EnterpriseEnquiryBody = z.infer<typeof enterpriseEnquiryBodySchema>;
