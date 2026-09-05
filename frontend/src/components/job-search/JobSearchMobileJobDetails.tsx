"use client";

import { JobSearchOverviewSkeleton } from "@/components/job-search/JobSearchSkeletons";
import { JobApplyButton } from "@/components/jobs/JobApplyButton";
import { JobDescriptionContent } from "@/components/ui/JobDescriptionContent";
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
          Back to jobs
        </button>
        <h1 className="mt-3 text-base font-bold text-foreground">
          Job unavailable
        </h1>
        <p className="mt-2 text-xs text-muted">
          Unable to load this job. It may have been closed or removed.
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-[13px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Try again
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
  );
  const salary = formatJobSearchSalary(job);
  const posted = formatJobSearchRelativeTime(job.publishedAt ?? job.createdAt);
  const employmentType = formatJobSearchJobType(job.jobType);
  const experience = formatJobSearchExperience(job.experience);
  const education =
    job.education.length > 0
      ? job.education.map(formatJobSearchEducation).filter(Boolean).join(", ")
      : "";
  const workMode = formatJobSearchWorkMode(job.workMode);
  const genderLabel =
    job.gender.length > 0
      ? job.gender.map(formatJobSearchGender).filter(Boolean).join(", ")
      : "";
  const languageChips = job.languages
    .map(formatJobSearchLanguage)
    .filter(Boolean);
  const perkChips = job.perks.map(formatJobSearchPerk).filter(Boolean);
  const openings = job.vacancies > 0 ? String(job.vacancies) : "";
  const walkInDate = formatJobSearchWalkInDateRange(
    job.walkInStartDate,
    job.walkInEndDate,
  );
  const walkInTime = formatJobSearchWalkInTimeRange(
    job.walkInStartTime,
    job.walkInEndTime,
  );

  const descriptionNeedsCollapse =
    getJobDescriptionPlainTextLength(job.description ?? "") > 380;

  const handleShare = () => {
    void shareOrCopyText({
      title: job.jobTitle,
      text: `${job.jobTitle} at ${job.companyName}`,
      url: buildAbsolutePublicJobUrl(job.jobId),
      successMessage: "Job link copied",
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
      label: "Salary",
      content: salary ? <SummaryValue>{salary}</SummaryValue> : null,
    },
    {
      label: "Location",
      content: location ? <SummaryValue>{location}</SummaryValue> : null,
    },
    {
      label: "Employment Type",
      content: employmentType ? (
        <SummaryValue>{employmentType}</SummaryValue>
      ) : null,
    },
    {
      label: "Experience",
      content: experience ? <SummaryValue>{experience}</SummaryValue> : null,
    },
    {
      label: "Qualification",
      content: education ? <SummaryValue>{education}</SummaryValue> : null,
    },
    {
      label: "Openings",
      content: openings ? <SummaryValue>{openings}</SummaryValue> : null,
    },
    {
      label: "Work Mode",
      content: workMode ? <SummaryValue>{workMode}</SummaryValue> : null,
    },
    {
      label: "Gender",
      content: genderLabel ? <SummaryValue>{genderLabel}</SummaryValue> : null,
    },
    {
      label: "Languages",
      content:
        languageChips.length > 0 ? (
          <OutlinePills values={languageChips} />
        ) : null,
    },
    {
      label: "Benefits",
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
            Back to jobs
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share job"
              className="inline-flex size-10 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white text-[#4B5563] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Share2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onToggleBookmark}
              aria-label={bookmarked ? "Remove bookmark" : "Save job"}
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
              title="Verified"
              aria-label="Verified"
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
          {posted ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-[#9CA3AF]">
              <Clock3
                className="size-3 shrink-0"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              Posted {posted}
            </p>
          ) : null}
        </header>

        {summaryItems.length > 0 ? (
          <section
            className="mt-5 rounded-2xl border border-[#E8ECF0] bg-white px-4"
            aria-label="Job summary"
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

        <ContentSection title="Job Description">
          <p className="text-[13px] font-semibold text-[#1F2937]">
            {job.jobTitle} Job Description
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
                  {descriptionExpanded ? "View less" : "View more"}
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
              No description provided.
            </p>
          )}
        </ContentSection>

        {job.address || location || job.landmark ? (
          <ContentSection title="Address">
            <div className="space-y-1 text-[13px] leading-[1.65] text-[#374151]">
              {job.address ? <p>{job.address}</p> : null}
              {location ? <p>{location}</p> : null}
              {job.landmark ? <p>Landmark: {job.landmark}</p> : null}
            </div>
          </ContentSection>
        ) : null}

        {job.walkInEnabled ? (
          <ContentSection title="Walk-in Details">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-medium tracking-[0.05em] text-[#9CA3AF] uppercase">
                  Interview Address
                </p>
                <p className="mt-1 text-[13px] leading-snug font-semibold text-[#4B5563]">
                  {job.interviewAddress ||
                    location ||
                    "Address shared by recruiter"}
                </p>
              </div>
              {walkInDate ? (
                <div>
                  <p className="text-[10px] font-medium tracking-[0.05em] text-[#9CA3AF] uppercase">
                    Date
                  </p>
                  <p className="mt-1 text-[13px] leading-snug font-semibold text-[#4B5563]">
                    {walkInDate}
                  </p>
                </div>
              ) : null}
              {walkInTime ? (
                <div>
                  <p className="text-[10px] font-medium tracking-[0.05em] text-[#9CA3AF] uppercase">
                    Time
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
          <ContentSection title="Other Instructions">
            <p className="whitespace-pre-wrap text-[13px] leading-[1.65] text-[#374151]">
              {job.interviewInstructions.trim()}
            </p>
          </ContentSection>
        ) : null}

        {job.contactPersonName || job.applyWhatsAppNumber ? (
          <ContentSection title="Recruiter">
            <div className="space-y-1 text-[13px] leading-[1.65] text-[#374151]">
              {job.contactPersonName ? (
                <p className="font-semibold text-[#4B5563]">
                  {job.contactPersonName}
                </p>
              ) : null}
              {job.applyWhatsAppNumber ? (
                <p>WhatsApp: {job.applyWhatsAppNumber}</p>
              ) : null}
            </div>
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
