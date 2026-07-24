import { z } from "zod";
import {
  JOB_EDUCATION_LEVELS,
  JOB_EXPERIENCE_LEVELS,
  JOB_GENDERS,
  JOB_LANGUAGES,
  JOB_PERKS,
  JOB_STATUS_ACTIONS,
  JOB_STATUSES,
  JOB_TYPES,
  PART_TIME_SCHEDULES,
  SALARY_PERIODS,
  SALARY_TYPES,
  WORK_MODES,
} from "../../constants/job.constants.js";

const nonEmptyString = (message: string) =>
  z.string().trim().min(1, message);

const optionalString = z.string().trim().optional().default("");

const optionalNullableNumber = z
  .number()
  .nonnegative()
  .nullable()
  .optional()
  .default(null);

export const createJobSchema = z
  .object({
    companyName: nonEmptyString("Company name is required"),
    industry: optionalString,
    businessCategory: optionalString,
    companySize: optionalString,
    jobTitle: nonEmptyString("Job title is required"),
    jobType: z.enum(JOB_TYPES, {
      error: "Job type is required",
    }),
    contractPeriodFrom: optionalString,
    contractPeriodTo: optionalString,
    partTimeSchedule: z
      .union([z.enum(PART_TIME_SCHEDULES), z.literal("")])
      .optional()
      .default(""),
    partTimeStartTime: optionalString,
    partTimeEndTime: optionalString,
    partTimeFlexibleHours: optionalString,
    workMode: z.enum(WORK_MODES, {
      error: "Work mode is required",
    }),
    vacancies: z.coerce
      .number({ error: "Number of vacancies is required" })
      .int("Vacancies must be a whole number")
      .min(1, "At least one vacancy is required"),
    description: nonEmptyString("Job description is required").max(
      3000,
      "Job description must be 3000 characters or less",
    ),
    state: nonEmptyString("State is required"),
    stateName: nonEmptyString("State is required"),
    city: nonEmptyString("City is required"),
    cityName: nonEmptyString("City is required"),
    address: nonEmptyString("Job address is required"),
    landmark: optionalString,
    salaryType: z.enum(SALARY_TYPES, {
      error: "Salary type is required",
    }),
    salaryPeriod: z.enum(SALARY_PERIODS, {
      error: "Salary period is required",
    }),
    fixedSalary: optionalNullableNumber,
    minimumSalary: optionalNullableNumber,
    maximumSalary: optionalNullableNumber,
    perks: z.array(z.enum(JOB_PERKS)).default([]),
    education: z
      .array(z.enum(JOB_EDUCATION_LEVELS))
      .min(1, "Education is required"),
    experience: z.enum(JOB_EXPERIENCE_LEVELS, {
      error: "Experience is required",
    }),
    languages: z.array(z.enum(JOB_LANGUAGES)).default([]),
    gender: z.array(z.enum(JOB_GENDERS)).default([]),
    minimumAge: optionalNullableNumber,
    maximumAge: optionalNullableNumber,
    walkInEnabled: z.boolean(),
    interviewAddress: optionalString,
    walkInStartDate: optionalString,
    walkInEndDate: optionalString,
    walkInStartTime: optionalString,
    walkInEndTime: optionalString,
    interviewInstructions: z
      .string()
      .trim()
      .max(3000, "Other instructions must be 3000 characters or less")
      .optional()
      .default(""),
    contactPersonName: nonEmptyString("Contact person name is required"),
    contactEmail: z
      .string()
      .trim()
      .email("Enter a valid email address"),
    contactMobile: z
      .string()
      .trim()
      .regex(/^\d{10}$/, "Mobile number must be 10 digits"),
    status: z.enum(JOB_STATUSES).optional().default("active"),
  })
  .superRefine((data, ctx) => {
    if (data.jobType === "contract") {
      if (!data.contractPeriodFrom) {
        ctx.addIssue({
          code: "custom",
          path: ["contractPeriodFrom"],
          message: "Contract duration start is required",
        });
      }
      if (!data.contractPeriodTo) {
        ctx.addIssue({
          code: "custom",
          path: ["contractPeriodTo"],
          message: "Contract duration end is required",
        });
      }
    }

    if (data.jobType === "part-time") {
      if (!data.partTimeSchedule) {
        ctx.addIssue({
          code: "custom",
          path: ["partTimeSchedule"],
          message: "Part-time schedule is required",
        });
      }

      if (data.partTimeSchedule === "fixed-timings") {
        if (!data.partTimeStartTime) {
          ctx.addIssue({
            code: "custom",
            path: ["partTimeStartTime"],
            message: "Part-time start time is required",
          });
        }
        if (!data.partTimeEndTime) {
          ctx.addIssue({
            code: "custom",
            path: ["partTimeEndTime"],
            message: "Part-time end time is required",
          });
        }
      }

      if (
        data.partTimeSchedule === "flexible-hours" &&
        !data.partTimeFlexibleHours
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["partTimeFlexibleHours"],
          message: "Flexible hours are required",
        });
      }
    }

    if (data.salaryType === "fixed") {
      if (data.fixedSalary === null || data.fixedSalary === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["fixedSalary"],
          message: "Salary amount is required",
        });
      }
    }

    if (data.salaryType === "range") {
      if (data.minimumSalary === null || data.minimumSalary === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["minimumSalary"],
          message: "Minimum salary is required",
        });
      }
      if (data.maximumSalary === null || data.maximumSalary === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["maximumSalary"],
          message: "Maximum salary is required",
        });
      }
      if (
        data.minimumSalary != null &&
        data.maximumSalary != null &&
        data.minimumSalary > data.maximumSalary
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["maximumSalary"],
          message: "Maximum salary must be greater than or equal to minimum salary",
        });
      }
    }

    if (
      data.minimumAge != null &&
      data.maximumAge != null &&
      data.minimumAge > data.maximumAge
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["minimumAge"],
        message: "Minimum age cannot exceed maximum age",
      });
    }

    if (data.walkInEnabled) {
      if (!data.interviewAddress) {
        ctx.addIssue({
          code: "custom",
          path: ["interviewAddress"],
          message: "Interview address is required",
        });
      }
      if (!data.walkInStartDate) {
        ctx.addIssue({
          code: "custom",
          path: ["walkInStartDate"],
          message: "Walk-in start date is required",
        });
      }
      if (!data.walkInEndDate) {
        ctx.addIssue({
          code: "custom",
          path: ["walkInEndDate"],
          message: "Walk-in end date is required",
        });
      }
      if (!data.walkInStartTime) {
        ctx.addIssue({
          code: "custom",
          path: ["walkInStartTime"],
          message: "Walk-in start time is required",
        });
      }
      if (!data.walkInEndTime) {
        ctx.addIssue({
          code: "custom",
          path: ["walkInEndTime"],
          message: "Walk-in end time is required",
        });
      }
    }
  });

