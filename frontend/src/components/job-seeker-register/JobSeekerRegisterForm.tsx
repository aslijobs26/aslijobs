"use client";

import { FieldError } from "@/components/auth/FieldError";
import { RequiredFieldLabel } from "@/components/auth/RequiredFieldLabel";
import { EmployerRegisterOtpInput } from "@/components/employer-register/EmployerRegisterOtpInput";
import {
  EMPTY_EDUCATION,
  JobSeekerRegisterEducationExperienceStep,
} from "@/components/job-seeker-register/JobSeekerRegisterEducationExperienceStep";
import { JobSeekerRegisterPreferencesStep } from "@/components/job-seeker-register/JobSeekerRegisterPreferencesStep";
import { AUTH_VALIDATION_MESSAGES } from "@/constants/auth-validation-messages";
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
import { useOtpResendCooldown } from "@/hooks/useOtpResendCooldown";
import {
  completeJobSeekerRegistration,
  registerJobSeekerAccount,
  resendJobSeekerOtp,
  saveJobSeekerPreferences,
  verifyJobSeekerOtp,
} from "@/services/job-seeker-register.service";
import type {
  JobSeekerAvailabilityStatus,
  JobSeekerEducation,
  JobSeekerExperienceEntry,
  JobSeekerExperienceType,
  JobSeekerGender,
  JobSeekerJobType,
  JobSeekerLanguage,
  JobSeekerSalaryPeriod,
  JobSeekerWorkMode,
} from "@/types/job-seeker";
import {
  clearFieldError,
  focusFirstInvalidField,
  mergeFieldErrors,
  type AuthFieldErrors,
} from "@/utils/auth-field-errors";
import { establishJobSeekerClientSession } from "@/utils/job-seeker-session";
import { normalizeApiError } from "@/utils/normalize-api-error";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

const EMPTY_OTP_DIGITS = Array.from(
  { length: JOB_SEEKER_REGISTER_OTP_LENGTH },
  () => "",
);

type RegisterStep = "account" | "otp" | "preferences" | "education";

function applyApiFailure(error: unknown): {
  formError: string | null;
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

  const fieldKeys = Object.keys(fieldErrors);
  const hasOnlyScopedFieldError =
    fieldKeys.length === 1 &&
    (Boolean(fieldErrors.otp) ||
      Boolean(fieldErrors.whatsappNumber) ||
      Boolean(fieldErrors.emailAddress));

  return {
    // Prefer the field alert for duplicate WhatsApp / OTP so users see it.
    formError: hasOnlyScopedFieldError ? null : normalized.message,
    fieldErrors,
  };
}

function validateAccountFields(
  fullName: string,
  whatsappNumber: string,
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  if (!fullName.trim()) {
    errors.fullName = AUTH_VALIDATION_MESSAGES.FULL_NAME_REQUIRED;
  }

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

function validatePreferencesFields(preferences: {
  dateOfBirth: string;
  gender: string;
  jobRole: string;
  jobType: string;
  workMode: string;
  preferredJobLocation: string;
  expectedSalary: string;
  expectedSalaryPeriod: string;
}): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  if (!preferences.dateOfBirth.trim()) {
    errors.dateOfBirth = "Date of birth is required.";
  }

  if (!preferences.gender) {
    errors.gender = "Gender is required.";
  }

  if (!preferences.jobRole.trim()) {
    errors.jobRole = "Job role is required.";
  }

  if (!preferences.jobType) {
    errors.jobType = "Job type is required.";
  }

  if (!preferences.workMode) {
    errors.workMode = "Work mode is required.";
  }

  if (!preferences.preferredJobLocation.trim()) {
    errors.preferredJobLocation = "Preferred job location is required.";
  }

  if (!preferences.expectedSalary.trim()) {
    errors.expectedSalary = "Expected salary is required.";
  } else if (
    !/^\d+$/.test(preferences.expectedSalary) ||
    Number(preferences.expectedSalary) <= 0
  ) {
    errors.expectedSalary = "Expected salary must be greater than 0.";
  }

  if (!preferences.expectedSalaryPeriod) {
    errors.expectedSalaryPeriod = "Salary period is required.";
  }

  return errors;
}

