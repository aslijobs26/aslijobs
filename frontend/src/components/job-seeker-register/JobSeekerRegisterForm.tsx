"use client";

import { EmployerRegisterOtpInput } from "@/components/employer-register/EmployerRegisterOtpInput";
import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import { PostJobDatePicker } from "@/components/post-job/PostJobDatePicker";
import {
  JOB_SEEKER_GENDER_OPTIONS,
  JOB_SEEKER_JOB_ROLE_OPTIONS,
  JOB_SEEKER_REGISTER_CITY_LABEL,
  JOB_SEEKER_REGISTER_CITY_PLACEHOLDER,
  JOB_SEEKER_REGISTER_CREATE_ACCOUNT_LABEL,
  JOB_SEEKER_REGISTER_DOB_LABEL,
  JOB_SEEKER_REGISTER_DOB_PLACEHOLDER,
  JOB_SEEKER_REGISTER_FULL_NAME_LABEL,
  JOB_SEEKER_REGISTER_FULL_NAME_PLACEHOLDER,
  JOB_SEEKER_REGISTER_GENDER_LABEL,
  JOB_SEEKER_REGISTER_GENDER_PLACEHOLDER,
  JOB_SEEKER_REGISTER_HEADING,
  JOB_SEEKER_REGISTER_JOB_ROLE_LABEL,
  JOB_SEEKER_REGISTER_JOB_ROLE_PLACEHOLDER,
  JOB_SEEKER_REGISTER_OTP_DESCRIPTION,
  JOB_SEEKER_REGISTER_OTP_HEADING,
  JOB_SEEKER_REGISTER_OTP_LENGTH,
  JOB_SEEKER_REGISTER_PINCODE_LABEL,
  JOB_SEEKER_REGISTER_PINCODE_PLACEHOLDER,
  JOB_SEEKER_REGISTER_PREFERRED_LOCATION_LABEL,
  JOB_SEEKER_REGISTER_PREFERRED_LOCATION_PLACEHOLDER,
  JOB_SEEKER_REGISTER_PROFILE_HEADING,
  JOB_SEEKER_REGISTER_RESEND_LABEL,
  JOB_SEEKER_REGISTER_RESEND_PROMPT,
  JOB_SEEKER_REGISTER_SEND_OTP_LABEL,
  JOB_SEEKER_REGISTER_STATE_LABEL,
  JOB_SEEKER_REGISTER_STATE_PLACEHOLDER,
  JOB_SEEKER_REGISTER_VERIFY_OTP_LABEL,
  JOB_SEEKER_REGISTER_WHATSAPP_LABEL,
  JOB_SEEKER_REGISTER_WHATSAPP_PLACEHOLDER,
  isValidJobSeekerPincode,
  isValidJobSeekerWhatsappNumber,
} from "@/constants/job-seeker-register";
import { ROUTES } from "@/constants/routes";
import {
  completeJobSeekerRegistration,
  registerJobSeekerAccount,
  resendJobSeekerOtp,
  verifyJobSeekerOtp,
} from "@/services/job-seeker-register.service";
import type { JobSeekerGender } from "@/types/job-seeker";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const EMPTY_OTP_DIGITS = Array.from(
  { length: JOB_SEEKER_REGISTER_OTP_LENGTH },
  () => "",
);

type RegisterStep = "account" | "otp" | "profile";

function getLocalTodayIso() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

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

