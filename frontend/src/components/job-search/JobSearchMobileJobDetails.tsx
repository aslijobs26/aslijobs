"use client";

import { JobSearchOverviewSkeleton } from "@/components/job-search/JobSearchSkeletons";
import { JobApplyButton } from "@/components/jobs/JobApplyButton";
import { JobRecruiterContactDetails } from "@/components/jobs/JobRecruiterContactDetails";
import { JobTranslationPendingNote } from "@/components/jobs/JobTranslationPendingNote";
import { JobDescriptionContent } from "@/components/ui/JobDescriptionContent";
import { useSiteLanguage } from "@/i18n/site-language";
import { useTranslate } from "@/i18n/translate";
import type { PublicJobDetail } from "@/services/public-jobs.service";
import { getJobDescriptionPlainTextLength } from "@/utils/job-description-html";
import {
  formatJobSearchEducation,
  formatJobSearchExperience,
  formatJobSearchGender,
  formatJobSearchJobType,
  formatJobSearchLanguage,
  formatJobSearchLocation,
  formatJobSearchPerk,
  formatJobSearchRelativeTime,
  formatJobSearchSalary,
  formatJobSearchWalkInDateRange,
  formatJobSearchWalkInTimeRange,
  formatJobSearchWorkMode,
} from "@/utils/job-search-format";
import { protectedApply } from "@/utils/job-apply-auth";
import { getPublicJobRecruiterDetails } from "@/utils/public-job-recruiter";
import {
  buildAbsolutePublicJobUrl,
  shareOrCopyText,
} from "@/utils/share-job";
import { cn } from "@/utils/cn";
import {
  ArrowLeft,
  Bookmark,
  ChevronDown,
  Clock3,
  Send,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { useState, type ReactNode } from "react";

type JobSearchMobileJobDetailsProps = {
  job: PublicJobDetail | undefined;
  isLoading: boolean;
  isError: boolean;
  bookmarked: boolean;
  onBack: () => void;
  onToggleBookmark: () => void;
  onRetry?: () => void;
};

function SummaryField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  if (!children) {
    return null;
  }

  return (
    <div className="min-w-0 py-2">
      <p className="text-[9px] leading-none font-medium tracking-[0.05em] text-[#9CA3AF] uppercase">
        {label}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function SummaryValue({ children }: { children: ReactNode }) {
  return (
    <p className="text-[12px] leading-snug font-semibold break-words text-[#111827]">
      {children}
    </p>
  );
}

function OutlinePills({ values }: { values: string[] }) {
  if (values.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-1">
      {values.map((value) => (
        <li key={value}>
          <span className="inline-flex h-[1.125rem] max-w-full items-center truncate rounded-full border border-[#D1D5DB] bg-white px-1.5 text-[10px] leading-none font-medium text-[#374151]">
            {value}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[15px] leading-tight font-bold text-[#111827]">
      {children}
    </h2>
  );
}

function ContentSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-5">
      <SectionHeading>{title}</SectionHeading>
      <div className="mt-3 border-t border-[#EEEEEE] pt-3">{children}</div>
    </section>
  );
}

export function JobSearchMobileJobDetails({
  job,
  isLoading,
  isError,
  bookmarked,
  onBack,
  onToggleBookmark,
  onRetry,
}: JobSearchMobileJobDetailsProps) {
  const t = useTranslate();
  const language = useSiteLanguage().code;
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedLocally, setAppliedLocally] = useState(false);
  const isApplied = appliedLocally || job?.isApplied === true;

  if (isLoading) {
    return (
      <div className="bg-white px-4 py-4">
        <JobSearchOverviewSkeleton />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="bg-white px-4 py-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("jobs.backToJobs")}
        </button>
        <h1 className="mt-3 text-base font-bold text-foreground">
          {t("jobs.jobUnavailable")}
        </h1>
        <p className="mt-2 text-xs text-muted">
          {t("jobs.unableToLoadClosed")}
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-[13px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {t("jobs.tryAgain")}
          </button>
        ) : null}
      </div>
    );
  }

  const location = formatJobSearchLocation(
    job.cityName,
    job.stateName,
    job.city,
    job.state,
    language,
  );
  const salary = formatJobSearchSalary(job, language);
  const posted = formatJobSearchRelativeTime(job.publishedAt ?? job.createdAt, language);
  const employmentType = formatJobSearchJobType(job.jobType, language);
  const experience = formatJobSearchExperience(job.experience, language);
  const education =
    job.education.length > 0
      ? job.education.map((value) => formatJobSearchEducation(value, language)).filter(Boolean).join(", ")
      : "";
  const workMode = formatJobSearchWorkMode(job.workMode, language);
  const genderLabel =
    job.gender.length > 0
      ? job.gender.map((value) => formatJobSearchGender(value, language)).filter(Boolean).join(", ")
      : "";
  const languageChips = job.languages
    .map((value) => formatJobSearchLanguage(value, language))
    .filter(Boolean);
  const perkChips = job.perks.map((value) => formatJobSearchPerk(value, language)).filter(Boolean);
  const openings = job.vacancies > 0 ? String(job.vacancies) : "";
  const walkInDate = formatJobSearchWalkInDateRange(
    job.walkInStartDate,
    job.walkInEndDate,
    language,
  );
  const walkInTime = formatJobSearchWalkInTimeRange(
    job.walkInStartTime,
    job.walkInEndTime,
    language,
  );

  const descriptionNeedsCollapse =
    getJobDescriptionPlainTextLength(job.description ?? "") > 380;
  const recruiter = getPublicJobRecruiterDetails(job);

  const handleShare = () => {
    void shareOrCopyText({
      title: job.jobTitle,
      text: `${job.jobTitle} at ${job.companyName}`,
      url: buildAbsolutePublicJobUrl(job.jobId),
      successMessage: t("jobs.linkCopied"),
    });
  };

  const handleApplyClick = () => {
    if (!job || isApplying || isApplied) {
      return;
    }
    setIsApplying(true);
    void protectedApply({
      applyWhatsAppNumber: job.applyWhatsAppNumber,
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      jobId: job.jobId,
    })
      .then((result) => {
        if (result.status === "success") {
          setAppliedLocally(true);
          return;
        }
        if (
          result.status === "error" &&
          /already applied/i.test(result.message)
        ) {
          setAppliedLocally(true);
        }
      })
      .finally(() => {
        setIsApplying(false);
      });
  };

  const summaryItems: { label: string; content: ReactNode }[] = [
    {
      label: t("jobs.salary"),
      content: salary ? <SummaryValue>{salary}</SummaryValue> : null,
    },
    {
      label: t("jobs.location"),
      content: location ? <SummaryValue>{location}</SummaryValue> : null,
    },
    {
      label: t("jobs.employmentType"),
      content: employmentType ? (
        <SummaryValue>{employmentType}</SummaryValue>
      ) : null,
    },
    {
      label: t("jobs.experience"),
      content: experience ? <SummaryValue>{experience}</SummaryValue> : null,
    },
    {
      label: t("jobs.qualification"),
      content: education ? <SummaryValue>{education}</SummaryValue> : null,
    },
    {
      label: t("jobs.openings"),
      content: openings ? <SummaryValue>{openings}</SummaryValue> : null,
    },
    {
      label: t("jobs.workMode"),
      content: workMode ? <SummaryValue>{workMode}</SummaryValue> : null,
    },
    {
      label: t("jobs.gender"),
      content: genderLabel ? <SummaryValue>{genderLabel}</SummaryValue> : null,
    },
    {
      label: t("jobs.languages"),
      content:
        languageChips.length > 0 ? (
          <OutlinePills values={languageChips} />
        ) : null,
    },
    {
      label: t("jobs.benefits"),
      content:
        perkChips.length > 0 ? <OutlinePills values={perkChips} /> : null,
    },
  ].filter((item) => Boolean(item.content));

  return (
    <div className="bg-white [-webkit-overflow-scrolling:touch]">
      <div className="sticky top-0 z-30 border-b border-[#EEF1F4] bg-white px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-9 items-center gap-1.5 text-[13px] font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <ArrowLeft className="size-3.5" strokeWidth={2.25} aria-hidden="true" />
            {t("jobs.backToJobs")}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              aria-label={t("jobs.shareJob")}
              className="inline-flex size-10 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white text-[#4B5563] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Share2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onToggleBookmark}
              aria-label={bookmarked ? t("jobs.removeBookmark") : t("jobs.saveJob")}
              aria-pressed={bookmarked}
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-[10px] border bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                bookmarked
                  ? "border-primary text-primary"
                  : "border-[#E5E7EB] text-[#4B5563]",
              )}
            >
              <Bookmark
                className="size-4"
                strokeWidth={1.75}
                fill={bookmarked ? "currentColor" : "none"}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-hidden px-4 pt-4 pb-4">
        <header>
          <div className="flex flex-wrap items-center gap-1.5">
            <h1 className="text-[20px] leading-[1.2] font-bold tracking-tight text-[#111827]">
              {job.jobTitle}
            </h1>
            <span
              className="inline-flex size-6 items-center justify-center rounded-full border border-primary/20 bg-[#EAF8F3] text-primary"
              title={t("jobs.verified")}
              aria-label={t("jobs.verified")}
            >
              <ShieldCheck
                className="size-3.5"
                strokeWidth={2.25}
                aria-hidden="true"
              />
            </span>
          </div>
          <p className="mt-1.5 text-[13px] leading-snug font-medium text-[#374151]">
            {job.companyName}
          </p>
          <JobTranslationPendingNote translationStatus={job.translationStatus} />
          {posted ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-[#9CA3AF]">
              <Clock3
                className="size-3 shrink-0"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              {t("jobs.postedPrefix", { time: posted })}
            </p>
          ) : null}
        </header>

        {summaryItems.length > 0 ? (
          <section
            className="mt-5 rounded-2xl border border-[#E8ECF0] bg-white px-4"
            aria-label={t("jobs.jobSummary")}
          >
            <div className="grid grid-cols-2 gap-x-4">
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  className="border-b border-[#EEF1F4] last:border-b-0 [&:nth-last-child(2):nth-child(odd)]:border-b-0"
                >
                  <SummaryField label={item.label}>{item.content}</SummaryField>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <ContentSection title={t("jobs.jobDescription")}>
          <p className="text-[13px] font-semibold text-[#1F2937]">
            {job.jobTitle}
          </p>

          {job.description?.trim() ? (
            <div className="relative mt-2">
              <div
                className={cn(
                  !descriptionExpanded &&
                    descriptionNeedsCollapse &&
                    "max-h-[220px] overflow-hidden",
                )}
              >
                <JobDescriptionContent
                  html={job.description}
                  className="text-[13px] leading-[1.65] text-[#374151]"
                />
              </div>

              {!descriptionExpanded && descriptionNeedsCollapse ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent" />
              ) : null}

              {descriptionNeedsCollapse ? (
                <button
                  type="button"
                  onClick={() => setDescriptionExpanded((current) => !current)}
                  className="relative z-10 mt-1.5 inline-flex items-center gap-1 text-[13px] font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  {descriptionExpanded ? t("jobs.showLessText") : t("jobs.showMoreText")}
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform",
                      descriptionExpanded && "rotate-180",
                    )}
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                </button>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-[13px] text-[#9CA3AF]">
              {t("jobs.noDescription")}
            </p>
          )}
        </ContentSection>

        {job.address || location || job.landmark ? (
          <ContentSection title={t("jobs.address")}>
            <div className="space-y-1 text-[13px] leading-[1.65] text-[#374151]">
              {job.address ? <p>{job.address}</p> : null}
              {location ? <p>{location}</p> : null}
              {job.landmark ? (
                <p>{t("jobs.landmark", { value: job.landmark })}</p>
              ) : null}
            </div>
          </ContentSection>
        ) : null}

        {job.walkInEnabled ? (
          <ContentSection title={t("jobs.walkInDetails")}>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-medium tracking-[0.05em] text-[#9CA3AF] uppercase">
                  {t("jobs.interviewAddress")}
                </p>
                <p className="mt-1 text-[13px] leading-snug font-semibold text-[#4B5563]">
                  {job.interviewAddress ||
                    location ||
                    t("jobs.addressShared")}
                </p>
              </div>
              {walkInDate ? (
                <div>
                  <p className="text-[10px] font-medium tracking-[0.05em] text-[#9CA3AF] uppercase">
                    {t("jobs.date")}
                  </p>
                  <p className="mt-1 text-[13px] leading-snug font-semibold text-[#4B5563]">
                    {walkInDate}
                  </p>
                </div>
              ) : null}
              {walkInTime ? (
                <div>
                  <p className="text-[10px] font-medium tracking-[0.05em] text-[#9CA3AF] uppercase">
                    {t("jobs.time")}
                  </p>
                  <p className="mt-1 text-[13px] leading-snug font-semibold text-[#4B5563]">
                    {walkInTime}
                  </p>
                </div>
              ) : null}
            </div>
          </ContentSection>
        ) : null}

        {job.interviewInstructions?.trim() ? (
          <ContentSection title={t("jobs.otherInstructions")}>
            <p className="whitespace-pre-wrap text-[13px] leading-[1.65] text-[#374151]">
              {job.interviewInstructions.trim()}
            </p>
          </ContentSection>
        ) : null}

        {recruiter.hasDetails ? (
          <ContentSection title={t("jobs.recruiter")}>
            <JobRecruiterContactDetails
              name={recruiter.name}
              whatsapp={recruiter.whatsapp}
              email={recruiter.email}
              whatsappLabel={t("jobs.whatsappLabel", {
                number: recruiter.whatsapp,
              })}
              className="mt-0"
            />
          </ContentSection>
        ) : null}

        <div className="mt-5 border-t border-[#EEF1F4] bg-white pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <div className="h-12">
            <JobApplyButton
              isApplied={isApplied}
              isApplying={isApplying}
              onClick={handleApplyClick}
              className="inline-flex h-full w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-2 text-[14px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              appliedClassName="h-full w-full text-[14px] font-bold"
              startIcon={
                <Send
                  className="size-4 shrink-0"
                  strokeWidth={2.25}
                  aria-hidden="true"
                />
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
