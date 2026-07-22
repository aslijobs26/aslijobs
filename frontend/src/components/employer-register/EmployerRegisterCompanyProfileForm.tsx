"use client";

import {
  EMPLOYER_REGISTER_BUSINESS_DOCUMENT_OPTIONS,
  EMPLOYER_REGISTER_BUSINESS_VERIFICATION_TITLE,
  EMPLOYER_REGISTER_COMPANY_PROFILE_HEADING,
  EMPLOYER_REGISTER_COMPANY_STRENGTH_OPTIONS,
  EMPLOYER_REGISTER_CONSULTANCY_PROFILE_HEADING,
  EMPLOYER_REGISTER_CONTINUE_LABEL,
  EMPLOYER_REGISTER_DOCUMENT_ACCEPT,
  EMPLOYER_REGISTER_DOCUMENT_MAX_SIZE_BYTES,
  EMPLOYER_REGISTER_DOCUMENT_UPLOAD_HINT,
  EMPLOYER_REGISTER_DOCUMENT_UPLOAD_PRIMARY,
  EMPLOYER_REGISTER_INDUSTRY_OPTIONS,
  EMPLOYER_REGISTER_INITIAL_COMPANY_PROFILE_DATA,
  EMPLOYER_REGISTER_PINCODE_LOCATION_MAP,
  EMPLOYER_REGISTER_PINCODE_OPTIONS,
  getEmployerRegisterBusinessCategoryOptions,
} from "@/constants/employer-register";
import { completeEmployerCompanyProfile } from "@/services/employer-register.service";
import type {
  EmployerRegisterBusinessDocumentType,
  EmployerRegisterCompanyProfileData,
  EmployerRegisterDocumentPreview,
  EmployerRegisterImagePreview,
} from "@/types/employer-register";
import { CloudUpload, FileText, ShieldCheck, X } from "lucide-react";
import { isAxiosError } from "axios";
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
import { EmployerRegisterPlaceAutocomplete } from "./EmployerRegisterPlaceAutocomplete";
import { EmployerRegisterSearchableSelect } from "./EmployerRegisterSearchableSelect";

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAcceptedFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const allowedExtensions = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);

  return (
    allowedExtensions.has(extension ?? "") &&
    file.size <= EMPLOYER_REGISTER_DOCUMENT_MAX_SIZE_BYTES
  );
}

type EmployerRegisterCompanyProfileFormProps = {
  employerId: string;
  accountType?: "company" | "consultancy";
  initialCompanyName?: string;
  initialWhatsappNumber?: string;
  initialEmailAddress?: string;
  onContinue?: () => void;
};

