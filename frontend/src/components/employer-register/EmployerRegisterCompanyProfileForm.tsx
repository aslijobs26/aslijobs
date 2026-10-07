"use client";

import { FieldError } from "@/components/auth/FieldError";
import { RequiredFieldLabel } from "@/components/auth/RequiredFieldLabel";
import { AUTH_VALIDATION_MESSAGES } from "@/constants/auth-validation-messages";
import {
  EMPLOYER_REGISTER_BUSINESS_DOCUMENT_OPTIONS,
  EMPLOYER_REGISTER_COMPANY_STRENGTH_OPTIONS,
  EMPLOYER_REGISTER_DOCUMENT_ACCEPT,
  EMPLOYER_REGISTER_DOCUMENT_MAX_SIZE_BYTES,
  EMPLOYER_REGISTER_INDUSTRY_OPTIONS,
  EMPLOYER_REGISTER_INITIAL_COMPANY_PROFILE_DATA,
  getEmployerRegisterBusinessCategoryOptions,
} from "@/constants/employer-register";
import { useTranslate } from "@/i18n/translate";
import { completeEmployerCompanyProfile } from "@/services/employer-register.service";
import type {
  EmployerRegisterBusinessDocumentType,
  EmployerRegisterCompanyProfileData,
  EmployerRegisterDocumentPreview,
  EmployerRegisterImagePreview,
} from "@/types/employer-register";
import {
  clearFieldError,
  focusFirstInvalidField,
  mergeFieldErrors,
  type AuthFieldErrors,
} from "@/utils/auth-field-errors";
import { establishEmployerClientSession } from "@/utils/employer-session";
import { normalizeApiError } from "@/utils/normalize-api-error";
import { CloudUpload, FileText, ShieldCheck, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { EmployerImageUploadField } from "./EmployerImageUploadField";
import { EmployerRegisterLocationFields } from "./EmployerRegisterLocationFields";
import { EmployerRegisterSearchableSelect } from "./EmployerRegisterSearchableSelect";
import { BUSINESS_DOCUMENT_LABEL_KEYS } from "./employer-register-document-labels";
import { useAuthMessageTranslator } from "./useAuthMessageTranslator";

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDocumentFileError(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const allowedExtensions = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);

  if (!allowedExtensions.has(extension ?? "")) {
    return AUTH_VALIDATION_MESSAGES.FILE_TYPE_INVALID;
  }

  if (file.size > EMPLOYER_REGISTER_DOCUMENT_MAX_SIZE_BYTES) {
    return AUTH_VALIDATION_MESSAGES.FILE_SIZE_INVALID;
  }

  return null;
}

type EmployerRegisterCompanyProfileFormProps = {
  employerId: string;
  accountType?: "company" | "consultancy";
  initialCompanyName?: string;
  onContinue?: () => void;
};

