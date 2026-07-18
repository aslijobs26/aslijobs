"use client";

import {
  EMPLOYER_REGISTER_DOCUMENT_ACCEPT,
  EMPLOYER_REGISTER_DOCUMENT_HELPER_TEXT,
  EMPLOYER_REGISTER_DOCUMENT_MAX_SIZE_BYTES,
  EMPLOYER_REGISTER_DOCUMENT_TYPE_OPTIONS,
  EMPLOYER_REGISTER_DOCUMENT_UPLOAD_HINT,
  EMPLOYER_REGISTER_DOCUMENT_UPLOAD_PRIMARY,
  EMPLOYER_REGISTER_DOCUMENT_VERIFICATION_SUBTITLE,
  EMPLOYER_REGISTER_DOCUMENT_VERIFICATION_TITLE,
} from "@/constants/employer-register";
import type {
  EmployerRegisterDocumentPreview,
  EmployerRegisterDocumentType,
} from "@/types/employer-register";
import { cn } from "@/utils/cn";
import { CloudUpload, FileText, X } from "lucide-react";
import {
  useId,
  useRef,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";

type EmployerRegisterDocumentVerificationProps = {
  documentType: EmployerRegisterDocumentType | null;
  documentPreview: EmployerRegisterDocumentPreview | null;
  onDocumentTypeChange: (value: EmployerRegisterDocumentType) => void;
  onDocumentPreviewChange: (
    preview: EmployerRegisterDocumentPreview | null,
  ) => void;
};

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

function DocumentTypeRadioIndicator({ checked }: { checked: boolean }) {
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

export function EmployerRegisterDocumentVerification({
  documentType,
  documentPreview,
  onDocumentTypeChange,
  onDocumentPreviewChange,
}: EmployerRegisterDocumentVerificationProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applySelectedFile = (file: File | undefined) => {
    if (!file || !isAcceptedFile(file)) {
      return;
    }

    onDocumentPreviewChange({
      name: file.name,
      sizeBytes: file.size,
      file,
    });
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    applySelectedFile(file);
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

  return (
    <section
      className="employer-register-document-verification"
      aria-labelledby="employer-register-document-verification-title"
    >
      <div className="employer-register-form-stack">
        <h2
          id="employer-register-document-verification-title"
          className="employer-register-form-label"
        >
          {EMPLOYER_REGISTER_DOCUMENT_VERIFICATION_TITLE}
        </h2>
        <p className="employer-register-document-subtitle">
          {EMPLOYER_REGISTER_DOCUMENT_VERIFICATION_SUBTITLE}
        </p>
      </div>

      <div
        className="employer-register-document-type-options"
        role="radiogroup"
        aria-label="Government ID type"
      >
        {EMPLOYER_REGISTER_DOCUMENT_TYPE_OPTIONS.map((option) => {
          const checked = documentType === option.value;

          return (
            <label
              key={option.value}
              className={cn(
                "employer-register-document-type-option",
                checked && "employer-register-document-type-option--checked",
              )}
            >
              <input
                type="radio"
                name="employer-document-type"
                value={option.value}
                checked={checked}
                onChange={() => {
                  onDocumentTypeChange(option.value);
                  onDocumentPreviewChange(null);
                }}
                className="sr-only"
              />
              <DocumentTypeRadioIndicator checked={checked} />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>

      {documentType ? (
        <div className="employer-register-form-stack">
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
                onClick={() => onDocumentPreviewChange(null)}
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
                  aria-hidden="true"
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
            id={inputId}
            type="file"
            accept={EMPLOYER_REGISTER_DOCUMENT_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            onChange={handleFileInputChange}
          />

          <p className="employer-register-document-helper">
            {EMPLOYER_REGISTER_DOCUMENT_HELPER_TEXT}
          </p>
        </div>
      ) : null}
    </section>
  );
}