export const listEmployerJobsQuerySchema = z.object({
  status: z.enum(JOB_STATUSES).optional(),
  search: z.string().trim().optional().default(""),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export const PUBLIC_JOB_SORTS = [
  "relevant",
  "latest",
  "salary_desc",
  "salary_asc",
] as const;

function parseCsvEnumValues<T extends readonly [string, ...string[]]>(
  values: T,
  raw: string | undefined,
): T[number][] {
  if (!raw?.trim()) {
    return [];
  }

  const allowed = new Set<string>(values);
  const parsed: T[number][] = [];

  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (!trimmed || !allowed.has(trimmed)) {
      continue;
    }
    if (!parsed.includes(trimmed as T[number])) {
      parsed.push(trimmed as T[number]);
    }
  }

  return parsed;
}

function toPublicLocationSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseLocationSlugs(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }

  const parsed: string[] = [];
  for (const part of raw.split(",")) {
    const slug = toPublicLocationSlug(part);
    if (!slug || parsed.includes(slug)) {
      continue;
    }
    parsed.push(slug);
  }

  return parsed;
}

export const publicJobsQuerySchema = z.object({
  search: z.string().trim().optional().default(""),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  city: z
    .string()
    .optional()
    .transform((value) => parseLocationSlugs(value)),
  state: z
    .string()
    .optional()
    .transform((value) => {
      if (!value?.trim()) {
        return undefined;
      }
      return toPublicLocationSlug(value) || undefined;
    }),
  jobType: z
    .string()
    .optional()
    .transform((value) => parseCsvEnumValues(JOB_TYPES, value)),
  experience: z
    .string()
    .optional()
    .transform((value) => parseCsvEnumValues(JOB_EXPERIENCE_LEVELS, value)),
  gender: z
    .string()
    .optional()
    .transform((value) => parseCsvEnumValues(JOB_GENDERS, value)),
  workMode: z
    .string()
    .optional()
    .transform((value) => parseCsvEnumValues(WORK_MODES, value)),
  minSalary: z.preprocess(
    (value) =>
      value === "" || value === undefined || value === null ? undefined : value,
    z.coerce.number().nonnegative().optional(),
  ),
  maxSalary: z.preprocess(
    (value) =>
      value === "" || value === undefined || value === null ? undefined : value,
    z.coerce.number().nonnegative().optional(),
  ),
  sort: z.enum(PUBLIC_JOB_SORTS).optional().default("relevant"),
});

export const jobIdParamsSchema = z.object({
  jobId: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid job id"),
});

export const publicJobIdParamsSchema = z.object({
  publicJobId: z
    .string()
    .trim()
    .regex(/^AJ-\d{4}-\d{6}$/i, "Invalid public job id"),
});

export const updateJobStatusSchema = z.object({
  action: z.enum(JOB_STATUS_ACTIONS, {
    error: "Status action is required",
  }),
});

export const updateActiveJobSchema = createJobSchema;

