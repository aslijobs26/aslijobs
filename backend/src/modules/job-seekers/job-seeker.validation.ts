import { z } from "zod";
import { JOB_SEEKER_GENDERS } from "../../constants/job-seeker.constants.js";

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

export const completeJobSeekerRegistrationSchema = z.object({
  jobSeekerId: jobSeekerIdSchema,
  dateOfBirth: dateOfBirthSchema,
  gender: z.enum(JOB_SEEKER_GENDERS, {
    message: "Select a valid gender",
  }),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  jobRole: z.string().trim().min(1, "Job role is required"),
  preferredJobLocation: z
    .string()
    .trim()
    .min(1, "Preferred job location is required"),
});

export type RegisterJobSeekerSchema = z.infer<typeof registerJobSeekerSchema>;
export type VerifyJobSeekerOtpSchema = z.infer<typeof verifyJobSeekerOtpSchema>;
export type ResendJobSeekerOtpSchema = z.infer<typeof resendJobSeekerOtpSchema>;
export type CompleteJobSeekerRegistrationSchema = z.infer<
  typeof completeJobSeekerRegistrationSchema
>;
