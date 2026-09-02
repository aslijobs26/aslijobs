"use client";

import {
  EMPLOYER_REGISTER_OTP_DESCRIPTION,
  EMPLOYER_REGISTER_OTP_HEADING,
  EMPLOYER_REGISTER_OTP_SUCCESS_LABEL,
  EMPLOYER_REGISTER_OTP_VERIFY_LABEL,
  EMPLOYER_REGISTER_RESEND_LABEL,
  EMPLOYER_REGISTER_RESEND_PROMPT,
} from "@/constants/employer-register";
import { Check } from "lucide-react";
import { EmployerRegisterOtpInput } from "./EmployerRegisterOtpInput";

type EmployerRegisterOtpSectionProps = {
  otpDigits: string[];
  isVerified: boolean;
  isSubmitting?: boolean;
  resendSecondsLeft?: number;
  onOtpChange: (nextValue: string[]) => void;
  onVerify: () => void;
  onResend?: () => void;
};

export function EmployerRegisterOtpSection({
  otpDigits,
  isVerified,
  isSubmitting = false,
  resendSecondsLeft = 0,
  onOtpChange,
  onVerify,
  onResend,
}: EmployerRegisterOtpSectionProps) {
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
        <p className="employer-register-otp-success-text">
          {EMPLOYER_REGISTER_OTP_SUCCESS_LABEL}
        </p>
      </div>
    );
  }

  return (
    <div className="employer-register-otp-section">
      <div className="employer-register-form-stack">
        <h2 className="employer-register-otp-heading">
          {EMPLOYER_REGISTER_OTP_HEADING}
        </h2>
        <p className="employer-register-otp-description">
          {EMPLOYER_REGISTER_OTP_DESCRIPTION}
        </p>
      </div>

      <EmployerRegisterOtpInput
        value={otpDigits}
        onChange={onOtpChange}
        disabled={isSubmitting}
      />

      {onResend ? (
        <p className="text-center text-sm text-muted">
          {EMPLOYER_REGISTER_RESEND_PROMPT}{" "}
          <button
            type="button"
            className="employer-register-send-otp-link inline align-baseline"
            onClick={onResend}
            disabled={isSubmitting || isCoolingDown}
          >
            {isCoolingDown
              ? `Resend OTP in ${resendSecondsLeft}s`
              : EMPLOYER_REGISTER_RESEND_LABEL}
          </button>
        </p>
      ) : null}

      <button
        type="button"
        className="employer-register-form-submit"
        disabled={!isOtpComplete || isSubmitting}
        onClick={onVerify}
      >
        {EMPLOYER_REGISTER_OTP_VERIFY_LABEL}
      </button>
    </div>
  );
}
