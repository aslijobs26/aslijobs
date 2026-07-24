import { z } from "zod";
import {
  EMPLOYER_ACCOUNT_TYPES,
  EMPLOYER_BUSINESS_DOCUMENT_TYPES,
  EMPLOYER_IDENTITY_DOCUMENT_TYPES,
  isBusinessEmployerAccountType,
} from "../../constants/employer.constants.js";

const whatsappNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "WhatsApp number must be exactly 10 digits");

export const registerEmployerSchema = z
  .object({
    accountType: z.enum(EMPLOYER_ACCOUNT_TYPES),
    companyName: z.string().trim().default(""),
    establishmentName: z.string().trim().default(""),
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
    if (
      isBusinessEmployerAccountType(data.accountType) &&
      !data.companyName.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["companyName"],
        message:
          data.accountType === "consultancy"
            ? "Consultancy Name is required"
            : "Company / Business Name is required",
      });
    }

    if (
      data.accountType === "individual" &&
      !data.establishmentName.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["establishmentName"],
        message: "Establishment Name is required",
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

const optionalNonNegativeInt = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }

  return value;
}, z.coerce.number().int().min(0).optional());

export const completeCompanyProfileSchema = z
  .object({
    companyName: z.string().trim().min(1, "Business name is required"),
    industry: z.string().trim().optional().default(""),
    businessCategory: z.string().trim().optional().default(""),
    minimumEmployees: optionalNonNegativeInt,
    maximumEmployees: optionalNonNegativeInt,
    companyAddress: z.string().trim().min(1, "Company address is required"),
    pincode: z.string().trim().min(1, "Pincode is required"),
    city: z.string().trim().min(1, "City is required"),
    state: z.string().trim().min(1, "State is required"),
    verificationDocument: z.enum(EMPLOYER_BUSINESS_DOCUMENT_TYPES, {
      message: "Select a valid business verification document",
    }),
  })
  .superRefine((data, ctx) => {
    if (
      typeof data.minimumEmployees === "number" &&
      typeof data.maximumEmployees === "number" &&
      data.maximumEmployees < data.minimumEmployees
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["maximumEmployees"],
        message:
          "Maximum employees must be greater than or equal to minimum employees",
      });
    }
  });

export const completeIndividualIdentitySchema = z.object({
  documentType: z.enum(EMPLOYER_IDENTITY_DOCUMENT_TYPES, {
    message: "Select a valid identity document",
  }),
});

export const updateEmployerProfileSchema = z
  .object({
    companyName: z.string().trim().min(1).optional(),
    establishmentName: z.string().trim().min(1).optional(),
    industry: z.string().trim().min(1).optional(),
    businessCategory: z.string().trim().min(1).optional(),
    minimumEmployees: z.coerce.number().int().min(0).optional(),
    maximumEmployees: z.coerce.number().int().min(0).optional(),
    companyAddress: z.string().trim().min(1).optional(),
    pincode: z.string().trim().min(1).optional(),
    city: z.string().trim().min(1).optional(),
    state: z.string().trim().min(1).optional(),
    emailAddress: z
      .string()
      .trim()
      .email("Enter a valid email address")
      .optional()
      .or(z.literal("")),
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    removeCompanyLogo: z
      .union([z.boolean(), z.literal("true"), z.literal("false")])
      .optional()
      .transform((value) => value === true || value === "true"),
    removeProfilePhoto: z
      .union([z.boolean(), z.literal("true"), z.literal("false")])
      .optional()
      .transform((value) => value === true || value === "true"),
  })
  .superRefine((data, ctx) => {
    if (
      typeof data.minimumEmployees === "number" &&
      typeof data.maximumEmployees === "number" &&
      data.maximumEmployees < data.minimumEmployees
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["maximumEmployees"],
        message:
          "Maximum employees must be greater than or equal to minimum employees",
      });
    }
  });

export type RegisterEmployerSchema = z.infer<typeof registerEmployerSchema>;
export type VerifyEmployerOtpSchema = z.infer<typeof verifyEmployerOtpSchema>;
export type CompleteCompanyProfileSchema = z.infer<
  typeof completeCompanyProfileSchema
>;
export type CompleteIndividualIdentitySchema = z.infer<
  typeof completeIndividualIdentitySchema
>;
export type UpdateEmployerProfileSchema = z.infer<
  typeof updateEmployerProfileSchema
>;