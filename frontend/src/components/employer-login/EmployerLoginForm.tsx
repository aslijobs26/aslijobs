"use client";

import { FieldError } from "@/components/auth/FieldError";
import { RequiredFieldLabel } from "@/components/auth/RequiredFieldLabel";
import { EmployerRegisterOtpInput } from "@/components/employer-register/EmployerRegisterOtpInput";
import { useAuthMessageTranslator } from "@/components/employer-register/useAuthMessageTranslator";
import { AUTH_VALIDATION_MESSAGES } from "@/constants/auth-validation-messages";
import { EMPLOYER_LOGIN_OTP_LENGTH } from "@/constants/employer-login";
import { isValidEmployerWhatsappNumber } from "@/constants/employer-register";
import { ROUTES } from "@/constants/routes";
import { useOtpResendCooldown } from "@/hooks/useOtpResendCooldown";
import { useTranslate } from "@/i18n/translate";
import {
  resendEmployerLoginOtp,
  sendEmployerLoginOtp,
  verifyEmployerLoginOtp,
} from "@/services/employer-login.service";
import {
  clearFieldError,
  focusFirstInvalidField,
  mergeFieldErrors,
  type AuthFieldErrors,
} from "@/utils/auth-field-errors";
import { establishEmployerClientSession } from "@/utils/employer-session";
import { normalizeApiError } from "@/utils/normalize-api-error";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const EMPTY_OTP_DIGITS = Array.from(
  { length: EMPLOYER_LOGIN_OTP_LENGTH },
  () => "",
);

const OTP_FIELD_MESSAGES = new Set<string>([
  AUTH_VALIDATION_MESSAGES.OTP_REQUIRED,
  AUTH_VALIDATION_MESSAGES.OTP_INVALID,
  AUTH_VALIDATION_MESSAGES.OTP_EXPIRED,
  AUTH_VALIDATION_MESSAGES.OTP_TOO_MANY,
]);

