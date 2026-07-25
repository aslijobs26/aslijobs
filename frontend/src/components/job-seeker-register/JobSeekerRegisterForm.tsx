"use client";

import { EmployerRegisterOtpInput } from "@/components/employer-register/EmployerRegisterOtpInput";
import {
  EMPTY_EDUCATION,
  JobSeekerRegisterEducationExperienceStep,
} from "@/components/job-seeker-register/JobSeekerRegisterEducationExperienceStep";
import { JobSeekerRegisterPreferencesStep } from "@/components/job-seeker-register/JobSeekerRegisterPreferencesStep";
import {
  JOB_SEEKER_REGISTER_CREATE_ACCOUNT_LABEL,
  JOB_SEEKER_REGISTER_CONTINUE_LABEL,
  JOB_SEEKER_REGISTER_EDUCATION_HEADING,
  JOB_SEEKER_REGISTER_FULL_NAME_LABEL,
  JOB_SEEKER_REGISTER_FULL_NAME_PLACEHOLDER,
  JOB_SEEKER_REGISTER_HEADING,
  JOB_SEEKER_REGISTER_OTP_DESCRIPTION,
  JOB_SEEKER_REGISTER_OTP_HEADING,
  JOB_SEEKER_REGISTER_OTP_LENGTH,
  JOB_SEEKER_REGISTER_PREFERENCES_HEADING,
  JOB_SEEKER_REGISTER_RESEND_LABEL,
  JOB_SEEKER_REGISTER_RESEND_PROMPT,
  JOB_SEEKER_REGISTER_SEND_OTP_LABEL,
  JOB_SEEKER_REGISTER_VERIFY_OTP_LABEL,
  JOB_SEEKER_REGISTER_WHATSAPP_LABEL,
  JOB_SEEKER_REGISTER_WHATSAPP_PLACEHOLDER,
  isValidJobSeekerWhatsappNumber,
} from "@/constants/job-seeker-register";
import { ROUTES } from "@/constants/routes";
import {
  completeJobSeekerRegistration,
  registerJobSeekerAccount,
  resendJobSeekerOtp,
  saveJobSeekerPreferences,
  verifyJobSeekerOtp,
} from "@/services/job-seeker-register.service";
import type {
  JobSeekerEducation,
  JobSeekerExperienceEntry,
  JobSeekerExperienceType,
  JobSeekerGender,
  JobSeekerJobType,
  JobSeekerLanguage,
  JobSeekerSalaryPeriod,
  JobSeekerWorkMode,
} from "@/types/job-seeker";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const EMPTY_OTP_DIGITS = Array.from(
  { length: JOB_SEEKER_REGISTER_OTP_LENGTH },
  () => "",
);

type RegisterStep = "account" | "otp" | "preferences" | "education";

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

function validateEducation(education: JobSeekerEducation): string | null {
  switch (education.level) {
    case "below_10th":
      return education.schoolName.trim() ? null : "School name is required";
    case "10th_pass":
      if (!education.schoolName.trim()) return "School name is required";
      if (!education.board.trim()) return "Board is required";
      if (!education.passingYear.trim()) return "Passing year is required";
      return null;
    case "intermediate":
      if (!education.collegeName.trim()) return "College name is required";
      if (!education.stream.trim()) return "Stream is required";
      if (!education.passingYear.trim()) return "Passing year is required";
      return null;
    case "iti":
      if (!education.instituteName.trim()) return "Institute name is required";
      if (!education.trade.trim()) return "Trade is required";
      if (!education.passingYear.trim()) return "Passing year is required";
      return null;
    case "diploma":
      if (!education.collegeName.trim()) return "College name is required";
      if (!education.branch.trim()) return "Branch is required";
      if (!education.passingYear.trim()) return "Passing year is required";
      return null;
    case "graduation":
    case "post_graduation":
      if (!education.collegeName.trim()) return "College name is required";
      if (!education.degree.trim()) return "Degree is required";
      if (!education.specialization.trim()) return "Specialization is required";
      if (!education.passingYear.trim()) return "Passing year is required";
      return null;
    default:
      return null;
  }
}

