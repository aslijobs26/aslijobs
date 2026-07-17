"use client";

import {
  EMPLOYER_REGISTER_BUSINESS_DOCUMENT_OPTIONS,
  EMPLOYER_REGISTER_BUSINESS_VERIFICATION_TITLE,
  EMPLOYER_REGISTER_CITY_OPTIONS,
  EMPLOYER_REGISTER_COMPANY_PROFILE_HEADING,
  EMPLOYER_REGISTER_CONTINUE_LABEL,
  EMPLOYER_REGISTER_DOCUMENT_ACCEPT,
  EMPLOYER_REGISTER_DOCUMENT_MAX_SIZE_BYTES,
  EMPLOYER_REGISTER_DOCUMENT_UPLOAD_HINT,
  EMPLOYER_REGISTER_DOCUMENT_UPLOAD_PRIMARY,
  EMPLOYER_REGISTER_INDUSTRY_OPTIONS,
  EMPLOYER_REGISTER_INITIAL_COMPANY_PROFILE_DATA,
  EMPLOYER_REGISTER_PINCODE_LOCATION_MAP,
  EMPLOYER_REGISTER_PINCODE_OPTIONS,
  EMPLOYER_REGISTER_STATE_OPTIONS,
  getEmployerRegisterBusinessCategoryOptions,
} from "@/constants/employer-register";
import type {
  EmployerRegisterBusinessDocumentType,
  EmployerRegisterCompanyProfileData,
  EmployerRegisterDocumentPreview,
} from "@/types/employer-register";
import { CloudUpload, FileText, ShieldCheck, X } from "lucide-react";
import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
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
  const allowedExtensions = new Set(["pdf", "jpg", "jpeg", "png"]);

  return (
    allowedExtensions.has(extension ?? "") &&
    file.size <= EMPLOYER_REGISTER_DOCUMENT_MAX_SIZE_BYTES
  );
}

type EmployerRegisterCompanyProfileFormProps = {
  initialCompanyName?: string;
};

export function EmployerRegisterCompanyProfileForm({
  initialCompanyName = "",
}: EmployerRegisterCompanyProfileFormProps) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<EmployerRegisterCompanyProfileData>({
    ...EMPLOYER_REGISTER_INITIAL_COMPANY_PROFILE_DATA,
    companyName: initialCompanyName,
  });
  const [documentPreview, setDocumentPreview] =
    useState<EmployerRegisterDocumentPreview | null>(null);

  const businessCategoryOptions = getEmployerRegisterBusinessCategoryOptions(
    formData.industry,
  );

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="w-full">
      <h1 className="employer-register-form-heading">
        {EMPLOYER_REGISTER_COMPANY_PROFILE_HEADING}
      </h1>

      <form
        className="employer-register-form-fields mt-8 w-full"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="employer-register-form-stack">
          <label htmlFor="company-profile-name" className="employer-register-form-label">
            Company / Business Name*
          </label>
          <input
            id="company-profile-name"
            type="text"
            value={formData.companyName}
            onChange={(event) => updateField("companyName", event.target.value)}
            placeholder="Enter Company / Business Name"
            autoComplete="organization"
            className="employer-register-form-input"
          />
        </div>

        <div className="employer-register-form-row">
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
            placeholder="Enter Company Address"
            rows={3}
            className="employer-register-form-textarea"
          />
        </div>

        <div className="employer-register-form-row employer-register-form-row--three">
          <EmployerRegisterSearchableSelect
            id="company-profile-pincode"
            label="Pincode"
            required
            value={formData.pincode}
            placeholder="Select Pincode"
            options={EMPLOYER_REGISTER_PINCODE_OPTIONS}
            onChange={handlePincodeChange}
          />
          <EmployerRegisterSearchableSelect
            id="company-profile-city"
            label="City"
            required
            disabled
            value={formData.city}
            placeholder="Select City"
            options={EMPLOYER_REGISTER_CITY_OPTIONS}
            onChange={(value) => updateField("city", value)}
          />
          <EmployerRegisterSearchableSelect
            id="company-profile-state"
            label="State"
            required
            disabled
            value={formData.state}
            placeholder="Select State"
            options={EMPLOYER_REGISTER_STATE_OPTIONS}
            onChange={(value) => updateField("state", value)}
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
              placeholder="Enter WhatsApp Number"
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
              placeholder="Enter Email Address"
              autoComplete="email"
              className="employer-register-form-input"
            />
          </div>
        </div>

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
        </section>

        <button type="submit" className="employer-register-form-submit">
          {EMPLOYER_REGISTER_CONTINUE_LABEL}
        </button>
      </form>
    </div>
  );
}
