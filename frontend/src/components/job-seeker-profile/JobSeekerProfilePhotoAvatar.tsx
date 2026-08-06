"use client";

import type { JobSeekerPublic } from "@/types/job-seeker";
import { getInitials } from "@/utils/job-seeker-profile";
import { resolveMediaUrl } from "@/utils/resolve-media-url";
import { Camera, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useId, useRef } from "react";

const ACCEPTED_PHOTO_TYPES = "image/jpeg,image/png,image/webp";

type JobSeekerProfilePhotoAvatarProps = {
  jobSeeker: JobSeekerPublic;
  size?: "header" | "sidebar";
  isUploading?: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
};

export function JobSeekerProfilePhotoAvatar({
  jobSeeker,
  size = "header",
  isUploading = false,
  onUpload,
  onRemove,
}: JobSeekerProfilePhotoAvatarProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const fullName = jobSeeker.fullName?.trim() || "Job Seeker";
  const photoUrl = jobSeeker.profilePhoto?.url
    ? resolveMediaUrl(jobSeeker.profilePhoto.url)
    : "";

  const dimension = size === "header" ? 96 : 80;
  const sizeClass = size === "header" ? "size-24" : "size-20";

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    await onUpload(file);
  };

  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={`relative overflow-hidden rounded-full border-2 border-primary/20 bg-primary-soft ${sizeClass}`}
      >
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt=""
            width={dimension}
            height={dimension}
            className="size-full object-cover"
            unoptimized
          />
        ) : (
          <span
            className="flex size-full items-center justify-center text-2xl font-bold text-surface"
            aria-hidden="true"
          >
            {getInitials(fullName)}
          </span>
        )}
        {isUploading ? (
          <span className="absolute inset-0 flex items-center justify-center bg-foreground/40">
            <Loader2
              className="size-8 animate-spin text-surface"
              aria-hidden="true"
            />
            <span className="sr-only">Uploading photo</span>
          </span>
        ) : null}
      </div>

      <label
        htmlFor={inputId}
        className="absolute -bottom-1 -right-1 inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-border-subtle bg-surface text-primary shadow-sm hover:bg-primary-light focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/30"
      >
        <Camera className="size-4" aria-hidden="true" />
        <span className="sr-only">Upload profile photo</span>
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_PHOTO_TYPES}
        className="sr-only"
        disabled={isUploading}
        onChange={(event) => void handleFileChange(event)}
      />

      {photoUrl && onRemove && !isUploading ? (
        <button
          type="button"
          className="absolute -left-1 -top-1 inline-flex size-8 items-center justify-center rounded-full border border-border-subtle bg-surface text-red-600 shadow-sm hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
          aria-label="Remove profile photo"
          onClick={() => void onRemove()}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
