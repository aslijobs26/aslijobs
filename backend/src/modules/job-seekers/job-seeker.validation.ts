import { z } from "zod";
import {
  JOB_SEEKER_AVAILABILITY_STATUSES,
  JOB_SEEKER_EDUCATION_LEVELS,
  JOB_SEEKER_EXPERIENCE_TYPES,
  JOB_SEEKER_GENDERS,
  JOB_SEEKER_JOB_TYPES,
  JOB_SEEKER_LANGUAGES,
  JOB_SEEKER_PROFILE_VISIBILITY,
  JOB_SEEKER_SALARY_PERIODS,
  JOB_SEEKER_WORK_MODES,
} from "../../constants/job-seeker.constants.js";

const whatsappNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "WhatsApp number must be exactly 10 digits");

const jobSeekerIdSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid job seeker id");

const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, "OTP must be a 4-digit code");

const dateOfBirthSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() + 1 === month &&
      date.getUTCDate() === day &&
      date.getTime() < Date.now()
    );
  }, "Enter a valid date of birth in the past");

function getLocalTodayIsoDate() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function isValidCalendarIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

const experienceDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  .refine(
    (value) => isValidCalendarIsoDate(value),
    "Enter a valid calendar date",
  )
  .refine(
    (value) => value <= getLocalTodayIsoDate(),
    "Date cannot be in the future",
  );

const optionalText = z.string().trim().optional().default("");

const educationSchema = z
  .object({
    level: z.enum(JOB_SEEKER_EDUCATION_LEVELS, {
      message: "Select a valid education level",
    }),
    schoolName: optionalText,
    collegeName: optionalText,
    instituteName: optionalText,
    board: optionalText,
    stream: optionalText,
    trade: optionalText,
    branch: optionalText,
    degree: optionalText,
    specialization: optionalText,
    passingYear: optionalText,
    percentage: optionalText,
    cgpa: optionalText,
  })
  .superRefine((value, ctx) => {
    const requireField = (field: keyof typeof value, message: string) => {
      if (!value[field]?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message,
        });
      }
    };

    switch (value.level) {
      case "below_10th":
        requireField("schoolName", "School name is required");
        break;
      case "10th_pass":
        requireField("schoolName", "School name is required");
        requireField("board", "Board is required");
        requireField("passingYear", "Passing year is required");
        break;
      case "intermediate":
        requireField("collegeName", "College name is required");
        requireField("stream", "Stream is required");
        requireField("passingYear", "Passing year is required");
        break;
      case "iti":
        requireField("instituteName", "Institute name is required");
        requireField("trade", "Trade is required");
        requireField("passingYear", "Passing year is required");
        break;
      case "diploma":
        requireField("collegeName", "College name is required");
        requireField("branch", "Branch is required");
        requireField("passingYear", "Passing year is required");
        break;
      case "graduation":
      case "post_graduation":
        requireField("collegeName", "College name is required");
        requireField("degree", "Degree is required");
        requireField("specialization", "Specialization is required");
        requireField("passingYear", "Passing year is required");
        break;
      default:
        break;
    }
  });

const experienceEntrySchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required"),
  jobRole: z.string().trim().min(1, "Job role is required"),
  industry: z.string().trim().min(1, "Industry is required"),
  startDate: experienceDateSchema,
  endDate: z.string().trim().optional().default(""),
  currentlyWorking: z.boolean().optional().default(false),
  duration: z.string().trim().optional().default(""),
  salary: z.string().trim().min(1, "Salary is required"),
  location: z.string().trim().min(1, "Location is required"),
});

export const registerJobSeekerSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  whatsappNumber: whatsappNumberSchema,
});

export const verifyJobSeekerOtpSchema = z.object({
  jobSeekerId: jobSeekerIdSchema,
  otp: otpSchema,
});

export const resendJobSeekerOtpSchema = z.object({
  jobSeekerId: jobSeekerIdSchema,
});

export const saveJobSeekerPreferencesSchema = z.object({
  jobSeekerId: jobSeekerIdSchema,
  dateOfBirth: dateOfBirthSchema,
  gender: z.enum(JOB_SEEKER_GENDERS, {
    message: "Select a valid gender",
  }),
  jobRole: z.string().trim().min(1, "Job role is required"),
  jobType: z.enum(JOB_SEEKER_JOB_TYPES, {
    message: "Select a valid job type",
  }),
  workMode: z.enum(JOB_SEEKER_WORK_MODES, {
    message: "Select a valid work mode",
  }),
  preferredJobLocation: z
    .string()
    .trim()
    .min(1, "Preferred job location is required"),
  expectedSalary: z.coerce
    .number()
    .int("Expected salary must be a whole number")
    .positive("Expected salary must be greater than 0"),
  expectedSalaryPeriod: z.enum(JOB_SEEKER_SALARY_PERIODS, {
    message: "Select a valid salary period",
  }),
});