export function EmployerRegisterCompanyProfileForm({
  employerId,
  accountType = "company",
  initialCompanyName = "",
  onContinue,
}: EmployerRegisterCompanyProfileFormProps) {
  const t = useTranslate();
  const translateMessage = useAuthMessageTranslator();
  const queryClient = useQueryClient();
  const isConsultancy = accountType === "consultancy";
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<EmployerRegisterCompanyProfileData>({
    ...EMPLOYER_REGISTER_INITIAL_COMPANY_PROFILE_DATA,
    companyName: initialCompanyName,
  });
  const [documentPreview, setDocumentPreview] =
    useState<EmployerRegisterDocumentPreview | null>(null);
  const [companyLogoPreview, setCompanyLogoPreview] =
    useState<EmployerRegisterImagePreview | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

  const businessCategoryOptions = getEmployerRegisterBusinessCategoryOptions(
    formData.industry,
  );

  const businessDocumentOptions = EMPLOYER_REGISTER_BUSINESS_DOCUMENT_OPTIONS.map(
    (option) => ({
      value: option.value,
      label: t(BUSINESS_DOCUMENT_LABEL_KEYS[option.value]),
    }),
  );
  const uploadPrimary = t("auth.employerRegister.documentUploadPrimary");
  const uploadHint = t("auth.employerRegister.documentUploadHint");

  const profileHeading = isConsultancy
    ? t("auth.employerRegister.consultancyProfileHeading")
    : t("auth.employerRegister.companyProfileHeading");
  const nameLabel = isConsultancy
    ? t("auth.employerRegister.consultancyName")
    : t("auth.employerRegister.profileCompanyName");
  const namePlaceholder = isConsultancy
    ? t("auth.employerRegister.consultancyNamePlaceholder")
    : t("auth.employerRegister.profileCompanyNamePlaceholder");

  const clearField = (field: string) => {
    setFieldErrors((current) => clearFieldError(current, field));
  };

  const updateField = <K extends keyof EmployerRegisterCompanyProfileData>(
    field: K,
    value: EmployerRegisterCompanyProfileData[K],
  ) => {
    setFormData((current) => ({ ...current, [field]: value }));
    clearField(field);
  };

  const handleIndustryChange = (industry: string) => {
    setFormData((current) => ({
      ...current,
      industry,
      businessCategory: "",
    }));
    setFieldErrors((current) => {
      let next = clearFieldError(current, "industry");
      next = clearFieldError(next, "businessCategory");
      return next;
    });
  };

  const applySelectedFile = (file: File | undefined) => {
    if (!file) {
      return;
    }

    const fileError = getDocumentFileError(file);
    if (fileError) {
      setFieldErrors((current) =>
        mergeFieldErrors(current, { documentFile: fileError }),
      );
      return;
    }

    clearField("documentFile");
    setDocumentPreview({
      name: file.name,
      sizeBytes: file.size,
      file,
    });
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    applySelectedFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    applySelectedFile(event.dataTransfer.files?.[0]);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const openFileBrowser = () => {
    fileInputRef.current?.click();
  };

  const handleUploadKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFileBrowser();
    }
  };

  const validateForm = (): AuthFieldErrors => {
    const errors: AuthFieldErrors = {};

    if (!formData.companyName.trim()) {
      errors.companyName = isConsultancy
        ? AUTH_VALIDATION_MESSAGES.CONSULTANCY_NAME_REQUIRED
        : AUTH_VALIDATION_MESSAGES.COMPANY_NAME_REQUIRED;
    }

    if (!formData.companyAddress.trim()) {
      errors.companyAddress = AUTH_VALIDATION_MESSAGES.COMPANY_ADDRESS_REQUIRED;
    }

    if (!formData.state.trim()) {
      errors.state = AUTH_VALIDATION_MESSAGES.STATE_REQUIRED;
    }

    if (!formData.city.trim()) {
      errors.city = AUTH_VALIDATION_MESSAGES.CITY_REQUIRED;
    }

    if (!formData.pincode.trim()) {
      errors.pincode = AUTH_VALIDATION_MESSAGES.PINCODE_REQUIRED;
    }

    if (!isConsultancy) {
      if (!formData.industry.trim()) {
        errors.industry = AUTH_VALIDATION_MESSAGES.INDUSTRY_REQUIRED;
      }

      if (!formData.businessCategory.trim()) {
        errors.businessCategory =
          AUTH_VALIDATION_MESSAGES.BUSINESS_CATEGORY_REQUIRED;
      }

      if (!formData.companyStrength.trim()) {
        errors.companyStrength =
          AUTH_VALIDATION_MESSAGES.COMPANY_STRENGTH_REQUIRED;
      }
    }

    if (!formData.verificationDocument) {
      errors.verificationDocument =
        AUTH_VALIDATION_MESSAGES.DOCUMENT_TYPE_REQUIRED;
    }

    if (!documentPreview?.file) {
      errors.documentFile = AUTH_VALIDATION_MESSAGES.DOCUMENT_REQUIRED;
    }

    if (isConsultancy && !companyLogoPreview?.file) {
      errors.companyLogo = AUTH_VALIDATION_MESSAGES.COMPANY_LOGO_REQUIRED;
    }

    return errors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const clientErrors = validateForm();
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
      const session = await completeEmployerCompanyProfile({
        employerId,
        profile: formData,
        documentType:
          formData.verificationDocument as EmployerRegisterBusinessDocumentType,
        documentFile: documentPreview!.file,
        companyLogoFile: companyLogoPreview?.file,
      });
      await establishEmployerClientSession(queryClient, {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
      onContinue?.();
    } catch (error) {
      const normalized = normalizeApiError(error);
      const nextFieldErrors = normalized.fieldErrors;
      setFieldErrors((current) => mergeFieldErrors(current, nextFieldErrors));

      const fieldKeys = Object.keys(nextFieldErrors);
      const hasOnlyScopedFieldError =
        fieldKeys.length === 1 &&
        (Boolean(nextFieldErrors.emailAddress) ||
          Boolean(nextFieldErrors.whatsappNumber));

      setErrorMessage(
        hasOnlyScopedFieldError
          ? null
          : normalized.message || AUTH_VALIDATION_MESSAGES.GENERIC_SUBMIT_ERROR,
      );

      if (fieldKeys.length > 0) {
        focusFirstInvalidField(nextFieldErrors);
      } else {
        requestAnimationFrame(() => {
          document
            .getElementById("employer-company-profile-form-error")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const addressStateCityPincode = (
    <EmployerRegisterLocationFields
      idPrefix="company-profile"
      values={{
        companyAddress: formData.companyAddress,
        state: formData.state,
        city: formData.city,
        pincode: formData.pincode,
      }}
      fieldErrors={fieldErrors}
      useSelectPlaceholders={isConsultancy}
      onAddressChange={(value) => updateField("companyAddress", value)}
      onStateChange={(value) => {
        setFormData((current) => ({
          ...current,
          state: value,
          city: "",
        }));
        clearField("state");
        clearField("city");
      }}
      onStateSelect={(suggestion) => {
        setFormData((current) => ({
          ...current,
          state: suggestion.state,
          city: "",
        }));
        clearField("state");
        clearField("city");
      }}
      onCityChange={(value) => updateField("city", value)}
      onCitySelect={(suggestion) => updateField("city", suggestion.city)}
      onLocationPatch={(next) => {
        setFormData((current) => ({ ...current, ...next }));
        if (next.pincode !== undefined) {
          clearField("pincode");
        }
        if (next.city) {
          clearField("city");
        }
        if (next.state) {
          clearField("state");
        }
      }}
    />
  );

  return (
    <div className="w-full">
      <h1 className="employer-register-form-heading">{profileHeading}</h1>

      <form
        className="employer-register-form-fields mt-8 w-full"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="employer-register-form-stack">
          <RequiredFieldLabel
            htmlFor="company-profile-name"
            required
            className="employer-register-form-label"
          >
            {nameLabel}
          </RequiredFieldLabel>
          <input
            id="company-profile-name"
            name="companyName"
            type="text"
            value={formData.companyName}
            onChange={(event) => updateField("companyName", event.target.value)}
            placeholder={namePlaceholder}
            autoComplete="organization"
            className="employer-register-form-input"
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.companyName)}
            aria-describedby={
              fieldErrors.companyName ? "companyName-error" : undefined
            }
          />
          <FieldError
            id="companyName-error"
            message={translateMessage(fieldErrors.companyName)}
          />
        </div>

        {isConsultancy ? (
          addressStateCityPincode
        ) : (
          <>
            <div className="employer-register-form-row employer-register-form-row--three">
              <EmployerRegisterSearchableSelect
                id="company-profile-industry"
                name="industry"
                label={t("auth.employerRegister.industry")}
                required
                value={formData.industry}
                placeholder={t("auth.employerRegister.selectIndustry")}
                options={EMPLOYER_REGISTER_INDUSTRY_OPTIONS}
                onChange={handleIndustryChange}
                error={fieldErrors.industry}
                errorId="industry-error"
              />
              <EmployerRegisterSearchableSelect
                id="company-profile-business-category"
                name="businessCategory"
                label={t("auth.employerRegister.businessCategory")}
                required
                disabled={!formData.industry}
                value={formData.businessCategory}
                placeholder={t("auth.employerRegister.selectBusinessCategory")}
                options={businessCategoryOptions}
                onChange={(value) => updateField("businessCategory", value)}
                error={fieldErrors.businessCategory}
                errorId="businessCategory-error"
              />
              <EmployerRegisterSearchableSelect
                id="company-profile-strength"
                name="companyStrength"
                label={t("auth.employerRegister.companyStrength")}
                required
                value={formData.companyStrength}
                placeholder={t("auth.employerRegister.selectStrength")}
                options={EMPLOYER_REGISTER_COMPANY_STRENGTH_OPTIONS}
                onChange={(value) => updateField("companyStrength", value)}
                error={fieldErrors.companyStrength}
                errorId="companyStrength-error"
              />
            </div>

            {addressStateCityPincode}
          </>
        )}

        <section className="employer-register-business-verification">
          <div className="employer-register-business-verification-heading">
            <ShieldCheck
              className="employer-register-business-verification-icon"
              strokeWidth={2}
              aria-hidden="true"
            />
            <h2 className="employer-register-form-label min-w-0 break-words">
              {t("auth.employerRegister.businessVerificationTitle")}{" "}
              <span className="text-red-600" aria-hidden="true">
                *
              </span>
            </h2>
          </div>

          <div className="employer-register-form-stack">
            <EmployerRegisterSearchableSelect
              id="company-profile-verification-document"
              name="verificationDocument"
              label={t("auth.employerRegister.selectDocument")}
              hideLabel
              required
              value={formData.verificationDocument}
              placeholder={t("auth.employerRegister.selectDocument")}
              options={businessDocumentOptions}
              onChange={(value) => {
                updateField(
                  "verificationDocument",
                  value as EmployerRegisterBusinessDocumentType,
                );
                setDocumentPreview(null);
                clearField("documentFile");
              }}
              error={fieldErrors.verificationDocument}
              errorId="verificationDocument-error"
            />
          </div>

          {formData.verificationDocument ? (
            <>
              {documentPreview ? (
                <div className="employer-register-document-preview">
                  <span
                    className="employer-register-document-preview-icon"
                    aria-hidden="true"
                  >
                    <FileText className="size-5" strokeWidth={2} />
                  </span>
                  <div className="employer-register-document-preview-copy">
                    <p className="employer-register-document-preview-name">
                      {documentPreview.name}
                    </p>
                    <p className="employer-register-document-preview-size">
                      {formatFileSize(documentPreview.sizeBytes)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="employer-register-document-preview-remove"
                    aria-label={t("auth.employerRegister.removeSelectedDocument")}
                    onClick={() => {
                      setDocumentPreview(null);
                      clearField("documentFile");
                    }}
                  >
                    <X className="size-4" strokeWidth={2.25} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div
                  id="documentFile"
                  className="employer-register-document-dropzone"
                  role="button"
                  tabIndex={0}
                  aria-label={`${uploadPrimary}. ${uploadHint}`}
                  aria-invalid={Boolean(fieldErrors.documentFile) || undefined}
                  aria-describedby={
                    fieldErrors.documentFile ? "documentFile-error" : undefined
                  }
                  onClick={openFileBrowser}
                  onKeyDown={handleUploadKeyDown}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <span
                    className="employer-register-document-dropzone-icon"
                    aria-hidden="true"
                  >
                    <CloudUpload
                      className="employer-register-document-dropzone-icon-svg"
                      strokeWidth={1.75}
                    />
                  </span>
                  <p className="employer-register-document-dropzone-primary break-words">
                    {uploadPrimary}
                  </p>
                  <p className="employer-register-document-dropzone-hint break-words">
                    {uploadHint}
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                id={fileInputId}
                name="documentFile"
                type="file"
                accept={EMPLOYER_REGISTER_DOCUMENT_ACCEPT}
                className="sr-only"
                tabIndex={-1}
                onChange={handleFileInputChange}
              />
              <FieldError
                id="documentFile-error"
                message={translateMessage(fieldErrors.documentFile)}
              />
            </>
          ) : null}

          <EmployerImageUploadField
            label={t("auth.employerRegister.uploadCompanyLogo")}
            name="companyLogo"
            required={isConsultancy}
            optional={!isConsultancy}
            preview={companyLogoPreview}
            error={fieldErrors.companyLogo}
            errorId="companyLogo-error"
            onPreviewChange={(preview) => {
              setCompanyLogoPreview(preview);
              clearField("companyLogo");
            }}
            onInvalidFile={(message) => {
              setFieldErrors((current) =>
                mergeFieldErrors(current, { companyLogo: message }),
              );
            }}
          />
        </section>

        {errorMessage ? (
          <p
            id="employer-company-profile-form-error"
            className="text-sm font-medium text-red-600"
            role="alert"
          >
            {translateMessage(errorMessage)}
          </p>
        ) : null}

        <button
          type="submit"
          className="employer-register-form-submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? t("auth.common.pleaseWait") : t("auth.common.continue")}
        </button>
      </form>
    </div>
  );
}
