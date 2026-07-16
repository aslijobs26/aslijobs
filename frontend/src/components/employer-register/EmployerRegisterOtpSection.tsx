"use client";

import {
  EMPLOYER_REGISTER_OTP_DESCRIPTION,
  EMPLOYER_REGISTER_OTP_HEADING,
  EMPLOYER_REGISTER_OTP_SUCCESS_LABEL,
  EMPLOYER_REGISTER_OTP_VERIFY_LABEL,
} from "@/constants/employer-register";
import { Check } from "lucide-react";
import { EmployerRegisterOtpInput } from "./EmployerRegisterOtpInput";

type EmployerRegisterOtpSectionProps = {
  otpDigits: string[];
  isVerified: boolean;
  onOtpChange: (nextValue: string[]) => void;
  onVerify: () => void;
};

export function EmployerRegisterOtpSection({
  otpDigits,
  isVerified,
  onOtpChange,
  onVerify,
}: EmployerRegisterOtpSectionProps) {
  const isOtpComplete = otpDigits.every(
    (digit) => digit.length === 1 && /\d/.test(digit),
  );

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

      <EmployerRegisterOtpInput value={otpDigits} onChange={onOtpChange} />

      <button
        type="button"
        className="employer-register-form-submit"
        disabled={!isOtpComplete}
        onClick={onVerify}
      >
        {EMPLOYER_REGISTER_OTP_VERIFY_LABEL}
      </button>
    </div>
  );
}
