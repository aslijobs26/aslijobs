import { z } from "zod";
import { WORK_ITEM_STATUSES } from "../operations/work/operations-work.constants.js";
import { HIRE_ASSIST_ASSISTANCE_TYPES } from "./hire-assist.constants.js";

const objectIdString = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid id.");

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export const createHireAssistBodySchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(80),
  companyName: z
    .string()
    .trim()
    .min(2, "Enter your company or organization name.")
    .max(120),
  mobileNumber: z
    .string()
    .trim()
    .min(10, "Enter a valid 10-digit mobile number.")
    .max(20)
    .transform((value) => {
      const digits = digitsOnly(value);
      if (digits.length === 12 && digits.startsWith("91")) {
        return digits.slice(2);
      }
      if (digits.length === 11 && digits.startsWith("0")) {
        return digits.slice(1);
      }
      return digits;
    })
    .refine((value) => /^[6-9]\d{9}$/.test(value), {
      message: "Enter a valid 10-digit Indian mobile number.",
    }),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(160)
    .transform((value) => value.toLowerCase()),
  designation: z.string().trim().max(80).optional().default(""),
  assistanceType: z
    .string()
    .trim()
    .refine(
      (value): value is (typeof HIRE_ASSIST_ASSISTANCE_TYPES)[number] =>
        (HIRE_ASSIST_ASSISTANCE_TYPES as readonly string[]).includes(value),
      "Select the assistance you need.",
    ),
  message: z
    .string()
    .trim()
    .min(20, "Describe your requirements in at least 20 characters.")
    .max(2000, "Keep your message within 2,000 characters."),
  clientRequestId: z
    .string()
    .trim()
    .regex(
      /^[a-zA-Z0-9_-]{8,64}$/,
      "Invalid request id.",
    )
    .optional(),
});

export type CreateHireAssistBody = z.infer<typeof createHireAssistBodySchema>;

export const listHireAssistTicketsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().max(120).optional().default(""),
  status: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine(
      (value) =>
        value === "" || (WORK_ITEM_STATUSES as readonly string[]).includes(value),
      "Invalid status.",
    ),
  assistanceType: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine(
      (value) =>
        value === "" ||
        (HIRE_ASSIST_ASSISTANCE_TYPES as readonly string[]).includes(value),
      "Invalid assistance type.",
    ),
});

export type ListHireAssistTicketsQuery = z.infer<
  typeof listHireAssistTicketsQuerySchema
>;

export const hireAssistTicketIdParamsSchema = z.object({
  id: objectIdString,
});

export type HireAssistTicketIdParams = z.infer<
  typeof hireAssistTicketIdParamsSchema
>;
