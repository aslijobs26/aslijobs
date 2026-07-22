"use client";

import asliLogoMark from "@/assets/logos/Frame 130.png";
import Image from "next/image";

type PostJobSubmittingOverlayProps = {
  isEditMode?: boolean;
};

export function PostJobSubmittingOverlay({
  isEditMode = false,
}: PostJobSubmittingOverlayProps) {
  return (
    <div
      className="post-job-submitting-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={isEditMode ? "Updating job" : "Posting job"}
    >
      <div className="post-job-submitting-loader">
        <span className="post-job-submitting-ring" aria-hidden="true" />
        <span className="post-job-submitting-logo">
          <Image
            src={asliLogoMark}
            alt=""
            width={72}
            height={72}
            className="size-full object-contain"
            priority
          />
        </span>
      </div>
      <p className="mt-5 text-sm font-semibold text-foreground sm:text-base">
        {isEditMode ? "Updating your job…" : "Posting your job…"}
      </p>
      <p className="mt-1 text-xs text-muted sm:text-sm">
        Please wait a moment
      </p>
    </div>
  );
}
