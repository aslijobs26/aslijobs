"use client";

import { EMPLOYER_REGISTER_OTP_LENGTH } from "@/constants/employer-register";
import {
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";

type EmployerRegisterOtpInputProps = {
  value: string[];
  onChange: (nextValue: string[]) => void;
  disabled?: boolean;
};

function sanitizeDigit(value: string) {
  return value.replace(/\D/g, "").slice(-1);
}

export function EmployerRegisterOtpInput({
  value,
  onChange,
  disabled = false,
}: EmployerRegisterOtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!disabled) {
      inputRefs.current[0]?.focus();
    }
  }, [disabled]);

  const focusIndex = (index: number) => {
    const target = inputRefs.current[index];
    target?.focus();
    target?.select();
  };

  const updateDigit = (index: number, digit: string) => {
    const nextValue = [...value];
    nextValue[index] = digit;
    onChange(nextValue);

    if (digit && index < EMPLOYER_REGISTER_OTP_LENGTH - 1) {
      focusIndex(index + 1);
    }
  };

  const handleChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const digit = sanitizeDigit(event.target.value);
    updateDigit(index, digit);
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace") {
      event.preventDefault();

      if (value[index]) {
        updateDigit(index, "");
        return;
      }

      if (index > 0) {
        const nextValue = [...value];
        nextValue[index - 1] = "";
        onChange(nextValue);
        focusIndex(index - 1);
      }

      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusIndex(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < EMPLOYER_REGISTER_OTP_LENGTH - 1) {
      event.preventDefault();
      focusIndex(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    const pastedDigits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, EMPLOYER_REGISTER_OTP_LENGTH);

    if (!pastedDigits) {
      return;
    }

    const nextValue = Array.from(
      { length: EMPLOYER_REGISTER_OTP_LENGTH },
      (_, index) => pastedDigits[index] ?? "",
    );

    onChange(nextValue);
    focusIndex(Math.min(pastedDigits.length, EMPLOYER_REGISTER_OTP_LENGTH) - 1);
  };

  return (
    <div
      className="employer-register-otp-boxes"
      role="group"
      aria-label="One-time password"
    >
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          id={`employer-register-otp-${index}`}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${EMPLOYER_REGISTER_OTP_LENGTH}`}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.currentTarget.select()}
          className="employer-register-otp-box"
        />
      ))}
    </div>
  );
}
