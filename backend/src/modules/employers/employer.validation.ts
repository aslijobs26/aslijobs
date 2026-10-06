import { z } from "zod";
import {
  EMPLOYER_ACCOUNT_TYPES,
  EMPLOYER_BUSINESS_DOCUMENT_TYPES,
  EMPLOYER_IDENTITY_DOCUMENT_TYPES,
  OTP_CODE_PATTERN,
  OTP_LENGTH,
  isBusinessEmployerAccountType,
} from "../../constants/employer.constants.js";

export const EMPLOYER_WHATSAPP_INVALID_MESSAGE =
  "Enter a valid WhatsApp number.";

const whatsappNumberSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, EMPLOYER_WHATSAPP_INVALID_MESSAGE);

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

const nullableNonNegativeInt = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) {
    return null;
  }

  return value;
}, z.coerce.number().int().min(0).nullable());

export type OperationsCompleteEmployerProfileFields = {
  accountType: (typeof EMPLOYER_ACCOUNT_TYPES)[number];
  companyName: string;
  establishmentName: string;
  industry: string;
  businessCategory: string;
  minimumEmployees: number | null;
  maximumEmployees: number | null;
  companyAddress: string;
  pincode: string;
  city: string;
  state: string;
};

/**
 * Drops category-only values so a Company → Consultancy → Individual switch
 * cannot persist hidden fields.
 */
export function isolateOperationsEmployerProfileFields(
  accountType: (typeof EMPLOYER_ACCOUNT_TYPES)[number],
  input: Omit<OperationsCompleteEmployerProfileFields, "accountType">,
): OperationsCompleteEmployerProfileFields {
  if (accountType === "individual") {
    return {
      accountType,
      companyName: "",
      establishmentName: input.establishmentName.trim(),
      industry: "",
      businessCategory: "",
      minimumEmployees: null,
      maximumEmployees: null,
      companyAddress: "",
      pincode: "",
      city: "",
      state: "",
    };
  }

  if (accountType === "consultancy") {
    return {
      accountType,
      companyName: input.companyName.trim(),
      establishmentName: "",
      industry: "",
      businessCategory: "",
      minimumEmployees: null,
      maximumEmployees: null,
      companyAddress: input.companyAddress.trim(),
      pincode: input.pincode.trim(),
      city: input.city.trim(),
      state: input.state.trim(),
    };
  }

  return {
    accountType,
    companyName: input.companyName.trim(),
    establishmentName: "",
    industry: input.industry.trim(),
    businessCategory: input.businessCategory.trim(),
    minimumEmployees:
      typeof input.minimumEmployees === "number" ? input.minimumEmployees : null,
    maximumEmployees:
      typeof input.maximumEmployees === "number" ? input.maximumEmployees : null,
    companyAddress: input.companyAddress.trim(),
    pincode: input.pincode.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
  };
}

export const operationsCompleteEmployerProfileSchema = z
  .object({
    accountType: z.enum(EMPLOYER_ACCOUNT_TYPES),
    companyName: z.string().trim().default(""),
    establishmentName: z.string().trim().default(""),
    industry: z.string().trim().optional().default(""),
    businessCategory: z.string().trim().optional().default(""),
    minimumEmployees: nullableNonNegativeInt,
    maximumEmployees: nullableNonNegativeInt,
    companyAddress: z.string().trim().default(""),
    pincode: z.string().trim().default(""),
    city: z.string().trim().default(""),
    state: z.string().trim().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.accountType === "individual") {
      if (!data.establishmentName.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["establishmentName"],
          message: "Establishment Name is required",
        });
      }
      return;
    }

    if (!data.companyName.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["companyName"],
        message:
          data.accountType === "consultancy"
            ? "Consultancy Name is required"
            : "Company / Business Name is required",
      });
    }

    if (!data.companyAddress.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["companyAddress"],
        message: "Company address is required",
      });
    }

    if (!data.pincode.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["pincode"],
        message: "Pincode is required",
      });
    }

    if (!data.city.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["city"],
        message: "City is required",
      });
    }

    if (!data.state.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["state"],
        message: "State is required",
      });
    }

    if (data.accountType !== "company") {
      return;
    }

    if (!data.industry.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["industry"],
        message: "Industry is required",
      });
    }

    if (!data.businessCategory.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["businessCategory"],
        message: "Business category is required",
      });
    }

    if (
      typeof data.minimumEmployees !== "number" ||
      typeof data.maximumEmployees !== "number"
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["minimumEmployees"],
        message: "Company strength is required",
      });
      return;
    }

    if (data.maximumEmployees < data.minimumEmployees) {
      ctx.addIssue({
        code: "custom",
        path: ["maximumEmployees"],
        message:
          "Maximum employees must be greater than or equal to minimum employees",
      });
    }
  })
  .transform((data) => isolateOperationsEmployerProfileFields(data.accountType, data));

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
export type OperationsCompleteEmployerProfileSchema = z.infer<
  typeof operationsCompleteEmployerProfileSchema
>;
export type UpdateEmployerProfileSchema = z.infer<
  typeof updateEmployerProfileSchema
>;