export function JobSeekerRegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<RegisterStep>("account");
  const [jobSeekerId, setJobSeekerId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(EMPTY_OTP_DIGITS);
  const [preferences, setPreferences] = useState({
    dateOfBirth: "",
    gender: "",
    jobRole: "",
    jobType: "",
    workMode: "",
    preferredJobLocation: "",
    expectedSalary: "",
    expectedSalaryPeriod: "per-month",
  });
  const [education, setEducation] =
    useState<JobSeekerEducation>(EMPTY_EDUCATION);
  const [experienceType, setExperienceType] = useState<
    JobSeekerExperienceType | ""
  >("");
  const [experiences, setExperiences] = useState<JobSeekerExperienceEntry[]>(
    [],
  );
  const [languages, setLanguages] = useState<JobSeekerLanguage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isWhatsappValid = isValidJobSeekerWhatsappNumber(whatsappNumber);
  const isOtpComplete = otpDigits.every(
    (digit) => digit.length === 1 && /\d/.test(digit),
  );
  const canSendOtp = fullName.trim().length > 0 && isWhatsappValid;

  const heading =
    step === "preferences"
      ? JOB_SEEKER_REGISTER_PREFERENCES_HEADING
      : step === "education"
        ? JOB_SEEKER_REGISTER_EDUCATION_HEADING
        : JOB_SEEKER_REGISTER_HEADING;

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
      setStep("preferences");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Invalid OTP"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!jobSeekerId) {
      setErrorMessage("Registration session expired. Please start again.");
      return;
    }

    if (!preferences.dateOfBirth) {
      setErrorMessage("Date of birth is required");
      return;
    }
    if (!preferences.gender) {
      setErrorMessage("Gender is required");
      return;
    }
    if (!preferences.jobRole.trim()) {
      setErrorMessage("Job role is required");
      return;
    }
    if (!preferences.jobType) {
      setErrorMessage("Job type is required");
      return;
    }
    if (!preferences.workMode) {
      setErrorMessage("Work mode is required");
      return;
    }
    if (!preferences.preferredJobLocation.trim()) {
      setErrorMessage("Preferred job location is required");
      return;
    }
    if (!preferences.expectedSalary.trim()) {
      setErrorMessage("Expected salary is required");
      return;
    }
    if (!preferences.expectedSalaryPeriod) {
      setErrorMessage("Salary period is required");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await saveJobSeekerPreferences({
        jobSeekerId,
        dateOfBirth: preferences.dateOfBirth,
        gender: preferences.gender as JobSeekerGender,
        jobRole: preferences.jobRole.trim(),
        jobType: preferences.jobType as JobSeekerJobType,
        workMode: preferences.workMode as JobSeekerWorkMode,
        preferredJobLocation: preferences.preferredJobLocation.trim(),
        expectedSalary: Number(preferences.expectedSalary),
        expectedSalaryPeriod:
          preferences.expectedSalaryPeriod as JobSeekerSalaryPeriod,
      });
      setStep("education");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to save preferences"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!jobSeekerId) {
      setErrorMessage("Registration session expired. Please start again.");
      return;
    }

    const educationError = validateEducation(education);
    if (educationError) {
      setErrorMessage(educationError);
      return;
    }

    if (!experienceType) {
      setErrorMessage("Select fresher or experienced");
      return;
    }

    if (experienceType === "experienced") {
      if (experiences.length === 0) {
        setErrorMessage("Add at least one work experience");
        return;
      }

      for (const [index, entry] of experiences.entries()) {
        if (!entry.companyName.trim()) {
          setErrorMessage(`Experience ${index + 1}: company name is required`);
          return;
        }
        if (!entry.jobRole.trim()) {
          setErrorMessage(`Experience ${index + 1}: job role is required`);
          return;
        }
        if (!entry.industry.trim()) {
          setErrorMessage(`Experience ${index + 1}: industry is required`);
          return;
        }
        if (!entry.startDate) {
          setErrorMessage(`Experience ${index + 1}: start date is required`);
          return;
        }
        if (!entry.currentlyWorking && !entry.endDate) {
          setErrorMessage(`Experience ${index + 1}: end date is required`);
          return;
        }
        if (!entry.salary.trim()) {
          setErrorMessage(`Experience ${index + 1}: salary is required`);
          return;
        }
        if (!entry.location.trim()) {
          setErrorMessage(`Experience ${index + 1}: location is required`);
          return;
        }
      }
    }

    if (languages.length === 0) {
      setErrorMessage("Select at least one language");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await completeJobSeekerRegistration({
        jobSeekerId,
        education,
        experienceType,
        experiences: experienceType === "experienced" ? experiences : [],
        languages,
      });
      router.push(ROUTES.HOME);
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

    if (step === "preferences") {
      await handleSavePreferences();
      return;
    }

    await handleCreateAccount();
  };

  return (
    <div className="w-full">
      <h1 className="employer-register-form-heading">{heading}</h1>

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

        {step === "preferences" ? (
          <JobSeekerRegisterPreferencesStep
            values={preferences}
            disabled={isSubmitting}
            onChange={(patch) => {
              setPreferences((current) => ({ ...current, ...patch }));
              setErrorMessage(null);
            }}
          />
        ) : null}

        {step === "education" ? (
          <JobSeekerRegisterEducationExperienceStep
            education={education}
            experienceType={experienceType}
            experiences={experiences}
            languages={languages}
            disabled={isSubmitting}
            onEducationChange={(next) => {
              setEducation(next);
              setErrorMessage(null);
            }}
            onExperienceTypeChange={(next) => {
              setExperienceType(next);
              setErrorMessage(null);
            }}
            onExperiencesChange={(next) => {
              setExperiences(next);
              setErrorMessage(null);
            }}
            onLanguagesChange={(next) => {
              setLanguages(next);
              setErrorMessage(null);
            }}
          />
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
              : step === "preferences"
                ? JOB_SEEKER_REGISTER_CONTINUE_LABEL
                : JOB_SEEKER_REGISTER_CREATE_ACCOUNT_LABEL}
        </button>
      </form>
    </div>
  );
}