/** Surfaces education-level required fields as fieldErrors (visible fields only). */
function validateEducationFields(
  education: JobSeekerEducation,
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  const requireField = (field: keyof JobSeekerEducation, message: string) => {
    const value = education[field];
    if (typeof value === "string" && !value.trim()) {
      errors[`education.${field}`] = message;
    }
  };

  switch (education.level) {
    case "below_10th":
      requireField("schoolName", "School name is required.");
      break;
    case "10th_pass":
      requireField("schoolName", "School name is required.");
      requireField("board", "Board is required.");
      requireField("passingYear", "Passing year is required.");
      break;
    case "intermediate":
      requireField("collegeName", "College name is required.");
      requireField("stream", "Stream is required.");
      requireField("passingYear", "Passing year is required.");
      break;
    case "iti":
      requireField("instituteName", "Institute name is required.");
      requireField("trade", "Trade is required.");
      requireField("passingYear", "Passing year is required.");
      break;
    case "diploma":
      requireField("collegeName", "College name is required.");
      requireField("branch", "Branch is required.");
      requireField("passingYear", "Passing year is required.");
      break;
    case "graduation":
    case "post_graduation":
      requireField("collegeName", "College name is required.");
      requireField("degree", "Degree is required.");
      requireField("specialization", "Specialization is required.");
      requireField("passingYear", "Passing year is required.");
      break;
    default:
      break;
  }

  return errors;
}

function validateEducationStep(params: {
  education: JobSeekerEducation;
  experienceType: JobSeekerExperienceType | "";
  experiences: JobSeekerExperienceEntry[];
  languages: JobSeekerLanguage[];
  availabilityStatus: JobSeekerAvailabilityStatus | "";
}): AuthFieldErrors {
  const {
    education,
    experienceType,
    experiences,
    languages,
    availabilityStatus,
  } = params;
  const errors = validateEducationFields(education);

  if (!experienceType) {
    errors.experienceType = "Select fresher or experienced.";
  }

  if (experienceType === "experienced") {
    if (experiences.length === 0) {
      errors.experiences = "Add at least one work experience.";
    }

    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    for (const [index, entry] of experiences.entries()) {
      const prefix = `experiences.${index}`;

      if (!entry.companyName.trim()) {
        errors[`${prefix}.companyName`] = "Company name is required.";
      }
      if (!entry.jobRole.trim()) {
        errors[`${prefix}.jobRole`] = "Job role is required.";
      }
      if (!entry.industry.trim()) {
        errors[`${prefix}.industry`] = "Industry is required.";
      }
      if (!entry.startDate) {
        errors[`${prefix}.startDate`] = "Start date is required.";
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.startDate)) {
        errors[`${prefix}.startDate`] = "Start date must be a valid date.";
      } else if (entry.startDate > todayIso) {
        errors[`${prefix}.startDate`] = "Start date cannot be in the future.";
      }

      if (!entry.currentlyWorking) {
        if (!entry.endDate) {
          errors[`${prefix}.endDate`] =
            "End date is required unless currently working.";
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.endDate)) {
          errors[`${prefix}.endDate`] = "End date must be a valid date.";
        } else if (entry.endDate > todayIso) {
          errors[`${prefix}.endDate`] = "End date cannot be in the future.";
        } else if (entry.startDate && entry.endDate < entry.startDate) {
          errors[`${prefix}.endDate`] =
            "End date cannot be before start date.";
        }
      }

      if (!entry.salary.trim()) {
        errors[`${prefix}.salary`] = "Salary is required.";
      }
      if (!entry.location.trim()) {
        errors[`${prefix}.location`] = "Location is required.";
      }
    }
  }

  if (languages.length === 0) {
    errors.languages = "Select at least one language.";
  }

  if (!availabilityStatus) {
    errors.availabilityStatus = "Please select your availability status.";
  }

  return errors;
}

