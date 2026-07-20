import { z } from "zod";

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
    .regex(/^\d{4}$/, "OTP must be a 4-digit code"),
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
