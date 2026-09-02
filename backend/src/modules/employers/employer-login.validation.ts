import { z } from "zod";
import {
  OTP_CODE_PATTERN,
  OTP_LENGTH,
} from "../../constants/employer.constants.js";

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
    .regex(OTP_CODE_PATTERN, `OTP must be a ${OTP_LENGTH}-digit code`),
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