export function JobSeekerRegisterForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const otpSectionRef = useRef<HTMLDivElement>(null);
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
  const [availabilityStatus, setAvailabilityStatus] = useState<
    JobSeekerAvailabilityStatus | ""
  >("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const { secondsLeft, isCoolingDown, startCooldown, resetCooldown } =
    useOtpResendCooldown();

  const fullNameErrorId = "job-seeker-register-full-name-error";
  const whatsappErrorId = "job-seeker-register-whatsapp-error";
  const otpErrorId = "job-seeker-register-otp-error";
  const formErrorId = "job-seeker-register-form-error";

  useEffect(() => {
    if (step !== "otp") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      otpSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  const heading =
    step === "preferences"
      ? JOB_SEEKER_REGISTER_PREFERENCES_HEADING
      : step === "education"
        ? JOB_SEEKER_REGISTER_EDUCATION_HEADING
        : JOB_SEEKER_REGISTER_HEADING;

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
      return;
    }

    if (message) {
      requestAnimationFrame(() => {
        document
          .getElementById("job-seeker-register-form-error")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  };

  const handleSendOtp = async () => {
    if (isSubmitting) {
      return;
    }

    const errors = validateAccountFields(fullName, whatsappNumber);
    if (Object.keys(errors).length > 0) {
      showClientErrors(errors);
      return;
    }

    setIsSubmitting(true);
    clearErrors();

    try {
      const result = await registerJobSeekerAccount(
        fullName.trim(),
        whatsappNumber,
      );

      if (!result?.jobSeekerId) {
        setFormError(
          "OTP was sent but the registration session is incomplete. Please try again.",
        );
        return;
      }

      setJobSeekerId(result.jobSeekerId);
      setOtpDigits([...EMPTY_OTP_DIGITS]);
      setStep("otp");
      startCooldown(result.resendAvailableIn);
    } catch (error) {
      showApiFailure(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!jobSeekerId || isCoolingDown || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    clearErrors();

    try {
      const result = await resendJobSeekerOtp(jobSeekerId);
      setOtpDigits(EMPTY_OTP_DIGITS);
      startCooldown(result.resendAvailableIn);
    } catch (error) {
      showApiFailure(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (isSubmitting) {
      return;
    }

    if (!jobSeekerId) {
      setFormError("Registration session expired. Please start again.");
      return;
    }

    const errors = validateOtpDigits(otpDigits);
    if (Object.keys(errors).length > 0) {
      showClientErrors(errors);
      return;
    }

    setIsSubmitting(true);
    clearErrors();

    try {
      await verifyJobSeekerOtp(jobSeekerId, otpDigits.join(""));
      setStep("preferences");
    } catch (error) {
      showApiFailure(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePreferences = async () => {
    if (isSubmitting) {
      return;
    }

    if (!jobSeekerId) {
      setFormError("Registration session expired. Please start again.");
      return;
    }

    const errors = validatePreferencesFields(preferences);
    if (Object.keys(errors).length > 0) {
      showClientErrors(errors);
      return;
    }

    setIsSubmitting(true);
    clearErrors();

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
      showApiFailure(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = async () => {
    if (isSubmitting) {
      return;
    }

    if (!jobSeekerId) {
      setFormError("Registration session expired. Please start again.");
      return;
    }

    const errors = validateEducationStep({
      education,
      experienceType,
      experiences,
      languages,
      availabilityStatus,
    });

    if (Object.keys(errors).length > 0) {
      showClientErrors(errors);
      return;
    }

    setIsSubmitting(true);
    clearErrors();

    try {
      const data = await completeJobSeekerRegistration({
        jobSeekerId,
        education,
        experienceType: experienceType as JobSeekerExperienceType,
        experiences: experienceType === "experienced" ? experiences : [],
        languages,
        availabilityStatus: availabilityStatus as JobSeekerAvailabilityStatus,
      });
      await establishJobSeekerClientSession(queryClient, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        jobSeeker: data.jobSeeker,
      });
      router.push(ROUTES.HOME);
    } catch (error) {
      showApiFailure(error);
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
        aria-describedby={formError ? formErrorId : undefined}
      >
        {step === "account" || step === "otp" ? (
          <>
            <div className="employer-register-form-stack">
              <RequiredFieldLabel
                htmlFor="job-seeker-register-full-name"
                required
                className="employer-register-form-label"
              >
                {JOB_SEEKER_REGISTER_FULL_NAME_LABEL}
              </RequiredFieldLabel>
              <input
                id="job-seeker-register-full-name"
                name="fullName"
                type="text"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  clearSingleFieldError("fullName");
                }}
                placeholder={JOB_SEEKER_REGISTER_FULL_NAME_PLACEHOLDER}
                autoComplete="name"
                className="employer-register-form-input"
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.fullName) || undefined}
                aria-describedby={
                  fieldErrors.fullName ? fullNameErrorId : undefined
                }
                disabled={isSubmitting || step === "otp"}
              />
              <FieldError id={fullNameErrorId} message={fieldErrors.fullName} />
            </div>

            <div className="employer-register-form-stack">
              <RequiredFieldLabel
                htmlFor="job-seeker-register-whatsapp"
                required
                className="employer-register-form-label"
              >
                {JOB_SEEKER_REGISTER_WHATSAPP_LABEL}
              </RequiredFieldLabel>
              <input
                id="job-seeker-register-whatsapp"
                name="whatsappNumber"
                type="tel"
                inputMode="numeric"
                value={whatsappNumber}
                onChange={(event) => {
                  setWhatsappNumber(
                    event.target.value.replace(/\D/g, "").slice(0, 10),
                  );
                  clearSingleFieldError("whatsappNumber");
                  if (step === "otp") {
                    resetCooldown();
                  }
                }}
                placeholder={JOB_SEEKER_REGISTER_WHATSAPP_PLACEHOLDER}
                autoComplete="tel"
                className="employer-register-form-input"
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.whatsappNumber) || undefined}
                aria-describedby={
                  fieldErrors.whatsappNumber ? whatsappErrorId : undefined
                }
                disabled={isSubmitting || step === "otp"}
              />
              <FieldError
                id={whatsappErrorId}
                message={fieldErrors.whatsappNumber}
              />
            </div>
          </>
        ) : null}

        {step === "otp" ? (
          <div
            ref={otpSectionRef}
            className="employer-register-otp-section"
            data-testid="job-seeker-register-otp"
          >
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
              {JOB_SEEKER_REGISTER_RESEND_PROMPT}{" "}
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
                  : JOB_SEEKER_REGISTER_RESEND_LABEL}
              </button>
            </p>
          </div>
        ) : null}

        {step === "preferences" ? (
          <JobSeekerRegisterPreferencesStep
            values={preferences}
            fieldErrors={fieldErrors}
            disabled={isSubmitting}
            onChange={(patch) => {
              setPreferences((current) => ({ ...current, ...patch }));
              for (const key of Object.keys(patch)) {
                clearSingleFieldError(key);
              }
            }}
          />
        ) : null}

        {step === "education" ? (
          <JobSeekerRegisterEducationExperienceStep
            education={education}
            experienceType={experienceType}
            experiences={experiences}
            languages={languages}
            availabilityStatus={availabilityStatus}
            fieldErrors={fieldErrors}
            disabled={isSubmitting}
            onClearFieldError={clearSingleFieldError}
            onEducationChange={(next) => {
              setEducation(next);
              setFormError(null);
            }}
            onExperienceTypeChange={(next) => {
              setExperienceType(next);
              clearSingleFieldError("experienceType");
            }}
            onExperiencesChange={(next) => {
              setExperiences(next);
              clearSingleFieldError("experiences");
            }}
            onLanguagesChange={(next) => {
              setLanguages(next);
              clearSingleFieldError("languages");
            }}
            onAvailabilityStatusChange={(next) => {
              setAvailabilityStatus(next);
              clearSingleFieldError("availabilityStatus");
            }}
          />
        ) : null}

        {formError ? (
          <p id={formErrorId} className="text-sm font-medium text-red-600" role="alert">
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
            : step === "account"
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
