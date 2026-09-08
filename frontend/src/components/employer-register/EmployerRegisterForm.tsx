"use client";

import { FieldError } from "@/components/auth/FieldError";
import { RequiredFieldLabel } from "@/components/auth/RequiredFieldLabel";
import { AUTH_VALIDATION_MESSAGES } from "@/constants/auth-validation-messages";
import {
  EMPLOYER_REGISTER_ACCOUNT_TYPE_LABEL,
  EMPLOYER_REGISTER_ACCOUNT_TYPE_OPTIONS,
  EMPLOYER_REGISTER_CONTINUE_LABEL,
  EMPLOYER_REGISTER_DEFAULT_ACCOUNT_TYPE,
  EMPLOYER_REGISTER_HEADING,
  EMPLOYER_REGISTER_INITIAL_FORM_DATA,
  EMPLOYER_REGISTER_OTP_LENGTH,
  EMPLOYER_REGISTER_SEND_OTP_LABEL,
  EMPLOYER_REGISTER_SUBMIT_LABEL,
  isBusinessEmployerAccountType,
  isValidEmployerWhatsappNumber,
} from "@/constants/employer-register";
import { useOtpResendCooldown } from "@/hooks/useOtpResendCooldown";
import {
  completeEmployerIndividualIdentity,
  registerEmployerAccount,
  resendEmployerOtp,
  verifyEmployerOtp,
} from "@/services/employer-register.service";
import type {
  EmployerRegisterAccountType,
  EmployerRegisterDocumentPreview,
  EmployerRegisterDocumentType,
  EmployerRegisterFormData,
  EmployerRegisterImagePreview,
} from "@/types/employer-register";
import {
  clearFieldError,
  focusFirstInvalidField,
  mergeFieldErrors,
  type AuthFieldErrors,
} from "@/utils/auth-field-errors";
import { cn } from "@/utils/cn";
import { establishEmployerClientSession } from "@/utils/employer-session";
import { normalizeApiError } from "@/utils/normalize-api-error";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { EmployerRegisterDocumentVerification } from "./EmployerRegisterDocumentVerification";
import { EmployerRegisterOtpSection } from "./EmployerRegisterOtpSection";

const EMPTY_OTP_DIGITS = Array.from(
  { length: EMPLOYER_REGISTER_OTP_LENGTH },
  () => "",
);

const OTP_FIELD_MESSAGES = new Set<string>([
  AUTH_VALIDATION_MESSAGES.OTP_REQUIRED,
  AUTH_VALIDATION_MESSAGES.OTP_INVALID,
  AUTH_VALIDATION_MESSAGES.OTP_EXPIRED,
  AUTH_VALIDATION_MESSAGES.OTP_TOO_MANY,
]);

function isValidOptionalEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function AccountTypeRadioIndicator({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "employer-register-account-type-indicator",
        checked && "employer-register-account-type-indicator--checked",
      )}
    >
      <span className="employer-register-account-type-indicator-dot" />
    </span>
  );
}

