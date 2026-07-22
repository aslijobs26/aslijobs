"use client";

import {
  EMPLOYER_REGISTER_DOCUMENT_MAX_SIZE_BYTES,
  EMPLOYER_REGISTER_IMAGE_ACCEPT,
  EMPLOYER_REGISTER_IMAGE_UPLOAD_HINT,
} from "@/constants/employer-register";
import type { EmployerRegisterImagePreview } from "@/types/employer-register";
import { Images, X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";

type EmployerImageUploadFieldProps = {
  label: string;
  optional?: boolean;
  preview: EmployerRegisterImagePreview | null;
  existingImageUrl?: string | null;
  onPreviewChange: (preview: EmployerRegisterImagePreview | null) => void;
  onRemoveExisting?: () => void;
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

function isAcceptedImageFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const allowedExtensions = new Set(["png", "jpg", "jpeg", "webp"]);

  return (
    allowedExtensions.has(extension ?? "") &&
    file.type.startsWith("image/") &&
    file.size <= EMPLOYER_REGISTER_DOCUMENT_MAX_SIZE_BYTES
  );
}

export function EmployerImageUploadField({
  label,
  optional = false,
  preview,
  existingImageUrl = null,
  onPreviewChange,
  onRemoveExisting,
}: EmployerImageUploadFieldProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrl = preview?.previewUrl ?? null;
  const displayUrl = objectUrl || existingImageUrl || null;
  const fieldLabel = optional ? `${label} (Optional)` : label;

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  const applySelectedFile = (file: File | undefined) => {
    if (!file || !isAcceptedImageFile(file)) {
      return;
    }

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }

    onPreviewChange({
      name: file.name,
      sizeBytes: file.size,
      file,
      previewUrl: URL.createObjectURL(file),
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

  const handleRemove = () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    onPreviewChange(null);
    onRemoveExisting?.();
  };

  return (
    <div className="employer-register-form-stack">
      <p className="employer-register-form-label employer-register-form-label--with-icon">
        <Images
          className="employer-register-form-label-icon"
          strokeWidth={2}
          aria-hidden="true"
        />
        {fieldLabel}
      </p>

      {displayUrl ? (
        <div className="employer-register-document-preview">
          <span
            className="employer-register-image-preview-thumb"
            aria-hidden="true"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={displayUrl} alt="" className="size-full object-cover" />
          </span>
          <div className="employer-register-document-preview-copy">
            <p className="employer-register-document-preview-name">
              {preview?.name ?? "Current image"}
            </p>
            {preview ? (
              <p className="employer-register-document-preview-size">
                {formatFileSize(preview.sizeBytes)}
              </p>
            ) : (
              <p className="employer-register-document-preview-size">
                Saved on your profile
              </p>
            )}
          </div>
          <button
            type="button"
            className="employer-register-document-preview-remove"
            aria-label={`Remove ${fieldLabel.toLowerCase()}`}
            onClick={handleRemove}
          >
            <X className="size-4" strokeWidth={2.25} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div
          className="employer-register-document-dropzone"
          role="button"
          tabIndex={0}
          aria-label={`${fieldLabel}. ${EMPLOYER_REGISTER_IMAGE_UPLOAD_HINT}`}
          onClick={openFileBrowser}
          onKeyDown={handleUploadKeyDown}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <span
            className="employer-register-document-dropzone-icon"
            aria-hidden="true"
          >
            <Images
              className="employer-register-document-dropzone-icon-svg"
              strokeWidth={1.75}
            />
          </span>
          <p className="employer-register-document-dropzone-primary">
            {label}
          </p>
          <p className="employer-register-document-dropzone-hint">
            {EMPLOYER_REGISTER_IMAGE_UPLOAD_HINT}
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept={EMPLOYER_REGISTER_IMAGE_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={handleFileInputChange}
      />
    </div>
  );
}
