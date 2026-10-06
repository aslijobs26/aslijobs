"use client";

import { useTranslate } from "@/i18n/translate";

type JobTranslationPendingNoteProps = {
  translationStatus?: "ready" | "pending" | "fallback" | "failed" | "completed" | "none";
};

export function JobTranslationPendingNote({
  translationStatus,
}: JobTranslationPendingNoteProps) {
  const t = useTranslate();
  if (translationStatus !== "pending") {
    return null;
  }

  return (
    <p className="mt-2 text-xs text-muted" role="status">
      {t("jobs.translationPending")}
    </p>
  );
}
