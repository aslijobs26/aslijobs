import { z } from "zod";
import {
  EMPLOYER_ACCOUNT_TYPES,
  EMPLOYER_BUSINESS_DOCUMENT_TYPES,
  EMPLOYER_IDENTITY_DOCUMENT_TYPES,
  OTP_CODE_PATTERN,
  OTP_LENGTH,
  isBusinessEmployerAccountType,
} from "../../constants/employer.constants.js";

const whatsappNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "WhatsApp number must be exactly 10 digits");

const emptyToUndefined = (value: unknown) =>
  value === "" || value === undefined || value === null ? undefined : value;

const optionalUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => {
    if (!value) {
      return true;
    }
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Enter a valid http or https URL")
  .optional();

const optionalNonEmptyString = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1).optional(),
);

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
    .regex(OTP_CODE_PATTERN, `OTP must be a ${OTP_LENGTH}-digit code`),
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
    companyName: optionalNonEmptyString,
    establishmentName: optionalNonEmptyString,
    industry: optionalNonEmptyString,
    businessCategory: optionalNonEmptyString,
    companyDescription: z.string().trim().max(3000).optional(),
    website: optionalUrlSchema,
    foundedYear: z
      .preprocess(
        (value) => (value === "" ? null : value),
        z.coerce.number().int().min(1800).max(2100).nullable(),
      )
      .optional(),
    companyType: z.string().trim().max(100).optional(),
    gstNumber: z.string().trim().max(30).optional(),
    panNumber: z.string().trim().max(20).optional(),
    registrationNumber: z.string().trim().max(100).optional(),
    minimumEmployees: z.coerce.number().int().min(0).optional(),
    maximumEmployees: z.coerce.number().int().min(0).optional(),
    companyAddress: z.string().trim().max(1000).optional(),
    pincode: z.string().trim().max(20).optional(),
    city: z.string().trim().max(150).optional(),
    state: z.string().trim().max(150).optional(),
    emailAddress: z
      .string()
      .trim()
      .email("Enter a valid email address")
      .optional()
      .or(z.literal("")),
    firstName: optionalNonEmptyString,
    lastName: optionalNonEmptyString,
    contactDesignation: z.string().trim().max(150).optional(),
    alternatePhone: z.string().trim().max(30).optional(),
    aboutUs: z.string().trim().max(5000).optional(),
    culture: z.string().trim().max(5000).optional(),
    benefits: z.string().trim().max(5000).optional(),
    vision: z.string().trim().max(1000).optional(),
    mission: z.string().trim().max(1000).optional(),
    values: z.string().trim().max(1000).optional(),
    linkedinUrl: optionalUrlSchema,
    facebookUrl: optionalUrlSchema,
    instagramUrl: optionalUrlSchema,
    twitterUrl: optionalUrlSchema,
    youtubeUrl: optionalUrlSchema,
    removeCompanyMediaPublicIds: z.string().max(10000).optional(),
    companyMediaOrder: z.string().max(10000).optional(),
    removeCompanyLogo: z
      .union([z.boolean(), z.literal("true"), z.literal("false")])
      .optional()
      .transform((value) => value === true || value === "true"),
    removeProfilePhoto: z
      .union([z.boolean(), z.literal("true"), z.literal("false")])
      .optional()
      .transform((value) => value === true || value === "true"),
    companyProfileVisited: z
      .union([z.literal(true), z.literal("true")])
      .optional()
      .transform((value) => (value ? true : undefined)),
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