export function EmployerLoginForm() {
  const t = useTranslate();
  const translateMessage = useAuthMessageTranslator();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isOtpVisible, setIsOtpVisible] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(EMPTY_OTP_DIGITS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const { secondsLeft, isCoolingDown, startCooldown, resetCooldown } =
    useOtpResendCooldown();

  const isOtpComplete = otpDigits.every(
    (digit) => digit.length === 1 && /\d/.test(digit),
  );

  const clearField = (field: string) => {
    setFieldErrors((current) => clearFieldError(current, field));
  };

  const applyApiError = (error: unknown, fallback: string) => {
    const normalized = normalizeApiError(error);
    let message = normalized.message || fallback;
    const nextFieldErrors = { ...normalized.fieldErrors };

    if (normalized.status === 429) {
      message = AUTH_VALIDATION_MESSAGES.OTP_TOO_MANY;
    }

    if (!nextFieldErrors.otp && OTP_FIELD_MESSAGES.has(message)) {
      nextFieldErrors.otp = message;
    }

    if (
      !nextFieldErrors.whatsappNumber &&
      (message === AUTH_VALIDATION_MESSAGES.LOGIN_NOT_REGISTERED ||
        message === AUTH_VALIDATION_MESSAGES.COMPLETE_REGISTRATION)
    ) {
      nextFieldErrors.whatsappNumber = message;
    }

    setFieldErrors((current) => mergeFieldErrors(current, nextFieldErrors));

    const onlyFieldErrors =
      Object.keys(nextFieldErrors).length > 0 &&
      (OTP_FIELD_MESSAGES.has(message) ||
        message === AUTH_VALIDATION_MESSAGES.LOGIN_NOT_REGISTERED ||
        message === AUTH_VALIDATION_MESSAGES.COMPLETE_REGISTRATION);

    setErrorMessage(onlyFieldErrors ? null : message);

    if (Object.keys(nextFieldErrors).length > 0) {
      focusFirstInvalidField(nextFieldErrors);
    }
  };

  const handleWhatsappChange = (value: string) => {
    const nextValue = value.replace(/\D/g, "").slice(0, 10);
    setWhatsappNumber(nextValue);
    setErrorMessage(null);
    clearField("whatsappNumber");

    if (isOtpVisible) {
      setIsOtpVisible(false);
      setOtpDigits(EMPTY_OTP_DIGITS);
      resetCooldown();
      clearField("otp");
    }
  };

  const handleSendOtp = async () => {
    if (isSubmitting) {
      return;
    }

    if (!whatsappNumber.trim()) {
      const errors: AuthFieldErrors = {
        whatsappNumber: AUTH_VALIDATION_MESSAGES.WHATSAPP_REQUIRED,
      };
      setFieldErrors(errors);
      setErrorMessage(null);
      focusFirstInvalidField(errors);
      return;
    }

    if (!isValidEmployerWhatsappNumber(whatsappNumber)) {
      const errors: AuthFieldErrors = {
        whatsappNumber: AUTH_VALIDATION_MESSAGES.WHATSAPP_INVALID,
      };
      setFieldErrors(errors);
      setErrorMessage(null);
      focusFirstInvalidField(errors);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      const result = await sendEmployerLoginOtp(whatsappNumber);
      setOtpDigits(EMPTY_OTP_DIGITS);
      setIsOtpVisible(true);
      startCooldown(result.resendAvailableIn);
    } catch (error) {
      applyApiError(error, AUTH_VALIDATION_MESSAGES.GENERIC_SUBMIT_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (isSubmitting || !isValidEmployerWhatsappNumber(whatsappNumber) || isCoolingDown) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    clearField("otp");

    try {
      const result = await resendEmployerLoginOtp(whatsappNumber);
      setOtpDigits(EMPTY_OTP_DIGITS);
      startCooldown(result.resendAvailableIn);
    } catch (error) {
      applyApiError(error, AUTH_VALIDATION_MESSAGES.GENERIC_SUBMIT_ERROR);
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

    if (!isOtpComplete) {
      const errors: AuthFieldErrors = {
        otp: AUTH_VALIDATION_MESSAGES.OTP_REQUIRED,
      };
      setFieldErrors(errors);
      setErrorMessage(null);
      focusFirstInvalidField(errors);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    clearField("otp");

    try {
      const session = await verifyEmployerLoginOtp(
        whatsappNumber,
        otpDigits.join(""),
      );
      await establishEmployerClientSession(queryClient, {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        employer: session.employer,
      });
      router.replace(ROUTES.EMPLOYER_DASHBOARD);
    } catch (error) {
      applyApiError(error, AUTH_VALIDATION_MESSAGES.OTP_INVALID);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <h1 className="employer-register-form-heading">
        {t("auth.employerLogin.heading")}
      </h1>
      <p className="mt-2 break-words text-sm leading-relaxed text-muted">
        {t("auth.employerLogin.subtitle")}
      </p>

      <form
        className="employer-register-form-fields mt-8 w-full"
        onSubmit={(event) => {
          void handleContinue(event);
        }}
        noValidate
      >
        <div className="employer-register-form-stack">
          <RequiredFieldLabel
            htmlFor="employer-login-whatsapp"
            required
            className="employer-register-form-label"
          >
            {t("auth.common.whatsappLabel")}
          </RequiredFieldLabel>
          <input
            id="employer-login-whatsapp"
            name="whatsappNumber"
            type="tel"
            inputMode="numeric"
            value={whatsappNumber}
            onChange={(event) => handleWhatsappChange(event.target.value)}
            placeholder={t("auth.common.whatsappPlaceholder")}
            autoComplete="tel"
            className="employer-register-form-input"
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.whatsappNumber)}
            aria-describedby={
              fieldErrors.whatsappNumber ? "whatsappNumber-error" : undefined
            }
            disabled={isSubmitting}
          />
          <FieldError
            id="whatsappNumber-error"
            message={translateMessage(fieldErrors.whatsappNumber)}
          />
        </div>

        {isOtpVisible ? (
          <div className="employer-register-otp-section">
            <div className="employer-register-form-stack">
              <h2 className="employer-register-otp-heading">
                {t("auth.common.otpHeading")}
              </h2>
              <p className="employer-register-otp-description break-words">
                {t("auth.common.otpDescription")}
              </p>
            </div>

            <EmployerRegisterOtpInput
              value={otpDigits}
              onChange={(next) => {
                setOtpDigits(next);
                clearField("otp");
              }}
              disabled={isSubmitting}
              name="otp"
              aria-invalid={Boolean(fieldErrors.otp)}
              aria-describedby={fieldErrors.otp ? "otp-error" : undefined}
            />
            <FieldError
              id="otp-error"
              message={translateMessage(fieldErrors.otp)}
            />

            <p className="break-words text-center text-sm text-muted">
              {t("auth.common.resendPrompt")}{" "}
              <button
                type="button"
                className="employer-register-send-otp-link inline align-baseline"
                onClick={() => {
                  void handleResendOtp();
                }}
                disabled={isSubmitting || isCoolingDown}
              >
                {isCoolingDown
                  ? t("auth.common.resendOtpIn", { seconds: secondsLeft })
                  : t("auth.common.resendOtp")}
              </button>
            </p>

            {errorMessage ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {translateMessage(errorMessage)}
              </p>
            ) : null}

            <button
              type="submit"
              className="employer-register-form-submit"
              disabled={isSubmitting || !isOtpComplete}
              aria-busy={isSubmitting}
            >
              {t("auth.common.continue")}
            </button>
          </div>
        ) : (
          <>
            {errorMessage ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                {translateMessage(errorMessage)}
              </p>
            ) : null}

            <button
              type="submit"
              className="employer-register-form-submit"
              disabled={
                isSubmitting || !isValidEmployerWhatsappNumber(whatsappNumber)
              }
              aria-busy={isSubmitting}
            >
              {t("auth.common.sendOtp")}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
