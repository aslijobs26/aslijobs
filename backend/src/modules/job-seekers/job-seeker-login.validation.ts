import { z } from "zod";
import {
  OTP_CODE_PATTERN,
  OTP_LENGTH,
} from "../../constants/employer.constants.js";

const whatsappNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "WhatsApp number must be exactly 10 digits");

export const jobSeekerLoginSendOtpSchema = z.object({
  whatsappNumber: whatsappNumberSchema,
});

export const jobSeekerLoginResendOtpSchema = z.object({
  whatsappNumber: whatsappNumberSchema,
});

export const jobSeekerLoginVerifyOtpSchema = z.object({
  whatsappNumber: whatsappNumberSchema,
  otp: z
    .string()
    .trim()
    .regex(OTP_CODE_PATTERN, `OTP must be a ${OTP_LENGTH}-digit code`),
});

export type JobSeekerLoginSendOtpSchema = z.infer<
  typeof jobSeekerLoginSendOtpSchema
>;
export type JobSeekerLoginResendOtpSchema = z.infer<
  typeof jobSeekerLoginResendOtpSchema
>;
export type JobSeekerLoginVerifyOtpSchema = z.infer<
  typeof jobSeekerLoginVerifyOtpSchema
>;