export const completeJobSeekerRegistrationSchema = z
  .object({
    jobSeekerId: jobSeekerIdSchema,
    education: educationSchema,
    experienceType: z.enum(JOB_SEEKER_EXPERIENCE_TYPES, {
      message: "Select fresher or experienced",
    }),
    experiences: z.array(experienceEntrySchema).optional().default([]),
    languages: z
      .array(z.enum(JOB_SEEKER_LANGUAGES))
      .min(1, "Select at least one language"),
    availabilityStatus: z.enum(JOB_SEEKER_AVAILABILITY_STATUSES, {
      message: "Please select your availability status.",
    }),
  })
  .superRefine((value, ctx) => {
    if (value.experienceType === "experienced" && value.experiences.length < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["experiences"],
        message: "Add at least one work experience",
      });
    }

    if (value.experienceType === "experienced") {
      value.experiences.forEach((entry, index) => {
        if (!entry.currentlyWorking && !entry.endDate.trim()) {
          ctx.addIssue({
            code: "custom",
            path: ["experiences", index, "endDate"],
            message: "End date is required unless currently working",
          });
          return;
        }

        if (entry.currentlyWorking) {
          return;
        }

        const endDateResult = experienceDateSchema.safeParse(entry.endDate);
        if (!endDateResult.success) {
          ctx.addIssue({
            code: "custom",
            path: ["experiences", index, "endDate"],
            message:
              endDateResult.error.issues[0]?.message ??
              "Enter a valid end date",
          });
          return;
        }

        if (entry.endDate < entry.startDate) {
          ctx.addIssue({
            code: "custom",
            path: ["experiences", index, "endDate"],
            message: "End date cannot be before start date",
          });
        }
      });
    }
  });

export const searchJobSeekerRolesQuerySchema = z.object({
  search: z.string().trim().optional().default(""),
  limit: z.coerce.number().int().min(1).max(20).optional().default(10),
});

const profileExperienceEntrySchema = experienceEntrySchema.extend({
  responsibilities: z.string().trim().optional().default(""),
  achievements: z.string().trim().optional().default(""),
});

export const updateJobSeekerProfileSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required").optional(),
    dateOfBirth: dateOfBirthSchema.optional(),
    gender: z
      .enum(JOB_SEEKER_GENDERS, {
        message: "Select a valid gender",
      })
      .optional(),
    pincode: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    jobRole: z.string().trim().min(1, "Job role is required").optional(),
    jobType: z
      .enum(JOB_SEEKER_JOB_TYPES, {
        message: "Select a valid job type",
      })
      .optional(),
    workMode: z
      .enum(JOB_SEEKER_WORK_MODES, {
        message: "Select a valid work mode",
      })
      .optional(),
    preferredJobLocation: z
      .string()
      .trim()
      .min(1, "Preferred job location is required")
      .optional(),
    expectedSalary: z.coerce
      .number()
      .int("Expected salary must be a whole number")
      .positive("Expected salary must be greater than 0")
      .nullable()
      .optional(),
    expectedSalaryPeriod: z
      .enum(JOB_SEEKER_SALARY_PERIODS, {
        message: "Select a valid salary period",
      })
      .optional(),
    education: educationSchema.nullable().optional(),
    experienceType: z
      .enum(JOB_SEEKER_EXPERIENCE_TYPES, {
        message: "Select fresher or experienced",
      })
      .optional(),
    experiences: z.array(profileExperienceEntrySchema).optional(),
    languages: z
      .array(z.enum(JOB_SEEKER_LANGUAGES))
      .min(1, "Select at least one language")
      .optional(),
    availabilityStatus: z
      .enum(JOB_SEEKER_AVAILABILITY_STATUSES, {
        message: "Please select your availability status.",
      })
      .nullable()
      .optional(),
    professionalSummary: z.string().trim().max(2000).optional(),
    skills: z
      .array(z.string().trim().min(1).max(80))
      .max(40)
      .optional(),
    profileVisibility: z
      .enum(JOB_SEEKER_PROFILE_VISIBILITY, {
        message: "Select a valid visibility option",
      })
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.experiences) {
      return;
    }

    value.experiences.forEach((entry, index) => {
      if (!entry.currentlyWorking && !entry.endDate.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["experiences", index, "endDate"],
          message: "End date is required unless currently working",
        });
        return;
      }

      if (entry.currentlyWorking) {
        return;
      }

      const endDateResult = experienceDateSchema.safeParse(entry.endDate);
      if (!endDateResult.success) {
        ctx.addIssue({
          code: "custom",
          path: ["experiences", index, "endDate"],
          message:
            endDateResult.error.issues[0]?.message ?? "Enter a valid end date",
        });
        return;
      }

      if (entry.endDate < entry.startDate) {
        ctx.addIssue({
          code: "custom",
          path: ["experiences", index, "endDate"],
          message: "End date cannot be before start date",
        });
      }
    });
  });

export type RegisterJobSeekerSchema = z.infer<typeof registerJobSeekerSchema>;
export type VerifyJobSeekerOtpSchema = z.infer<typeof verifyJobSeekerOtpSchema>;
export type ResendJobSeekerOtpSchema = z.infer<typeof resendJobSeekerOtpSchema>;
export type SaveJobSeekerPreferencesSchema = z.infer<
  typeof saveJobSeekerPreferencesSchema
>;
export type CompleteJobSeekerRegistrationSchema = z.infer<
  typeof completeJobSeekerRegistrationSchema
>;
export type SearchJobSeekerRolesQuery = z.infer<
  typeof searchJobSeekerRolesQuerySchema
>;
export type UpdateJobSeekerProfileSchema = z.infer<
  typeof updateJobSeekerProfileSchema
>;
