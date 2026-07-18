import { z } from "zod";
import {
  EMPLOYER_ACCOUNT_TYPES,
  EMPLOYER_BUSINESS_DOCUMENT_TYPES,
  EMPLOYER_IDENTITY_DOCUMENT_TYPES,
} from "../../constants/employer.constants.js";

const whatsappNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "WhatsApp number must be exactly 10 digits");

export const registerEmployerSchema = z
  .object({
    accountType: z.enum(EMPLOYER_ACCOUNT_TYPES),
    companyName: z.string().trim().default(""),
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    emailAddress: z
      .string()
      .trim()
      .email("Enter a valid email address")
      .optional()
      .or(z.literal("")),
    whatsappNumber: whatsappNumberSchema,
  })
  .superRefine((data, ctx) => {
    if (data.accountType === "company" && !data.companyName.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["companyName"],
        message: "Company / Business Name is required",
      });
    }
  });

export const verifyEmployerOtpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "OTP must be a 4-digit code"),
});

export const employerIdParamsSchema = z.object({
  employerId: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid employer id"),
});

export const completeCompanyProfileSchema = z.object({
  companyName: z.string().trim().min(1, "Company / Business Name is required"),
  industry: z.string().trim().min(1, "Industry is required"),
  businessCategory: z.string().trim().min(1, "Business category is required"),
  companyAddress: z.string().trim().min(1, "Company address is required"),
  pincode: z.string().trim().min(1, "Pincode is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  emailAddress: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("")),
  whatsappNumber: whatsappNumberSchema,
  verificationDocument: z.enum(EMPLOYER_BUSINESS_DOCUMENT_TYPES, {
    message: "Select a valid business verification document",
  }),
});

export const completeIndividualIdentitySchema = z.object({
  documentType: z.enum(EMPLOYER_IDENTITY_DOCUMENT_TYPES, {
    message: "Select a valid identity document",
  }),
});

export type RegisterEmployerSchema = z.infer<typeof registerEmployerSchema>;
export type VerifyEmployerOtpSchema = z.infer<typeof verifyEmployerOtpSchema>;
export type CompleteCompanyProfileSchema = z.infer<
  typeof completeCompanyProfileSchema
>;
export type CompleteIndividualIdentitySchema = z.infer<
  typeof completeIndividualIdentitySchema
>;
