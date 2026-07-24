"use client";

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
import {
  registerEmployerAccount,
  resendEmployerOtp,
  verifyEmployerOtp,
  completeEmployerIndividualIdentity,
} from "@/services/employer-register.service";
import type {
  EmployerRegisterAccountType,
  EmployerRegisterDocumentPreview,
  EmployerRegisterDocumentType,
  EmployerRegisterFormData,
  EmployerRegisterImagePreview,
} from "@/types/employer-register";
import { cn } from "@/utils/cn";
import { isAxiosError } from "axios";
import { useEffect, useState, type FormEvent } from "react";
import { EmployerRegisterDocumentVerification } from "./EmployerRegisterDocumentVerification";
import { EmployerRegisterOtpSection } from "./EmployerRegisterOtpSection";

const EMPTY_OTP_DIGITS = Array.from(
  { length: EMPLOYER_REGISTER_OTP_LENGTH },
  () => "",
);

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

  const isConsultancyAccount = accountType === "consultancy";
  const isBusinessAccount = isBusinessEmployerAccountType(accountType);
  const isIndividualAccount = accountType === "individual";
  const businessNameLabel = isConsultancyAccount
    ? "Consultancy Name*"
    : "Company/Business Name*";
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

  const handleAccountTypeChange = (value: EmployerRegisterAccountType) => {
    setAccountType(value);
    setEmployerId(null);
    setErrorMessage(null);

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

    if (field === "whatsappNumber" && (isOtpVisible || isWhatsappVerified)) {
      setIsOtpVisible(false);
      setIsWhatsappVerified(false);
      setOtpDigits(EMPTY_OTP_DIGITS);
      setEmployerId(null);
    }
  };

  const requestOtp = async () => {
    if (!isValidEmployerWhatsappNumber(formData.whatsappNumber)) {
      setErrorMessage("Enter a valid 10-digit WhatsApp number");
      return;
    }

    if (isBusinessAccount && !formData.companyName.trim()) {
      setErrorMessage(
        isConsultancyAccount
          ? "Consultancy Name is required"
          : "Company / Business Name is required",
      );
      return;
    }

    if (isIndividualAccount && !formData.establishmentName.trim()) {
      setErrorMessage("Establishment Name is required");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (employerId) {
        await resendEmployerOtp(employerId, formData.whatsappNumber);
      } else {
        const result = await registerEmployerAccount(formData, accountType);
        setEmployerId(result.employer.id);
      }

      setIsOtpVisible(true);
      setIsWhatsappVerified(false);
      setOtpDigits(EMPTY_OTP_DIGITS);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to send OTP"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isWhatsappVerified) {
      await requestOtp();
      return;
    }

    if (!employerId) {
      setErrorMessage("Please verify your WhatsApp number first");
      return;
    }

    if (isIndividualAccount) {
      if (!documentType) {
        setErrorMessage("Select one identity document");
        return;
      }

      if (!documentPreview?.file) {
        setErrorMessage("Upload your selected identity document");
        return;
      }

      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        await completeEmployerIndividualIdentity({
          employerId,
          documentType,
          documentFile: documentPreview.file,
          profilePhotoFile: profilePhotoPreview?.file,
        });
        onContinue(formData, accountType, employerId);
      } catch (error) {
        setErrorMessage(
          getErrorMessage(error, "Failed to complete individual registration"),
        );
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
    const otp = otpDigits.join("");
    const isComplete = otpDigits.every(
      (digit) => digit.length === 1 && /\d/.test(digit),
    );

    if (!isComplete || !employerId) {
      setErrorMessage("Enter the 4-digit OTP");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await verifyEmployerOtp(employerId, otp);
      setIsWhatsappVerified(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Invalid OTP"));
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
                  <label
                    htmlFor="establishment-name"
                    className="employer-register-form-label"
                  >
                    Establishment Name*
                  </label>
                  <input
                    id="establishment-name"
                    type="text"
                    value={formData.establishmentName}
                    onChange={(event) =>
                      updateField("establishmentName", event.target.value)
                    }
                    placeholder="Enter Establishment Name"
                    autoComplete="organization"
                    className="employer-register-form-input"
                  />
                </>
              ) : (
                <>
                  <label
                    htmlFor="company-name"
                    className="employer-register-form-label"
                  >
                    {businessNameLabel}
                  </label>
                  <input
                    id="company-name"
                    type="text"
                    value={formData.companyName}
                    onChange={(event) =>
                      updateField("companyName", event.target.value)
                    }
                    placeholder={businessNamePlaceholder}
                    autoComplete="organization"
                    className="employer-register-form-input"
                    tabIndex={isBusinessAccount ? undefined : -1}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="employer-register-form-row">
          <div className="employer-register-form-stack">
            <label htmlFor="first-name" className="employer-register-form-label">
              First Name
            </label>
            <input
              id="first-name"
              type="text"
              value={formData.firstName}
              onChange={(event) => updateField("firstName", event.target.value)}
              placeholder={firstNamePlaceholder}
              autoComplete="given-name"
              className="employer-register-form-input"
            />
          </div>

          <div className="employer-register-form-stack">
            <label htmlFor="last-name" className="employer-register-form-label">
              Last Name
            </label>
            <input
              id="last-name"
              type="text"
              value={formData.lastName}
              onChange={(event) => updateField("lastName", event.target.value)}
              placeholder={lastNamePlaceholder}
              autoComplete="family-name"
              className="employer-register-form-input"
            />
          </div>
        </div>

        <div className="employer-register-form-stack">
          <label htmlFor="email-address" className="employer-register-form-label">
            Email Address
          </label>
          <input
            id="email-address"
            type="email"
            value={formData.emailAddress}
            onChange={(event) =>
              updateField("emailAddress", event.target.value)
            }
            placeholder={emailPlaceholder}
            autoComplete="email"
            className="employer-register-form-input"
          />
        </div>

        <div className="employer-register-form-stack">
          <label htmlFor="whatsapp-number" className="employer-register-form-label">
            WhatsApp Number*
          </label>
          <input
            id="whatsapp-number"
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
            onOtpChange={setOtpDigits}
            onVerify={() => {
              void handleVerifyOtp();
            }}
          />
        ) : null}

        {/*
          Company flow must not keep Document Verification mounted.
          CSS-only collapse (opacity:0 + 0fr) still left that large block in the
          scrollable overflow, creating blank space below Create Account.
        */}
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
                onDocumentTypeChange={setDocumentType}
                onDocumentPreviewChange={setDocumentPreview}
                onProfilePhotoPreviewChange={setProfilePhotoPreview}
              />
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <p className="text-sm font-medium text-red-600" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          className="employer-register-form-submit"
          disabled={isSubmitting}
        >
          {submitLabel}
        </button>
      </form>
    </div>
  );
}
