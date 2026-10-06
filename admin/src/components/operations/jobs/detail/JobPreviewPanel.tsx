import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import type { OperationsJobPreviewLanguageCode } from "../../../../constants/operations-job-preview-languages";
import { useOperationsJobContentTranslation } from "../../../../hooks/use-operations-job-detail";
import type { OperationsJobDetail } from "../../../../types/operations-jobs";
import { JobListingPreviewArticle } from "./JobListingPreviewArticle";
import { JobPreviewLanguageSelect } from "./JobPreviewLanguageSelect";

interface JobPreviewPanelProps {
  job: OperationsJobDetail;
}

function resolveSourceLanguage(
  job: OperationsJobDetail,
): OperationsJobPreviewLanguageCode {
  const code = job.contentLanguage;
  if (
    code === "en" ||
    code === "hi" ||
    code === "te" ||
    code === "ta" ||
    code === "kn" ||
    code === "ml"
  ) {
    return code;
  }
  return "en";
}

export function JobPreviewPanel({ job }: JobPreviewPanelProps) {
  const sourceLanguage = resolveSourceLanguage(job);
  const [language, setLanguage] =
    useState<OperationsJobPreviewLanguageCode>(sourceLanguage);

  useEffect(() => {
    setLanguage(sourceLanguage);
  }, [job.jobId, sourceLanguage]);

  const translationQuery = useOperationsJobContentTranslation(
    job.jobId,
    language,
    sourceLanguage,
    true,
  );

  const previewJob = useMemo(() => {
    if (language === sourceLanguage) {
      return job;
    }
    const translated = translationQuery.data?.content;
    if (
      !translated ||
      translationQuery.data?.language !== language ||
      translationQuery.data.translationStatus !== "ready" ||
      !translationQuery.data.isTranslated
    ) {
      return job;
    }
    return {
      ...job,
      jobTitle: translated.jobTitle || job.jobTitle,
      description: translated.description || job.description,
      interviewInstructions:
        translated.interviewInstructions || job.interviewInstructions,
    };
  }, [job, language, sourceLanguage, translationQuery.data]);

  const translationFailed =
    language !== sourceLanguage &&
    (translationQuery.isError ||
      translationQuery.data?.translationStatus === "failed");

  const translationPending =
    language !== sourceLanguage &&
    !translationFailed &&
    (translationQuery.isPending ||
      translationQuery.data?.translationStatus === "pending" ||
      translationQuery.data?.translationStatus === "fallback");

  const translationErrorMessage = useMemo(() => {
    if (!translationQuery.error) {
      return "Translation could not be completed. Showing the original job content.";
    }
    if (isAxiosError(translationQuery.error)) {
      const message = translationQuery.error.response?.data?.message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
    return "Translation could not be completed. Showing the original job content.";
  }, [translationQuery.error]);

  const statusLabel =
    language === sourceLanguage
      ? "Original content"
      : translationQuery.data?.isTranslated &&
          translationQuery.data.translationStatus === "ready"
        ? "Saved translation"
        : translationPending
          ? "Original content · translation is being prepared"
          : null;

  return (
    <div className="job-preview-canvas -m-2.5 flex min-h-[32rem] flex-col bg-surface px-3 py-6 sm:-m-3.5 sm:px-8 sm:py-10">
      <div className="mx-auto mb-4 flex w-full max-w-[40rem] flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.04em] text-muted uppercase">
            Preview language
          </p>
          {statusLabel ? (
            <p className="mt-0.5 text-xs text-muted" role="status">
              {statusLabel}
            </p>
          ) : null}
        </div>
        <JobPreviewLanguageSelect value={language} onChange={setLanguage} />
      </div>

      <div className="flex flex-1 justify-center">
        <div className="flex w-full max-w-[40rem] flex-col gap-4">
          {translationFailed ? (
            <div
              className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-xs text-danger"
              role="alert"
            >
              {translationErrorMessage}
            </div>
          ) : null}
          {translationPending ? (
            <p className="text-xs text-muted" role="status" aria-live="polite">
              Translation is being prepared. Showing the original job content.
            </p>
          ) : null}
          <JobListingPreviewArticle
            job={previewJob}
            language={language}
            className="w-full max-w-[40rem]"
          />
        </div>
      </div>
    </div>
  );
}
