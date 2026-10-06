import { Check } from "lucide-react";
import {
  useId,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { OPERATIONS_EMPLOYER_OTP_LENGTH } from "./add-employer-form";

interface AddEmployerOtpSectionProps {
  digits: string[];
  maskedPhone: string;
  isVerified: boolean;
  isSubmitting: boolean;
  resendSecondsLeft: number;
  error: string | null;
  onChange: (digits: string[]) => void;
  onVerify: () => void;
  onResend: () => void;
}

export function AddEmployerOtpSection({
  digits,
  maskedPhone,
  isVerified,
  isSubmitting,
  resendSecondsLeft,
  error,
  onChange,
  onVerify,
  onResend,
}: AddEmployerOtpSectionProps) {
  const headingId = useId();
  const errorId = useId();
  const isComplete = digits.every((digit) => /^\d$/.test(digit));
  const coolingDown = resendSecondsLeft > 0;

  const setDigit = (index: number, value: string) => {
    const next = [...digits];
    next[index] = value;
    onChange(next);
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setDigit(index, digit);
    if (digit && index < OPERATIONS_EMPLOYER_OTP_LENGTH - 1) {
      const nextInput = document.getElementById(`add-employer-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      const previous = document.getElementById(`add-employer-otp-${index - 1}`);
      previous?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OPERATIONS_EMPLOYER_OTP_LENGTH);
    if (!pasted) {
      return;
    }
    const next = Array.from(
      { length: OPERATIONS_EMPLOYER_OTP_LENGTH },
      (_, index) => pasted[index] ?? "",
    );
    onChange(next);
    const focusIndex = Math.min(pasted.length, OPERATIONS_EMPLOYER_OTP_LENGTH - 1);
    document.getElementById(`add-employer-otp-${focusIndex}`)?.focus();
  };

  if (isVerified) {
    return (
      <p
        className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs font-semibold text-success"
        role="status"
      >
        <Check className="mr-1 inline size-3.5" aria-hidden="true" />
        WhatsApp number verified
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-border-subtle bg-hero-bg/30 p-3">
      <h4 id={headingId} className="text-xs font-semibold text-foreground">
        WhatsApp verification
      </h4>
      <p className="text-[11px] text-muted">OTP sent to {maskedPhone}</p>
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-labelledby={headingId}
        aria-describedby={error ? errorId : undefined}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            id={`add-employer-otp-${index}`}
            name={index === 0 ? "otp" : undefined}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            disabled={isSubmitting}
            aria-label={`OTP digit ${index + 1} of ${OPERATIONS_EMPLOYER_OTP_LENGTH}`}
            aria-invalid={Boolean(error)}
            className="size-9 rounded-md border border-border-subtle bg-surface text-center text-sm font-semibold text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
          />
        ))}
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onVerify}
          disabled={!isComplete || isSubmitting}
          className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-surface hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? "Verifying…" : "Verify OTP"}
        </button>
        <button
          type="button"
          onClick={onResend}
          disabled={coolingDown || isSubmitting}
          className="text-[11px] font-semibold text-primary disabled:text-muted"
        >
          {coolingDown ? `Resend OTP in ${resendSecondsLeft}s` : "Resend OTP"}
        </button>
      </div>
    </div>
  );
}
