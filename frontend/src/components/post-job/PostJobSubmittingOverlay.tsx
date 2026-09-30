"use client";

import asliLogoMark from "@/assets/logos/Frame 130.png";
import { useTranslate } from "@/i18n/translate";
import Image from "next/image";

type PostJobSubmittingOverlayProps = {
  isEditMode?: boolean;
};

export function PostJobSubmittingOverlay({
  isEditMode = false,
}: PostJobSubmittingOverlayProps) {
  const t = useTranslate();

  return (
    <div
      className="post-job-submitting-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={
        isEditMode
          ? t("employer.postJob.updatingJobAria")
          : t("employer.postJob.postingJobAria")
      }
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
      <p className="mt-5 px-4 text-center text-sm font-semibold text-foreground sm:text-base">
        {isEditMode
          ? t("employer.postJob.updatingJob")
          : t("employer.postJob.postingJob")}
      </p>
      <p className="mt-1 px-4 text-center text-xs text-muted sm:text-sm">
        {t("employer.postJob.pleaseWait")}
      </p>
    </div>
  );
}
