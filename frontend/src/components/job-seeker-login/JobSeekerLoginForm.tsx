"use client";

import { FieldError } from "@/components/auth/FieldError";
import { RequiredFieldLabel } from "@/components/auth/RequiredFieldLabel";
import { EmployerRegisterOtpInput } from "@/components/employer-register/EmployerRegisterOtpInput";
import { AUTH_VALIDATION_MESSAGES } from "@/constants/auth-validation-messages";
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
import { useOtpResendCooldown } from "@/hooks/useOtpResendCooldown";
import {
  resendJobSeekerLoginOtp,
  sendJobSeekerLoginOtp,
  verifyJobSeekerLoginOtp,
} from "@/services/job-seeker-login.service";
import {
  clearFieldError,
  focusFirstInvalidField,
  mergeFieldErrors,
  type AuthFieldErrors,
} from "@/utils/auth-field-errors";
import { establishJobSeekerClientSession } from "@/utils/job-seeker-session";
import { normalizeApiError } from "@/utils/normalize-api-error";
import {
  getSafeReturnUrl,
  JOB_SEEKER_LOGIN_RETURN_URL_QUERY,
} from "@/utils/safe-return-url";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

function readLoginReturnUrl(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  return getSafeReturnUrl(params.get(JOB_SEEKER_LOGIN_RETURN_URL_QUERY));
}

const EMPTY_OTP_DIGITS = Array.from(
  { length: JOB_SEEKER_LOGIN_OTP_LENGTH },
  () => "",
);

function applyApiFailure(error: unknown): {
  formError: string;
  fieldErrors: AuthFieldErrors;
} {
  const normalized = normalizeApiError(error);
  const fieldErrors: AuthFieldErrors = { ...normalized.fieldErrors };

  const otpMessages = new Set<string>([
    AUTH_VALIDATION_MESSAGES.OTP_INVALID,
    AUTH_VALIDATION_MESSAGES.OTP_EXPIRED,
    AUTH_VALIDATION_MESSAGES.OTP_TOO_MANY,
    AUTH_VALIDATION_MESSAGES.OTP_REQUIRED,
  ]);

  if (otpMessages.has(normalized.message) && !fieldErrors.otp) {
    fieldErrors.otp = normalized.message;
  }

  if (
    (normalized.message === AUTH_VALIDATION_MESSAGES.LOGIN_NOT_REGISTERED ||
      normalized.message === AUTH_VALIDATION_MESSAGES.COMPLETE_REGISTRATION ||
      normalized.message === AUTH_VALIDATION_MESSAGES.ACCOUNT_SUSPENDED ||
      normalized.message === AUTH_VALIDATION_MESSAGES.ACCOUNT_INACTIVE) &&
    !fieldErrors.whatsappNumber
  ) {
    fieldErrors.whatsappNumber = normalized.message;
  }

  return {
    formError: normalized.message,
    fieldErrors,
  };
}

function validateWhatsapp(whatsappNumber: string): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  if (!whatsappNumber.trim()) {
    errors.whatsappNumber = AUTH_VALIDATION_MESSAGES.WHATSAPP_REQUIRED;
  } else if (!isValidJobSeekerWhatsappNumber(whatsappNumber)) {
    errors.whatsappNumber = AUTH_VALIDATION_MESSAGES.WHATSAPP_INVALID;
  }

  return errors;
}

function validateOtpDigits(otpDigits: string[]): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const isComplete = otpDigits.every(
    (digit) => digit.length === 1 && /\d/.test(digit),
  );

  if (!isComplete) {
    errors.otp = AUTH_VALIDATION_MESSAGES.OTP_REQUIRED;
  }

  return errors;
}