export function JobSeekerRegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<RegisterStep>("account");
  const [jobSeekerId, setJobSeekerId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(EMPTY_OTP_DIGITS);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [preferredJobLocation, setPreferredJobLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isWhatsappValid = isValidJobSeekerWhatsappNumber(whatsappNumber);
  const isOtpComplete = otpDigits.every(
    (digit) => digit.length === 1 && /\d/.test(digit),
  );
  const canSendOtp = fullName.trim().length > 0 && isWhatsappValid;

  const handleSendOtp = async () => {
    if (!canSendOtp) {
      setErrorMessage("Enter your full name and a valid WhatsApp number");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await registerJobSeekerAccount(
        fullName.trim(),
        whatsappNumber,
      );
      setJobSeekerId(result.jobSeekerId);
      setOtpDigits(EMPTY_OTP_DIGITS);
      setStep("otp");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to send OTP"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!jobSeekerId) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await resendJobSeekerOtp(jobSeekerId);
      setOtpDigits(EMPTY_OTP_DIGITS);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to resend OTP"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!jobSeekerId || !isOtpComplete) {
      setErrorMessage("Enter the 4-digit OTP");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await verifyJobSeekerOtp(jobSeekerId, otpDigits.join(""));
      setStep("profile");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Invalid OTP"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!jobSeekerId) {
      setErrorMessage("Registration session expired. Please start again.");
      return;
    }

    if (!dateOfBirth) {
      setErrorMessage("Date of birth is required");
      return;
    }

    if (!gender) {
      setErrorMessage("Gender is required");
      return;
    }

    if (!isValidJobSeekerPincode(pincode)) {
      setErrorMessage("Enter a valid 6-digit pincode");
      return;
    }

    if (!city.trim() || !state.trim()) {
      setErrorMessage("City and state are required");
      return;
    }

    if (!jobRole) {
      setErrorMessage("Job role is required");
      return;
    }

    if (!preferredJobLocation.trim()) {
      setErrorMessage("Preferred job location is required");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await completeJobSeekerRegistration({
        jobSeekerId,
        dateOfBirth,
        gender: gender as JobSeekerGender,
        pincode: pincode.trim(),
        city: city.trim(),
        state: state.trim(),
        jobRole,
        preferredJobLocation: preferredJobLocation.trim(),
      });
      router.push(ROUTES.JOB_SEEKER_DASHBOARD);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to create account"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step === "account") {
      await handleSendOtp();
      return;
    }

    if (step === "otp") {
      await handleVerifyOtp();
      return;
    }

    await handleCreateAccount();
  };

  return (
    <div className="w-full">
      <h1 className="employer-register-form-heading">
        {step === "profile"
          ? JOB_SEEKER_REGISTER_PROFILE_HEADING
          : JOB_SEEKER_REGISTER_HEADING}
      </h1>

      <form
        className="employer-register-form-fields mt-8 w-full"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        noValidate
      >
        {step === "account" || step === "otp" ? (
          <>
            <div className="employer-register-form-stack">
              <label
                htmlFor="job-seeker-register-full-name"
                className="employer-register-form-label"
              >
                {JOB_SEEKER_REGISTER_FULL_NAME_LABEL}
              </label>
              <input
                id="job-seeker-register-full-name"
                type="text"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  setErrorMessage(null);
                }}
                placeholder={JOB_SEEKER_REGISTER_FULL_NAME_PLACEHOLDER}
                autoComplete="name"
                className="employer-register-form-input"
                aria-required="true"
                disabled={isSubmitting || step === "otp"}
              />
            </div>

            <div className="employer-register-form-stack">
              <label
                htmlFor="job-seeker-register-whatsapp"
                className="employer-register-form-label"
              >
                {JOB_SEEKER_REGISTER_WHATSAPP_LABEL}
              </label>
              <input
                id="job-seeker-register-whatsapp"
                type="tel"
                inputMode="numeric"
                value={whatsappNumber}
                onChange={(event) => {
                  setWhatsappNumber(
                    event.target.value.replace(/\D/g, "").slice(0, 10),
                  );
                  setErrorMessage(null);
                }}
                placeholder={JOB_SEEKER_REGISTER_WHATSAPP_PLACEHOLDER}
                autoComplete="tel"
                className="employer-register-form-input"
                aria-required="true"
                disabled={isSubmitting || step === "otp"}
              />
            </div>
          </>
        ) : null}

        {step === "otp" ? (
          <div className="employer-register-otp-section">
            <div className="employer-register-form-stack">
              <h2 className="employer-register-otp-heading">
                {JOB_SEEKER_REGISTER_OTP_HEADING}
              </h2>
              <p className="employer-register-otp-description">
                {JOB_SEEKER_REGISTER_OTP_DESCRIPTION}
              </p>
            </div>

            <EmployerRegisterOtpInput
              value={otpDigits}
              onChange={setOtpDigits}
              disabled={isSubmitting}
            />

            <p className="text-center text-sm text-muted">
              {JOB_SEEKER_REGISTER_RESEND_PROMPT}{" "}
              <button
                type="button"
                className="employer-register-send-otp-link inline align-baseline"
                onClick={() => {
                  void handleResendOtp();
                }}
                disabled={isSubmitting}
              >
                {JOB_SEEKER_REGISTER_RESEND_LABEL}
              </button>
            </p>
          </div>
        ) : null}

        {step === "profile" ? (
          <>
            <div className="employer-register-form-stack">
              <label
                htmlFor="job-seeker-register-dob"
                className="employer-register-form-label"
              >
                {JOB_SEEKER_REGISTER_DOB_LABEL}
              </label>
              <PostJobDatePicker
                id="job-seeker-register-dob"
                value={dateOfBirth}
                placeholder={JOB_SEEKER_REGISTER_DOB_PLACEHOLDER}
                maxDate={getLocalTodayIso()}
                compact
                onChange={(value) => {
                  setDateOfBirth(value);
                  setErrorMessage(null);
                }}
                aria-label="Date of birth"
              />
            </div>

            <EmployerRegisterSearchableSelect
              id="job-seeker-register-gender"
              label={JOB_SEEKER_REGISTER_GENDER_LABEL}
              value={gender}
              placeholder={JOB_SEEKER_REGISTER_GENDER_PLACEHOLDER}
              options={JOB_SEEKER_GENDER_OPTIONS}
              onChange={(value) => {
                setGender(value);
                setErrorMessage(null);
              }}
              required
              disabled={isSubmitting}
            />

            <div className="employer-register-form-stack">
              <label
                htmlFor="job-seeker-register-pincode"
                className="employer-register-form-label"
              >
                {JOB_SEEKER_REGISTER_PINCODE_LABEL}
              </label>
              <input
                id="job-seeker-register-pincode"
                type="text"
                inputMode="numeric"
                value={pincode}
                onChange={(event) => {
                  setPincode(event.target.value.replace(/\D/g, "").slice(0, 6));
                  setErrorMessage(null);
                }}
                placeholder={JOB_SEEKER_REGISTER_PINCODE_PLACEHOLDER}
                className="employer-register-form-input"
                aria-required="true"
                disabled={isSubmitting}
              />
            </div>

            <div className="employer-register-form-row">
              <div className="employer-register-form-stack">
                <label
                  htmlFor="job-seeker-register-city"
                  className="employer-register-form-label"
                >
                  {JOB_SEEKER_REGISTER_CITY_LABEL}
                </label>
                <input
                  id="job-seeker-register-city"
                  type="text"
                  value={city}
                  onChange={(event) => {
                    setCity(event.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder={JOB_SEEKER_REGISTER_CITY_PLACEHOLDER}
                  className="employer-register-form-input"
                  aria-required="true"
                  disabled={isSubmitting}
                />
              </div>

              <div className="employer-register-form-stack">
                <label
                  htmlFor="job-seeker-register-state"
                  className="employer-register-form-label"
                >
                  {JOB_SEEKER_REGISTER_STATE_LABEL}
                </label>
                <input
                  id="job-seeker-register-state"
                  type="text"
                  value={state}
                  onChange={(event) => {
                    setState(event.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder={JOB_SEEKER_REGISTER_STATE_PLACEHOLDER}
                  className="employer-register-form-input"
                  aria-required="true"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <EmployerRegisterSearchableSelect
              id="job-seeker-register-job-role"
              label={JOB_SEEKER_REGISTER_JOB_ROLE_LABEL}
              value={jobRole}
              placeholder={JOB_SEEKER_REGISTER_JOB_ROLE_PLACEHOLDER}
              options={JOB_SEEKER_JOB_ROLE_OPTIONS}
              onChange={(value) => {
                setJobRole(value);
                setErrorMessage(null);
              }}
              required
              allowCustom
              initialVisibleCount={5}
              disabled={isSubmitting}
            />

            <div className="employer-register-form-stack">
              <label
                htmlFor="job-seeker-register-preferred-location"
                className="employer-register-form-label"
              >
                {JOB_SEEKER_REGISTER_PREFERRED_LOCATION_LABEL}
              </label>
              <input
                id="job-seeker-register-preferred-location"
                type="text"
                value={preferredJobLocation}
                onChange={(event) => {
                  setPreferredJobLocation(event.target.value);
                  setErrorMessage(null);
                }}
                placeholder={JOB_SEEKER_REGISTER_PREFERRED_LOCATION_PLACEHOLDER}
                className="employer-register-form-input"
                aria-required="true"
                disabled={isSubmitting}
              />
            </div>
          </>
        ) : null}

        {errorMessage ? (
          <p className="text-sm font-medium text-red-600" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          className="employer-register-form-submit"
          disabled={
            isSubmitting ||
            (step === "account" && !canSendOtp) ||
            (step === "otp" && !isOtpComplete)
          }
        >
          {step === "account"
            ? JOB_SEEKER_REGISTER_SEND_OTP_LABEL
            : step === "otp"
              ? JOB_SEEKER_REGISTER_VERIFY_OTP_LABEL
              : JOB_SEEKER_REGISTER_CREATE_ACCOUNT_LABEL}
        </button>
      </form>
    </div>
  );
}