export function EmployerRegisterForm({
  onContinue,
}: {
  onContinue: (
    formData: EmployerRegisterFormData,
    accountType: EmployerRegisterAccountType,
    employerId: string,
  ) => void;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<EmployerRegisterFormData>(
    EMPLOYER_REGISTER_INITIAL_FORM_DATA,
  );
  const [accountType, setAccountType] = useState<EmployerRegisterAccountType>(
    EMPLOYER_REGISTER_DEFAULT_ACCOUNT_TYPE,
  );
  const [employerId, setEmployerId] = useState<string | null>(null);
  const [isOtpVisible, setIsOtpVisible] = useState(false);
  const [isWhatsappVerified, setIsWhatsappVerified] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(EMPTY_OTP_DIGITS);
  const [documentType, setDocumentType] =
    useState<EmployerRegisterDocumentType | null>(null);
  const [documentPreview, setDocumentPreview] =
    useState<EmployerRegisterDocumentPreview | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] =
    useState<EmployerRegisterImagePreview | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const { secondsLeft, isCoolingDown, startCooldown, resetCooldown } =
    useOtpResendCooldown();

  const isConsultancyAccount = accountType === "consultancy";
  const isBusinessAccount = isBusinessEmployerAccountType(accountType);
  const isIndividualAccount = accountType === "individual";
  const businessNameLabel = isConsultancyAccount
    ? "Consultancy Name"
    : "Company/Business Name";
  const businessNamePlaceholder = isConsultancyAccount
    ? "Enter Consultancy Name"
    : "Enter company name";
  const firstNamePlaceholder = "Enter First Name";
  const lastNamePlaceholder = "Enter Last Name";
  const whatsappPlaceholder = "Enter WhatsApp Number";
  const emailPlaceholder = "Enter Email Address";
  const canSendOtp =
    isValidEmployerWhatsappNumber(formData.whatsappNumber) &&
    !isOtpVisible &&
    !isWhatsappVerified &&
    !isSubmitting;

  const [isDocumentFieldVisible, setIsDocumentFieldVisible] = useState(false);

  useEffect(() => {
    if (!isIndividualAccount) {
      setIsDocumentFieldVisible(false);
      return;
    }

    const frameId = requestAnimationFrame(() => {
      setIsDocumentFieldVisible(true);
    });

    return () => cancelAnimationFrame(frameId);
  }, [isIndividualAccount]);

  const clearField = (field: string) => {
    setFieldErrors((current) => clearFieldError(current, field));
  };

  const applyApiError = (error: unknown, fallback: string) => {
    const normalized = normalizeApiError(error);
    const nextFieldErrors = { ...normalized.fieldErrors };

    if (
      !nextFieldErrors.otp &&
      OTP_FIELD_MESSAGES.has(normalized.message)
    ) {
      nextFieldErrors.otp = normalized.message;
    }

    if (normalized.status === 429 && !nextFieldErrors.otp) {
      nextFieldErrors.otp = AUTH_VALIDATION_MESSAGES.OTP_TOO_MANY;
    }

    setFieldErrors((current) => mergeFieldErrors(current, nextFieldErrors));

    const fieldKeys = Object.keys(nextFieldErrors);
    const hasOnlyScopedFieldError =
      fieldKeys.length === 1 &&
      (Boolean(nextFieldErrors.otp) ||
        Boolean(nextFieldErrors.whatsappNumber) ||
        Boolean(nextFieldErrors.emailAddress));

    if (hasOnlyScopedFieldError) {
      // Field-level alert is enough (e.g. Duplicate WhatsApp Number).
      setErrorMessage(null);
    } else {
      setErrorMessage(
        normalized.message ||
          fallback ||
          AUTH_VALIDATION_MESSAGES.GENERIC_SUBMIT_ERROR,
      );
    }

    if (fieldKeys.length > 0) {
      focusFirstInvalidField(nextFieldErrors);
      return;
    }

    requestAnimationFrame(() => {
      document
        .getElementById("employer-register-form-error")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const handleAccountTypeChange = (value: EmployerRegisterAccountType) => {
    setAccountType(value);
    setEmployerId(null);
    setErrorMessage(null);
    setFieldErrors({});

    if (value !== "individual") {
      setDocumentType(null);
      setDocumentPreview(null);
      setProfilePhotoPreview(null);
    }
  };

  const updateField = <K extends keyof EmployerRegisterFormData>(
    field: K,
    value: EmployerRegisterFormData[K],
  ) => {
    setFormData((current) => ({ ...current, [field]: value }));
    clearField(field);

    if (field === "whatsappNumber" && (isOtpVisible || isWhatsappVerified)) {
      setIsOtpVisible(false);
      setIsWhatsappVerified(false);
      setOtpDigits(EMPTY_OTP_DIGITS);
      setEmployerId(null);
      resetCooldown();
      clearField("otp");
    }
  };

  const validateBeforeRequestOtp = (): AuthFieldErrors => {
    const errors: AuthFieldErrors = {};

    if (!isValidEmployerWhatsappNumber(formData.whatsappNumber)) {
      errors.whatsappNumber = formData.whatsappNumber.trim()
        ? AUTH_VALIDATION_MESSAGES.WHATSAPP_INVALID
        : AUTH_VALIDATION_MESSAGES.WHATSAPP_REQUIRED;
    }

    if (isBusinessAccount && !formData.companyName.trim()) {
      errors.companyName = isConsultancyAccount
        ? AUTH_VALIDATION_MESSAGES.CONSULTANCY_NAME_REQUIRED
        : AUTH_VALIDATION_MESSAGES.COMPANY_NAME_REQUIRED;
    }

    if (isIndividualAccount && !formData.establishmentName.trim()) {
      errors.establishmentName =
        AUTH_VALIDATION_MESSAGES.ESTABLISHMENT_NAME_REQUIRED;
    }

    if (!formData.firstName.trim()) {
      errors.firstName = AUTH_VALIDATION_MESSAGES.FIRST_NAME_REQUIRED;
    }

    if (!formData.lastName.trim()) {
      errors.lastName = AUTH_VALIDATION_MESSAGES.LAST_NAME_REQUIRED;
    }

    if (!isValidOptionalEmail(formData.emailAddress)) {
      errors.emailAddress = AUTH_VALIDATION_MESSAGES.EMAIL_INVALID;
    }

    return errors;
  };

  const requestOtp = async () => {
    if (isSubmitting) {
      return;
    }

    const clientErrors = validateBeforeRequestOtp();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setErrorMessage(null);
      focusFirstInvalidField(clientErrors);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      if (employerId) {
        const result = await resendEmployerOtp(employerId);
        startCooldown(result.resendAvailableIn);
      } else {
        const result = await registerEmployerAccount(formData, accountType);
        setEmployerId(result.employer.id);
        startCooldown(result.resendAvailableIn);
      }

      setIsOtpVisible(true);
      setIsWhatsappVerified(false);
      setOtpDigits(EMPTY_OTP_DIGITS);
    } catch (error) {
      applyApiError(error, AUTH_VALIDATION_MESSAGES.GENERIC_SUBMIT_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!isWhatsappVerified) {
      if (isOtpVisible && isCoolingDown) {
        return;
      }
      await requestOtp();
      return;
    }

    if (!employerId) {
      setErrorMessage("Please verify your WhatsApp number first");
      return;
    }

    if (isIndividualAccount) {
      const identityErrors: AuthFieldErrors = {};

      if (!documentType) {
        identityErrors.documentType =
          AUTH_VALIDATION_MESSAGES.DOCUMENT_TYPE_REQUIRED;
      }

      if (!documentPreview?.file) {
        identityErrors.documentFile =
          AUTH_VALIDATION_MESSAGES.DOCUMENT_REQUIRED;
      }

      if (Object.keys(identityErrors).length > 0) {
        setFieldErrors(identityErrors);
        setErrorMessage(null);
        focusFirstInvalidField(identityErrors);
        return;
      }

      setIsSubmitting(true);
      setErrorMessage(null);
      setFieldErrors({});

      try {
        const session = await completeEmployerIndividualIdentity({
          employerId,
          documentType: documentType!,
          documentFile: documentPreview!.file,
          profilePhotoFile: profilePhotoPreview?.file,
        });
        await establishEmployerClientSession(queryClient, {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        });
        onContinue(formData, accountType, employerId);
      } catch (error) {
        applyApiError(error, AUTH_VALIDATION_MESSAGES.GENERIC_SUBMIT_ERROR);
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    onContinue(formData, accountType, employerId);
  };

  const handleSendOtp = () => {
    void requestOtp();
  };

  const handleVerifyOtp = async () => {
    if (isSubmitting) {
      return;
    }

    const otp = otpDigits.join("");
    const isComplete = otpDigits.every(
      (digit) => digit.length === 1 && /\d/.test(digit),
    );

    if (!isComplete || !employerId) {
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
      await verifyEmployerOtp(employerId, otp);
      setIsWhatsappVerified(true);
      setFieldErrors((current) => clearFieldError(current, "otp"));
    } catch (error) {
      applyApiError(error, AUTH_VALIDATION_MESSAGES.OTP_INVALID);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLabel = isWhatsappVerified
    ? EMPLOYER_REGISTER_CONTINUE_LABEL
    : EMPLOYER_REGISTER_SUBMIT_LABEL;

  return (
    <div className="w-full">
      <h1 className="employer-register-form-heading">
        {EMPLOYER_REGISTER_HEADING}
      </h1>

      <form
        className="employer-register-form-fields mt-8 w-full"
        onSubmit={handleSubmit}
        noValidate
      >
        <fieldset className="employer-register-account-type">
          <legend className="sr-only">
            {EMPLOYER_REGISTER_ACCOUNT_TYPE_LABEL}
          </legend>
          <div
            className="employer-register-account-type-options"
            role="radiogroup"
            aria-label={EMPLOYER_REGISTER_ACCOUNT_TYPE_LABEL}
          >
            {EMPLOYER_REGISTER_ACCOUNT_TYPE_OPTIONS.map((option) => {
              const checked = accountType === option.value;

              return (
                <label
                  key={option.value}
                  className={cn(
                    "employer-register-account-type-option",
                    checked && "employer-register-account-type-option--checked",
                  )}
                >
                  <input
                    type="radio"
                    name="employer-account-type"
                    value={option.value}
                    checked={checked}
                    onChange={() => handleAccountTypeChange(option.value)}
                    className="sr-only"
                  />
                  <AccountTypeRadioIndicator checked={checked} />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div
          className="employer-register-company-field"
          data-visible={
            isBusinessAccount || isIndividualAccount ? "true" : "false"
          }
          aria-hidden={!(isBusinessAccount || isIndividualAccount)}
        >
          <div className="employer-register-company-field-inner">
            <div className="employer-register-form-stack">
              {isIndividualAccount ? (
                <>
                  <RequiredFieldLabel
                    htmlFor="establishment-name"
                    required
                    className="employer-register-form-label"
                  >
                    Establishment Name
                  </RequiredFieldLabel>
                  <input
                    id="establishment-name"
                    name="establishmentName"
                    type="text"
                    value={formData.establishmentName}
                    onChange={(event) =>
                      updateField("establishmentName", event.target.value)
                    }
                    placeholder="Enter Establishment Name"
                    autoComplete="organization"
                    className="employer-register-form-input"
                    aria-required="true"
                    aria-invalid={Boolean(fieldErrors.establishmentName)}
                    aria-describedby={
                      fieldErrors.establishmentName
                        ? "establishmentName-error"
                        : undefined
                    }
                  />
                  <FieldError
                    id="establishmentName-error"
                    message={fieldErrors.establishmentName}
                  />
                </>
              ) : (
                <>
                  <RequiredFieldLabel
                    htmlFor="company-name"
                    required={isBusinessAccount}
                    className="employer-register-form-label"
                  >
                    {businessNameLabel}
                  </RequiredFieldLabel>
                  <input
                    id="company-name"
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={(event) =>
                      updateField("companyName", event.target.value)
                    }
                    placeholder={businessNamePlaceholder}
                    autoComplete="organization"
                    className="employer-register-form-input"
                    tabIndex={isBusinessAccount ? undefined : -1}
                    aria-required={isBusinessAccount}
                    aria-invalid={Boolean(fieldErrors.companyName)}
                    aria-describedby={
                      fieldErrors.companyName ? "companyName-error" : undefined
                    }
                  />
                  <FieldError
                    id="companyName-error"
                    message={fieldErrors.companyName}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="employer-register-form-row">
          <div className="employer-register-form-stack">
            <RequiredFieldLabel
              htmlFor="first-name"
              required
              className="employer-register-form-label"
            >
              First Name
            </RequiredFieldLabel>
            <input
              id="first-name"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={(event) => updateField("firstName", event.target.value)}
              placeholder={firstNamePlaceholder}
              autoComplete="given-name"
              className="employer-register-form-input"
              aria-required="true"
              aria-invalid={Boolean(fieldErrors.firstName)}
              aria-describedby={
                fieldErrors.firstName ? "firstName-error" : undefined
              }
            />
            <FieldError id="firstName-error" message={fieldErrors.firstName} />
          </div>

          <div className="employer-register-form-stack">
            <RequiredFieldLabel
              htmlFor="last-name"
              required
              className="employer-register-form-label"
            >
              Last Name
            </RequiredFieldLabel>
            <input
              id="last-name"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={(event) => updateField("lastName", event.target.value)}
              placeholder={lastNamePlaceholder}
              autoComplete="family-name"
              className="employer-register-form-input"
              aria-required="true"
              aria-invalid={Boolean(fieldErrors.lastName)}
              aria-describedby={
                fieldErrors.lastName ? "lastName-error" : undefined
              }
            />
            <FieldError id="lastName-error" message={fieldErrors.lastName} />
          </div>
        </div>

        <div className="employer-register-form-stack">
          <RequiredFieldLabel
            htmlFor="email-address"
            className="employer-register-form-label"
          >
            Email Address
          </RequiredFieldLabel>
          <input
            id="email-address"
            name="emailAddress"
            type="email"
            value={formData.emailAddress}
            onChange={(event) =>
              updateField("emailAddress", event.target.value)
            }
            placeholder={emailPlaceholder}
            autoComplete="email"
            className="employer-register-form-input"
            aria-invalid={Boolean(fieldErrors.emailAddress)}
            aria-describedby={
              fieldErrors.emailAddress ? "emailAddress-error" : undefined
            }
          />
          <FieldError
            id="emailAddress-error"
            message={fieldErrors.emailAddress}
          />
        </div>

        <div className="employer-register-form-stack">
          <RequiredFieldLabel
            htmlFor="whatsapp-number"
            required
            className="employer-register-form-label"
          >
            WhatsApp Number
          </RequiredFieldLabel>
          <input
            id="whatsapp-number"
            name="whatsappNumber"
            type="tel"
            inputMode="numeric"
            value={formData.whatsappNumber}
            onChange={(event) =>
              updateField(
                "whatsappNumber",
                event.target.value.replace(/\D/g, "").slice(0, 10),
              )
            }
            placeholder={whatsappPlaceholder}
            autoComplete="tel"
            className="employer-register-form-input"
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.whatsappNumber)}
            aria-describedby={
              fieldErrors.whatsappNumber ? "whatsappNumber-error" : undefined
            }
          />
          <FieldError
            id="whatsappNumber-error"
            message={fieldErrors.whatsappNumber}
          />
          {canSendOtp ? (
            <button
              type="button"
              className="employer-register-send-otp-link"
              onClick={handleSendOtp}
            >
              {EMPLOYER_REGISTER_SEND_OTP_LABEL}
            </button>
          ) : null}
        </div>

        {isOtpVisible || isWhatsappVerified ? (
          <EmployerRegisterOtpSection
            otpDigits={otpDigits}
            isVerified={isWhatsappVerified}
            isSubmitting={isSubmitting}
            resendSecondsLeft={secondsLeft}
            otpError={fieldErrors.otp}
            onOtpChange={(next) => {
              setOtpDigits(next);
              clearField("otp");
            }}
            onVerify={() => {
              void handleVerifyOtp();
            }}
            onResend={() => {
              if (!isCoolingDown) {
                void requestOtp();
              }
            }}
          />
        ) : null}

        {isIndividualAccount ? (
          <div
            className="employer-register-document-field"
            data-visible={isDocumentFieldVisible ? "true" : "false"}
          >
            <div className="employer-register-document-field-inner">
              <EmployerRegisterDocumentVerification
                documentType={documentType}
                documentPreview={documentPreview}
                profilePhotoPreview={profilePhotoPreview}
                documentTypeError={fieldErrors.documentType}
                documentFileError={fieldErrors.documentFile}
                onDocumentTypeChange={setDocumentType}
                onDocumentPreviewChange={setDocumentPreview}
                onProfilePhotoPreviewChange={setProfilePhotoPreview}
                onDocumentTypeErrorClear={() => clearField("documentType")}
                onDocumentFileErrorChange={(message) => {
                  if (message) {
                    setFieldErrors((current) =>
                      mergeFieldErrors(current, { documentFile: message }),
                    );
                  } else {
                    clearField("documentFile");
                  }
                }}
              />
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <p
            id="employer-register-form-error"
            className="text-sm font-medium text-red-600"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          className="employer-register-form-submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {submitLabel}
        </button>
      </form>
    </div>
  );
}