export function JobSeekerLoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isOtpVisible, setIsOtpVisible] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(EMPTY_OTP_DIGITS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const { secondsLeft, isCoolingDown, startCooldown, resetCooldown } =
    useOtpResendCooldown();

  const whatsappErrorId = "job-seeker-login-whatsapp-error";
  const otpErrorId = "job-seeker-login-otp-error";
  const formErrorId = "job-seeker-login-form-error";

  const clearErrors = () => {
    setFormError(null);
    setFieldErrors({});
  };

  const clearSingleFieldError = (field: string) => {
    setFieldErrors((current) => clearFieldError(current, field));
    setFormError(null);
  };

  const showClientErrors = (errors: AuthFieldErrors) => {
    setFieldErrors(errors);
    setFormError(null);
    focusFirstInvalidField(errors);
  };

  const showApiFailure = (error: unknown) => {
    const { formError: message, fieldErrors: apiFieldErrors } =
      applyApiFailure(error);
    setFormError(message);
    setFieldErrors((current) => mergeFieldErrors(current, apiFieldErrors));
    if (Object.keys(apiFieldErrors).length > 0) {
      focusFirstInvalidField(apiFieldErrors);
    }
  };

  const handleWhatsappChange = (value: string) => {
    const nextValue = value.replace(/\D/g, "").slice(0, 10);
    setWhatsappNumber(nextValue);
    clearSingleFieldError("whatsappNumber");

    if (isOtpVisible) {
      setIsOtpVisible(false);
      setOtpDigits(EMPTY_OTP_DIGITS);
      clearSingleFieldError("otp");
      resetCooldown();
    }
  };

  const handleSendOtp = async () => {
    if (isSubmitting) {
      return;
    }

    const errors = validateWhatsapp(whatsappNumber);
    if (Object.keys(errors).length > 0) {
      showClientErrors(errors);
      return;
    }

    setIsSubmitting(true);
    clearErrors();

    try {
      const result = await sendJobSeekerLoginOtp(whatsappNumber);
      setOtpDigits(EMPTY_OTP_DIGITS);
      setIsOtpVisible(true);
      startCooldown(result.resendAvailableIn);
    } catch (error) {
      showApiFailure(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (isCoolingDown || isSubmitting) {
      return;
    }

    const errors = validateWhatsapp(whatsappNumber);
    if (Object.keys(errors).length > 0) {
      showClientErrors(errors);
      return;
    }

    setIsSubmitting(true);
    clearErrors();

    try {
      const result = await resendJobSeekerLoginOtp(whatsappNumber);
      setOtpDigits(EMPTY_OTP_DIGITS);
      startCooldown(result.resendAvailableIn);
    } catch (error) {
      showApiFailure(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!isOtpVisible) {
      await handleSendOtp();
      return;
    }

    const errors = {
      ...validateWhatsapp(whatsappNumber),
      ...validateOtpDigits(otpDigits),
    };

    if (Object.keys(errors).length > 0) {
      showClientErrors(errors);
      return;
    }

    setIsSubmitting(true);
    clearErrors();

    try {
      const data = await verifyJobSeekerLoginOtp(
        whatsappNumber,
        otpDigits.join(""),
      );
      await establishJobSeekerClientSession(queryClient, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        jobSeeker: data.jobSeeker,
      });
      const returnUrl = readLoginReturnUrl();
      router.push(returnUrl ?? ROUTES.HOME);
    } catch (error) {
      showApiFailure(error);
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
        aria-describedby={formError ? formErrorId : undefined}
      >
        <div className="employer-register-form-stack">
          <RequiredFieldLabel
            htmlFor="job-seeker-login-whatsapp"
            required
            className="employer-register-form-label"
          >
            {JOB_SEEKER_LOGIN_WHATSAPP_LABEL}
          </RequiredFieldLabel>
          <input
            id="job-seeker-login-whatsapp"
            name="whatsappNumber"
            type="tel"
            inputMode="numeric"
            value={whatsappNumber}
            onChange={(event) => handleWhatsappChange(event.target.value)}
            placeholder={JOB_SEEKER_LOGIN_WHATSAPP_PLACEHOLDER}
            autoComplete="tel"
            className="employer-register-form-input"
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.whatsappNumber) || undefined}
            aria-describedby={
              fieldErrors.whatsappNumber ? whatsappErrorId : undefined
            }
            disabled={isSubmitting}
          />
          <FieldError
            id={whatsappErrorId}
            message={fieldErrors.whatsappNumber}
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
              onChange={(next) => {
                setOtpDigits(next);
                clearSingleFieldError("otp");
              }}
              disabled={isSubmitting}
              name="otp"
              aria-invalid={Boolean(fieldErrors.otp)}
              aria-describedby={fieldErrors.otp ? otpErrorId : undefined}
            />
            <FieldError id={otpErrorId} message={fieldErrors.otp} />

            <p className="text-center text-sm text-muted">
              {JOB_SEEKER_LOGIN_RESEND_PROMPT}{" "}
              <button
                type="button"
                className="employer-register-send-otp-link inline align-baseline"
                onClick={() => {
                  void handleResendOtp();
                }}
                disabled={isSubmitting || isCoolingDown}
              >
                {isCoolingDown
                  ? `Resend OTP in ${secondsLeft}s`
                  : JOB_SEEKER_LOGIN_RESEND_LABEL}
              </button>
            </p>

            {formError ? (
              <p
                id={formErrorId}
                className="text-sm font-medium text-red-600"
                role="alert"
              >
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              className="employer-register-form-submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting || undefined}
            >
              {isSubmitting
                ? "Please wait…"
                : JOB_SEEKER_LOGIN_CONTINUE_LABEL}
            </button>
          </div>
        ) : (
          <>
            {formError ? (
              <p
                id={formErrorId}
                className="text-sm font-medium text-red-600"
                role="alert"
              >
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              className="employer-register-form-submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting || undefined}
            >
              {isSubmitting
                ? "Please wait…"
                : JOB_SEEKER_LOGIN_SEND_OTP_LABEL}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
