import { z } from "zod";

const whatsappNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "WhatsApp number must be exactly 10 digits");

export const employerLoginSendOtpSchema = z.object({
  whatsappNumber: whatsappNumberSchema,
});

export const employerLoginResendOtpSchema = z.object({
  whatsappNumber: whatsappNumberSchema,
});

export const employerLoginVerifyOtpSchema = z.object({
  whatsappNumber: whatsappNumberSchema,
  otp: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "OTP must be a 4-digit code"),
});

export type EmployerLoginSendOtpSchema = z.infer<
  typeof employerLoginSendOtpSchema
>;
export type EmployerLoginResendOtpSchema = z.infer<
  typeof employerLoginResendOtpSchema
>;
export type EmployerLoginVerifyOtpSchema = z.infer<
  typeof employerLoginVerifyOtpSchema
>;
