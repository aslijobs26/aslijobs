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
  isValidEmployerWhatsappNumber,
} from "@/constants/employer-register";
import type {
  EmployerRegisterAccountType,
  EmployerRegisterDocumentPreview,
  EmployerRegisterDocumentType,
  EmployerRegisterFormData,
} from "@/types/employer-register";
import { cn } from "@/utils/cn";
import { useState, type FormEvent } from "react";
import { EmployerRegisterDocumentVerification } from "./EmployerRegisterDocumentVerification";
import { EmployerRegisterOtpSection } from "./EmployerRegisterOtpSection";

const EMPTY_OTP_DIGITS = Array.from(
  { length: EMPLOYER_REGISTER_OTP_LENGTH },
  () => "",
);

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
  onContinue: (formData: EmployerRegisterFormData) => void;
}) {
  const [formData, setFormData] = useState<EmployerRegisterFormData>(
    EMPLOYER_REGISTER_INITIAL_FORM_DATA,
  );
  const [accountType, setAccountType] = useState<EmployerRegisterAccountType>(
    EMPLOYER_REGISTER_DEFAULT_ACCOUNT_TYPE,
  );
  const [isOtpVisible, setIsOtpVisible] = useState(false);
  const [isWhatsappVerified, setIsWhatsappVerified] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(EMPTY_OTP_DIGITS);
  const [documentType, setDocumentType] =
    useState<EmployerRegisterDocumentType | null>(null);
  const [documentPreview, setDocumentPreview] =
    useState<EmployerRegisterDocumentPreview | null>(null);

  const isCompanyAccount = accountType === "company";
  const isIndividualAccount = accountType === "individual";
  const canSendOtp =
    isValidEmployerWhatsappNumber(formData.whatsappNumber) &&
    !isOtpVisible &&
    !isWhatsappVerified;

  const handleAccountTypeChange = (value: EmployerRegisterAccountType) => {
    setAccountType(value);

    if (value === "company") {
      setDocumentType(null);
      setDocumentPreview(null);
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
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isWhatsappVerified) {
      return;
    }

    onContinue(formData);
  };

  const handleSendOtp = () => {
    if (!isValidEmployerWhatsappNumber(formData.whatsappNumber)) {
      return;
    }

    setIsOtpVisible(true);
    setIsWhatsappVerified(false);
    setOtpDigits(EMPTY_OTP_DIGITS);
  };

  const handleVerifyOtp = () => {
    const isComplete = otpDigits.every(
      (digit) => digit.length === 1 && /\d/.test(digit),
    );

    if (!isComplete) {
      return;
    }

    setIsWhatsappVerified(true);
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
          data-visible={isCompanyAccount ? "true" : "false"}
          aria-hidden={!isCompanyAccount}
        >
          <div className="employer-register-company-field-inner">
            <div className="employer-register-form-stack">
              <label
                htmlFor="company-name"
                className="employer-register-form-label"
              >
                Company/Business Name*
              </label>
              <input
                id="company-name"
                type="text"
                value={formData.companyName}
                onChange={(event) =>
                  updateField("companyName", event.target.value)
                }
                placeholder="Enter company name"
                autoComplete="organization"
                className="employer-register-form-input"
                tabIndex={isCompanyAccount ? undefined : -1}
              />
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
              placeholder="Enter company name"
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
              placeholder="Enter company name"
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
            placeholder="Enter Email Address"
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
            placeholder="Enter WhatsApp Number"
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
            onVerify={handleVerifyOtp}
          />
        ) : null}

        <div
          className="employer-register-document-field"
          data-visible={isIndividualAccount ? "true" : "false"}
          aria-hidden={!isIndividualAccount}
        >
          <div className="employer-register-document-field-inner">
            <EmployerRegisterDocumentVerification
              documentType={documentType}
              documentPreview={documentPreview}
              onDocumentTypeChange={setDocumentType}
              onDocumentPreviewChange={setDocumentPreview}
            />
          </div>
        </div>

        <button type="submit" className="employer-register-form-submit">
          {submitLabel}
        </button>
      </form>
    </div>
  );
}