export function EmployerRegisterCompanyProfileForm({
  employerId,
  accountType = "company",
  initialCompanyName = "",
  initialWhatsappNumber = "",
  initialEmailAddress = "",
  onContinue,
}: EmployerRegisterCompanyProfileFormProps) {
  const isConsultancy = accountType === "consultancy";
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<EmployerRegisterCompanyProfileData>({
    ...EMPLOYER_REGISTER_INITIAL_COMPANY_PROFILE_DATA,
    companyName: initialCompanyName,
    whatsappNumber: initialWhatsappNumber,
    emailAddress: initialEmailAddress,
  });
  const [documentPreview, setDocumentPreview] =
    useState<EmployerRegisterDocumentPreview | null>(null);
  const [companyLogoPreview, setCompanyLogoPreview] =
    useState<EmployerRegisterImagePreview | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const businessCategoryOptions = getEmployerRegisterBusinessCategoryOptions(
    formData.industry,
  );

  const profileHeading = isConsultancy
    ? EMPLOYER_REGISTER_CONSULTANCY_PROFILE_HEADING
    : EMPLOYER_REGISTER_COMPANY_PROFILE_HEADING;
  const nameLabel = isConsultancy
    ? "Consultancy Name*"
    : "Company / Business Name*";
  const namePlaceholder = isConsultancy
    ? "Enter Consultancy Name"
    : "Enter Company / Business Name";
  const submitErrorFallback = isConsultancy
    ? "Failed to complete consultancy profile"
    : "Failed to complete company profile";

  const updateField = <K extends keyof EmployerRegisterCompanyProfileData>(
    field: K,
    value: EmployerRegisterCompanyProfileData[K],
  ) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleIndustryChange = (industry: string) => {
    setFormData((current) => ({
      ...current,
      industry,
      businessCategory: "",
    }));
  };

  const handlePincodeChange = (pincode: string) => {
    const location = EMPLOYER_REGISTER_PINCODE_LOCATION_MAP[pincode];

    setFormData((current) => ({
      ...current,
      pincode,
      city: location?.city ?? current.city,
      state: location?.state ?? current.state,
    }));
  };

  const applySelectedFile = (file: File | undefined) => {
    if (!file || !isAcceptedFile(file)) {
      return;
    }

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isConsultancy && !formData.companyStrength) {
      setErrorMessage("Select company strength");
      return;
    }

    if (!formData.companyName.trim()) {
      setErrorMessage(
        isConsultancy
          ? "Consultancy Name is required"
          : "Company / Business Name is required",
      );
      return;
    }

    if (!formData.whatsappNumber.trim()) {
      setErrorMessage("WhatsApp Number is required");
      return;
    }

    if (!formData.companyAddress.trim()) {
      setErrorMessage("Company Address is required");
      return;
    }

    if (!formData.pincode.trim() || !formData.city.trim() || !formData.state.trim()) {
      setErrorMessage("Pincode, City and State are required");
      return;
    }

    if (!formData.verificationDocument) {
      setErrorMessage("Select a business verification document");
      return;
    }

    if (!documentPreview?.file) {
      setErrorMessage("Upload the selected verification document");
      return;
    }

    if (isConsultancy && !companyLogoPreview?.file) {
      setErrorMessage("Upload Company Logo");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await completeEmployerCompanyProfile({
        employerId,
        profile: formData,
        documentType: formData.verificationDocument,
        documentFile: documentPreview.file,
        companyLogoFile: companyLogoPreview?.file,
      });
      onContinue?.();
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.message
        : null;
      setErrorMessage(
        typeof message === "string" && message.trim()
          ? message
          : submitErrorFallback,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <h1 className="employer-register-form-heading">{profileHeading}</h1>

      <form
        className="employer-register-form-fields mt-8 w-full"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="employer-register-form-stack">
          <label
            htmlFor="company-profile-name"
            className="employer-register-form-label"
          >
            {nameLabel}
          </label>
          <input
            id="company-profile-name"
            type="text"
            value={formData.companyName}
            onChange={(event) => updateField("companyName", event.target.value)}
            placeholder={namePlaceholder}
            autoComplete="organization"
            className="employer-register-form-input"
          />
        </div>

        {isConsultancy ? (
          <>
            <div className="employer-register-form-row">
              <div className="employer-register-form-stack">
                <label
                  htmlFor="company-profile-whatsapp"
                  className="employer-register-form-label"
                >
                  WhatsApp Number*
                </label>
                <input
                  id="company-profile-whatsapp"
                  type="tel"
                  inputMode="numeric"
                  value={formData.whatsappNumber}
                  onChange={(event) =>
                    updateField(
                      "whatsappNumber",
                      event.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  placeholder="Enter Company WhatsApp Number"
                  autoComplete="tel"
                  className="employer-register-form-input"
                />
              </div>

              <div className="employer-register-form-stack">
                <label
                  htmlFor="company-profile-email"
                  className="employer-register-form-label"
                >
                  Email Address
                </label>
                <input
                  id="company-profile-email"
                  type="email"
                  value={formData.emailAddress}
                  onChange={(event) =>
                    updateField("emailAddress", event.target.value)
                  }
                  placeholder="Enter Company Email Address"
                  autoComplete="email"
                  className="employer-register-form-input"
                />
              </div>
            </div>

            <div className="employer-register-form-stack">
              <label
                htmlFor="company-profile-address"
                className="employer-register-form-label"
              >
                Company Address*
              </label>
              <textarea
                id="company-profile-address"
                value={formData.companyAddress}
                onChange={(event) =>
                  updateField("companyAddress", event.target.value)
                }
                placeholder="#6-250, Kavuri Hills, Madhapur, Hyderabad, Telangana"
                rows={3}
                className="employer-register-form-textarea"
              />
            </div>

            <div className="employer-register-form-row employer-register-form-row--three">
              <div className="employer-register-form-stack">
                <label
                  htmlFor="company-profile-state"
                  className="employer-register-form-label"
                >
                  State*
                </label>
                <EmployerRegisterPlaceAutocomplete
                  id="company-profile-state"
                  mode="state"
                  value={formData.state}
                  placeholder="Select State"
                  onChange={(value) => {
                    setFormData((current) => ({
                      ...current,
                      state: value,
                      city: "",
                    }));
                  }}
                  onSelect={(suggestion) => {
                    setFormData((current) => ({
                      ...current,
                      state: suggestion.state,
                      city: "",
                    }));
                  }}
                />
              </div>

              <div className="employer-register-form-stack">
                <label
                  htmlFor="company-profile-city"
                  className="employer-register-form-label"
                >
                  City*
                </label>
                <EmployerRegisterPlaceAutocomplete
                  id="company-profile-city"
                  mode="city"
                  value={formData.city}
                  selectedState={formData.state}
                  disabled={!formData.state.trim()}
                  placeholder={
                    formData.state.trim() ? "Select City" : "Select a state first"
                  }
                  onChange={(value) => updateField("city", value)}
                  onSelect={(suggestion) => {
                    updateField("city", suggestion.city);
                  }}
                />
              </div>

              <EmployerRegisterSearchableSelect
                id="company-profile-pincode"
                label="Pincode"
                required
                allowCustom
                initialVisibleCount={5}
                value={formData.pincode}
                placeholder="Select Pincode"
                options={EMPLOYER_REGISTER_PINCODE_OPTIONS}
                onChange={handlePincodeChange}
              />
            </div>
          </>
        ) : (
          <>
            <div className="employer-register-form-row employer-register-form-row--three">
              <EmployerRegisterSearchableSelect
                id="company-profile-industry"
                label="Industry"
                required
                value={formData.industry}
                placeholder="Select Industry"
                options={EMPLOYER_REGISTER_INDUSTRY_OPTIONS}
                onChange={handleIndustryChange}
              />
              <EmployerRegisterSearchableSelect
                id="company-profile-business-category"
                label="Business Category"
                required
                disabled={!formData.industry}
                value={formData.businessCategory}
                placeholder="Select Business Category"
                options={businessCategoryOptions}
                onChange={(value) => updateField("businessCategory", value)}
              />
              <EmployerRegisterSearchableSelect
                id="company-profile-strength"
                label="Company Strength"
                required
                value={formData.companyStrength}
                placeholder="Select Strength"
                options={EMPLOYER_REGISTER_COMPANY_STRENGTH_OPTIONS}
                onChange={(value) => updateField("companyStrength", value)}
              />
            </div>

            <div className="employer-register-form-stack">
              <label
                htmlFor="company-profile-address"
                className="employer-register-form-label"
              >
                Company Address*
              </label>
              <textarea
                id="company-profile-address"
                value={formData.companyAddress}
                onChange={(event) =>
                  updateField("companyAddress", event.target.value)
                }
                placeholder="#6-250, Kavuri Hills, Madhapur, Hyderabad, Telangana"
                rows={3}
                className="employer-register-form-textarea"
              />
            </div>

            <div className="employer-register-form-row employer-register-form-row--three">
              <div className="employer-register-form-stack">
                <label
                  htmlFor="company-profile-state"
                  className="employer-register-form-label"
                >
                  State*
                </label>
                <EmployerRegisterPlaceAutocomplete
                  id="company-profile-state"
                  mode="state"
                  value={formData.state}
                  placeholder="Search State"
                  onChange={(value) => {
                    setFormData((current) => ({
                      ...current,
                      state: value,
                      city: "",
                    }));
                  }}
                  onSelect={(suggestion) => {
                    setFormData((current) => ({
                      ...current,
                      state: suggestion.state,
                      city: "",
                    }));
                  }}
                />
              </div>

              <div className="employer-register-form-stack">
                <label
                  htmlFor="company-profile-city"
                  className="employer-register-form-label"
                >
                  City*
                </label>
                <EmployerRegisterPlaceAutocomplete
                  id="company-profile-city"
                  mode="city"
                  value={formData.city}
                  selectedState={formData.state}
                  disabled={!formData.state.trim()}
                  placeholder={
                    formData.state.trim() ? "Search City" : "Select a state first"
                  }
                  onChange={(value) => updateField("city", value)}
                  onSelect={(suggestion) => {
                    updateField("city", suggestion.city);
                  }}
                />
              </div>

              <EmployerRegisterSearchableSelect
                id="company-profile-pincode"
                label="Pincode"
                required
                allowCustom
                initialVisibleCount={5}
                value={formData.pincode}
                placeholder="Select Pincode"
                options={EMPLOYER_REGISTER_PINCODE_OPTIONS}
                onChange={handlePincodeChange}
              />
            </div>

            <div className="employer-register-form-row">
              <div className="employer-register-form-stack">
                <label
                  htmlFor="company-profile-whatsapp"
                  className="employer-register-form-label"
                >
                  WhatsApp Number*
                </label>
                <input
                  id="company-profile-whatsapp"
                  type="tel"
                  inputMode="numeric"
                  value={formData.whatsappNumber}
                  onChange={(event) =>
                    updateField(
                      "whatsappNumber",
                      event.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  placeholder="Enter Company WhatsApp Number"
                  autoComplete="tel"
                  className="employer-register-form-input"
                />
              </div>

              <div className="employer-register-form-stack">
                <label
                  htmlFor="company-profile-email"
                  className="employer-register-form-label"
                >
                  Email Address
                </label>
                <input
                  id="company-profile-email"
                  type="email"
                  value={formData.emailAddress}
                  onChange={(event) =>
                    updateField("emailAddress", event.target.value)
                  }
                  placeholder="Enter Company Email Address"
                  autoComplete="email"
                  className="employer-register-form-input"
                />
              </div>
            </div>
          </>
        )}

        <section className="employer-register-business-verification">
          <div className="employer-register-business-verification-heading">
            <ShieldCheck
              className="employer-register-business-verification-icon"
              strokeWidth={2}
              aria-hidden="true"
            />
            <h2 className="employer-register-form-label">
              {EMPLOYER_REGISTER_BUSINESS_VERIFICATION_TITLE}
            </h2>
          </div>

            <EmployerRegisterSearchableSelect
              id="company-profile-verification-document"
              label="Select Document"
              hideLabel
              value={formData.verificationDocument}
              placeholder="Select Document"
              options={EMPLOYER_REGISTER_BUSINESS_DOCUMENT_OPTIONS}
              onChange={(value) => {
                updateField(
                  "verificationDocument",
                  value as EmployerRegisterBusinessDocumentType,
                );
                setDocumentPreview(null);
              }}
            />

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
                    aria-label="Remove selected document"
                    onClick={() => setDocumentPreview(null)}
                  >
                    <X className="size-4" strokeWidth={2.25} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div
                  className="employer-register-document-dropzone"
                  role="button"
                  tabIndex={0}
                  aria-label={`${EMPLOYER_REGISTER_DOCUMENT_UPLOAD_PRIMARY}. ${EMPLOYER_REGISTER_DOCUMENT_UPLOAD_HINT}`}
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
                  <p className="employer-register-document-dropzone-primary">
                    {EMPLOYER_REGISTER_DOCUMENT_UPLOAD_PRIMARY}
                  </p>
                  <p className="employer-register-document-dropzone-hint">
                    {EMPLOYER_REGISTER_DOCUMENT_UPLOAD_HINT}
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                id={fileInputId}
                type="file"
                accept={EMPLOYER_REGISTER_DOCUMENT_ACCEPT}
                className="sr-only"
                tabIndex={-1}
                onChange={handleFileInputChange}
              />
            </>
          ) : null}

          <EmployerImageUploadField
            label="Upload Company Logo"
            preview={companyLogoPreview}
            onPreviewChange={setCompanyLogoPreview}
          />
        </section>

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
          {EMPLOYER_REGISTER_CONTINUE_LABEL}
        </button>
      </form>
    </div>
  );
}