const draftWizardSnapshotSchema = z.object({
  jobInformation: z.object({
    companyDetails: z.string(),
    industry: z.string().optional().default(""),
    businessCategory: z.string().optional().default(""),
    companySize: z.string().optional().default(""),
    jobTitle: z.string(),
    jobType: z.string(),
    contractPeriodFrom: z.string(),
    contractPeriodTo: z.string(),
    partTimeSchedule: z.string(),
    partTimeStartTime: z.string(),
    partTimeEndTime: z.string(),
    partTimeFlexibleHours: z.string(),
    workMode: z.string(),
    vacancies: z.string(),
    jobDescription: z
      .string()
      .max(3000, "Job description must be 3000 characters or less"),
  }),
  locationAndSalary: z.object({
    state: z.string(),
    city: z.string(),
    address: z.string(),
    landmark: z.string(),
    salaryType: z.string(),
    salaryPeriod: z.string().optional().default(""),
    salaryMin: z.string(),
    salaryMax: z.string(),
    incentives: z.string(),
    perks: z.array(z.string()),
  }),
  candidateAndInterview: z.object({
    education: z.array(z.string()),
    experienceRequired: z.string(),
    additionalRequirements: z.object({
      language: z.boolean(),
      gender: z.boolean(),
      age: z.boolean(),
    }),
    languages: z.array(z.string()),
    gender: z.array(z.string()),
    ageMin: z.string(),
    ageMax: z.string(),
    walkIn: z.string(),
    walkInAddress: z.string(),
    walkInStartDate: z.string(),
    walkInEndDate: z.string(),
    walkInStartTime: z.string(),
    walkInEndTime: z.string(),
    otherInstructions: z
      .string()
      .max(3000, "Other instructions must be 3000 characters or less"),
    contactName: z.string(),
    contactEmail: z.string(),
    contactMobile: z.string(),
  }),
});

function draftSnapshotHasMeaningfulContent(
  snapshot: z.infer<typeof draftWizardSnapshotSchema>,
): boolean {
  const { jobInformation, locationAndSalary, candidateAndInterview } = snapshot;

  const stringFields = [
    jobInformation.companyDetails,
    jobInformation.industry,
    jobInformation.businessCategory,
    jobInformation.companySize,
    jobInformation.jobTitle,
    jobInformation.jobType,
    jobInformation.contractPeriodFrom,
    jobInformation.contractPeriodTo,
    jobInformation.partTimeSchedule,
    jobInformation.partTimeStartTime,
    jobInformation.partTimeEndTime,
    jobInformation.partTimeFlexibleHours,
    jobInformation.workMode,
    jobInformation.vacancies,
    jobInformation.jobDescription,
    locationAndSalary.state,
    locationAndSalary.city,
    locationAndSalary.address,
    locationAndSalary.landmark,
    locationAndSalary.salaryType,
    locationAndSalary.salaryPeriod,
    locationAndSalary.salaryMin,
    locationAndSalary.salaryMax,
    locationAndSalary.incentives,
    candidateAndInterview.experienceRequired,
    candidateAndInterview.ageMin,
    candidateAndInterview.ageMax,
    candidateAndInterview.walkInAddress,
    candidateAndInterview.walkInStartDate,
    candidateAndInterview.walkInEndDate,
    candidateAndInterview.walkInStartTime,
    candidateAndInterview.walkInEndTime,
    candidateAndInterview.otherInstructions,
    candidateAndInterview.contactName,
    candidateAndInterview.contactEmail,
    candidateAndInterview.contactMobile,
  ];

  if (stringFields.some((value) => value.trim().length > 0)) {
    return true;
  }

  if (locationAndSalary.perks.length > 0) {
    return true;
  }

  if (candidateAndInterview.education.length > 0) {
    return true;
  }

  if (candidateAndInterview.languages.length > 0) {
    return true;
  }

  if (candidateAndInterview.gender.length > 0) {
    return true;
  }

  return false;
}

export const saveDraftJobSchema = z
  .object({
    completedStep: z.coerce.number().int().min(1).max(3),
    wizardSnapshot: draftWizardSnapshotSchema,
  })
  .superRefine((data, ctx) => {
    if (!draftSnapshotHasMeaningfulContent(data.wizardSnapshot)) {
      ctx.addIssue({
        code: "custom",
        path: ["wizardSnapshot"],
        message: "Draft requires at least one filled field",
      });
    }
  });

export const publishDraftJobSchema = createJobSchema;

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type ListEmployerJobsQuery = z.infer<typeof listEmployerJobsQuerySchema>;
export type PublicJobsQuery = z.infer<typeof publicJobsQuerySchema>;
export type UpdateJobStatusInput = z.infer<typeof updateJobStatusSchema>;
export type SaveDraftJobInput = z.infer<typeof saveDraftJobSchema>;
export type PublishDraftJobInput = z.infer<typeof publishDraftJobSchema>;
export type UpdateActiveJobInput = z.infer<typeof updateActiveJobSchema>;
export type DraftWizardSnapshot = z.infer<typeof draftWizardSnapshotSchema>;
export type PublicJobIdParams = z.infer<typeof publicJobIdParamsSchema>;
