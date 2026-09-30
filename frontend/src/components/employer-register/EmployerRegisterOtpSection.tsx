"use client";

import { FieldError } from "@/components/auth/FieldError";
import { useTranslate } from "@/i18n/translate";
import { Check } from "lucide-react";
import { EmployerRegisterOtpInput } from "./EmployerRegisterOtpInput";
import { useAuthMessageTranslator } from "./useAuthMessageTranslator";

type EmployerRegisterOtpSectionProps = {
  otpDigits: string[];
  isVerified: boolean;
  isSubmitting?: boolean;
  resendSecondsLeft?: number;
  otpError?: string | null;
  onOtpChange: (nextValue: string[]) => void;
  onVerify: () => void;
  onResend?: () => void;
};

export function EmployerRegisterOtpSection({
  otpDigits,
  isVerified,
  isSubmitting = false,
  resendSecondsLeft = 0,
  otpError = null,
  onOtpChange,
  onVerify,
  onResend,
}: EmployerRegisterOtpSectionProps) {
  const t = useTranslate();
  const translateMessage = useAuthMessageTranslator();
  const isOtpComplete = otpDigits.every(
    (digit) => digit.length === 1 && /\d/.test(digit),
  );
  const isCoolingDown = resendSecondsLeft > 0;

  if (isVerified) {
    return (
      <div
        className="employer-register-otp-success"
        role="status"
        aria-live="polite"
      >
        <span className="employer-register-otp-success-icon" aria-hidden="true">
          <Check className="size-4" strokeWidth={2.5} />
        </span>
        <p className="employer-register-otp-success-text min-w-0 break-words">
          {t("auth.common.otpVerified")}
        </p>
      </div>
    );
  }

  return (
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
        onChange={onOtpChange}
        disabled={isSubmitting}
        name="otp"
        aria-invalid={Boolean(otpError)}
        aria-describedby={otpError ? "otp-error" : undefined}
      />
      <FieldError id="otp-error" message={translateMessage(otpError)} />

      {onResend ? (
        <p className="break-words text-center text-sm text-muted">
          {t("auth.common.resendPrompt")}{" "}
          <button
            type="button"
            className="employer-register-send-otp-link inline align-baseline"
            onClick={onResend}
            disabled={isSubmitting || isCoolingDown}
          >
            {isCoolingDown
              ? t("auth.common.resendOtpIn", { seconds: resendSecondsLeft })
              : t("auth.common.resendOtp")}
          </button>
        </p>
      ) : null}

      <button
        type="button"
        className="employer-register-form-submit"
        disabled={!isOtpComplete || isSubmitting}
        onClick={onVerify}
      >
        {t("auth.common.verifyOtp")}
      </button>
    </div>
  );
}
