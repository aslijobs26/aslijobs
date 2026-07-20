"use client";

import { EmployerRegisterOtpInput } from "@/components/employer-register/EmployerRegisterOtpInput";
import {
  JOB_SEEKER_LOGIN_CONTINUE_LABEL,
  JOB_SEEKER_LOGIN_HEADING,
  JOB_SEEKER_LOGIN_OTP_DESCRIPTION,
  JOB_SEEKER_LOGIN_OTP_HEADING,
  JOB_SEEKER_LOGIN_OTP_LENGTH,
  JOB_SEEKER_LOGIN_RESEND_LABEL,
  JOB_SEEKER_LOGIN_RESEND_PROMPT,
  JOB_SEEKER_LOGIN_SEND_OTP_LABEL,
  JOB_SEEKER_LOGIN_SUBTITLE,
  JOB_SEEKER_LOGIN_WHATSAPP_LABEL,
  JOB_SEEKER_LOGIN_WHATSAPP_PLACEHOLDER,
} from "@/constants/job-seeker-login";
import { isValidJobSeekerWhatsappNumber } from "@/constants/job-seeker-register";
import { ROUTES } from "@/constants/routes";
import {
  resendJobSeekerLoginOtp,
  sendJobSeekerLoginOtp,
  verifyJobSeekerLoginOtp,
} from "@/services/job-seeker-login.service";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const EMPTY_OTP_DIGITS = Array.from(
  { length: JOB_SEEKER_LOGIN_OTP_LENGTH },
  () => "",
);

function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function JobSeekerLoginForm() {
  const router = useRouter();
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isOtpVisible, setIsOtpVisible] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(EMPTY_OTP_DIGITS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isWhatsappValid = isValidJobSeekerWhatsappNumber(whatsappNumber);
  const isOtpComplete = otpDigits.every(
    (digit) => digit.length === 1 && /\d/.test(digit),
  );

  const handleWhatsappChange = (value: string) => {
    const nextValue = value.replace(/\D/g, "").slice(0, 10);
    setWhatsappNumber(nextValue);
    setErrorMessage(null);

    if (isOtpVisible) {
      setIsOtpVisible(false);
      setOtpDigits(EMPTY_OTP_DIGITS);
    }
  };

  const handleSendOtp = async () => {
    if (!isWhatsappValid) {
      setErrorMessage("Enter a valid 10-digit WhatsApp number");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await sendJobSeekerLoginOtp(whatsappNumber);
      setOtpDigits(EMPTY_OTP_DIGITS);
      setIsOtpVisible(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to send OTP"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!isWhatsappValid) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await resendJobSeekerLoginOtp(whatsappNumber);
      setOtpDigits(EMPTY_OTP_DIGITS);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to resend OTP"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isOtpVisible) {
      await handleSendOtp();
      return;
    }

    if (!isOtpComplete) {
      setErrorMessage("Enter the 4-digit OTP");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await verifyJobSeekerLoginOtp(whatsappNumber, otpDigits.join(""));
      router.push(ROUTES.JOB_SEEKER_DASHBOARD);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Invalid OTP"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <h1 className="employer-register-form-heading">
        {JOB_SEEKER_LOGIN_HEADING}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {JOB_SEEKER_LOGIN_SUBTITLE}
      </p>

      <form
        className="employer-register-form-fields mt-8 w-full"
        onSubmit={(event) => {
          void handleContinue(event);
        }}
        noValidate
      >
        <div className="employer-register-form-stack">
          <label
            htmlFor="job-seeker-login-whatsapp"
            className="employer-register-form-label"
          >
            {JOB_SEEKER_LOGIN_WHATSAPP_LABEL}
          </label>
          <input
            id="job-seeker-login-whatsapp"
            type="tel"
            inputMode="numeric"
            value={whatsappNumber}
            onChange={(event) => handleWhatsappChange(event.target.value)}
            placeholder={JOB_SEEKER_LOGIN_WHATSAPP_PLACEHOLDER}
            autoComplete="tel"
            className="employer-register-form-input"
            aria-required="true"
            disabled={isSubmitting}
          />
        </div>

        {isOtpVisible ? (
          <div className="employer-register-otp-section">
            <div className="employer-register-form-stack">
              <h2 className="employer-register-otp-heading">
                {JOB_SEEKER_LOGIN_OTP_HEADING}
              </h2>
              <p className="employer-register-otp-description">
                {JOB_SEEKER_LOGIN_OTP_DESCRIPTION}
              </p>
            </div>

            <EmployerRegisterOtpInput
              value={otpDigits}
              onChange={setOtpDigits}
              disabled={isSubmitting}
            />

            <p className="text-center text-sm text-muted">
              {JOB_SEEKER_LOGIN_RESEND_PROMPT}{" "}
              <button
                type="button"
                className="employer-register-send-otp-link inline align-baseline"
                onClick={() => {
                  void handleResendOtp();
                }}
                disabled={isSubmitting}
              >
                {JOB_SEEKER_LOGIN_RESEND_LABEL}
              </button>
            </p>

            {errorMessage ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              className="employer-register-form-submit"
              disabled={!isOtpComplete || isSubmitting}
            >
              {JOB_SEEKER_LOGIN_CONTINUE_LABEL}
            </button>
          </div>
        ) : (
          <>
            {errorMessage ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              className="employer-register-form-submit"
              disabled={!isWhatsappValid || isSubmitting}
            >
              {JOB_SEEKER_LOGIN_SEND_OTP_LABEL}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
