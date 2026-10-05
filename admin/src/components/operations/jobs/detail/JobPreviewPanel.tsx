import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import type { OperationsJobPreviewLanguageCode } from "../../../../constants/operations-job-preview-languages";
import { operationsJobPreviewLanguageLabel } from "../../../../constants/operations-job-preview-languages";
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
      translationQuery.data.translationStatus !== "completed"
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

  const hasMatchingTranslation =
    translationQuery.data?.language === language &&
    translationQuery.data.translationStatus === "completed";

  const isTranslating =
    language !== sourceLanguage &&
    (translationQuery.isPending || translationQuery.isFetching) &&
    !hasMatchingTranslation;

  const translationFailed =
    language !== sourceLanguage &&
    !isTranslating &&
    (translationQuery.isError ||
      translationQuery.data?.translationStatus === "failed");

  const translationErrorMessage = useMemo(() => {
    if (!translationQuery.error) {
      return "Translation could not be completed. Please try again later.";
    }
    if (isAxiosError(translationQuery.error)) {
      const message = translationQuery.error.response?.data?.message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
    return "Translation could not be completed. Please try again later.";
  }, [translationQuery.error]);

  const statusLabel =
    language === sourceLanguage
      ? "Original content"
      : translationQuery.data?.isTranslated
        ? "Saved translation"
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
        <JobPreviewLanguageSelect
          value={language}
          onChange={setLanguage}
          disabled={isTranslating}
        />
      </div>

      <div className="flex flex-1 justify-center">
        {isTranslating ? (
          <div
            className="flex w-full max-w-[40rem] flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-hero-bg/40 px-6 py-16 text-center"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm font-semibold text-foreground">
              {operationsJobPreviewLanguageLabel(language)}
            </p>
            <p className="mt-2 text-xs text-muted">Translating job content…</p>
          </div>
        ) : translationFailed ? (
          <div className="flex w-full max-w-[40rem] flex-col gap-4">
            <div
              className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-xs text-danger"
              role="alert"
            >
              {translationErrorMessage}
            </div>
            <JobListingPreviewArticle
              job={job}
              language={language}
              className="w-full max-w-[40rem]"
            />
          </div>
        ) : (
          <JobListingPreviewArticle
            job={previewJob}
            language={language}
            className="w-full max-w-[40rem]"
          />
        )}
      </div>
    </div>
  );
}
