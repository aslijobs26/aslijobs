"use client";

import { JobDescriptionContent } from "@/components/ui/JobDescriptionContent";
import { JobPosterAvatar } from "@/components/job-search/JobPosterAvatar";
import type { PublicJobDetail } from "@/services/public-jobs.service";
import { cn } from "@/utils/cn";
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
import { isJobDescriptionEmpty } from "@/utils/job-description-html";
import {
  Bookmark,
  Briefcase,
  Building2,
  Clock3,
  Gift,
  Globe2,
  GraduationCap,
  MapPin,
  Share2,
  ShieldCheck,
  User,
  Users,
  VenusAndMars,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

type EmployerJobPreviewArticleProps = {
  job: PublicJobDetail | undefined;
  isLoading: boolean;
  isError: boolean;
  companyLogoUrl?: string | null;
  onRetry?: () => void;
};

function MetaField({
  label,
  icon: Icon,
  children,
  className,
}: {
  label: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center gap-1.5">
        <Icon
          className="size-3.5 shrink-0 text-primary"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <p className="text-[11px] font-medium tracking-[0.04em] text-muted uppercase">
          {label}
        </p>
      </div>
      <div className="mt-1.5 text-sm font-semibold break-words text-foreground">
        {children}
      </div>
    </div>
  );
}

function ChipList({ values }: { values: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <li key={value}>
          <span className="inline-flex max-w-full rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary">
            <span className="truncate">{value}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-base font-semibold tracking-tight text-foreground">
      {children}
    </h3>
  );
}

function formatMissingValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "Not specified";
}

/**
 * Candidate-facing job preview for Employer Dashboard only.
 * Matches the public listing preview layout without altering Job Seeker UI.
 */
export function EmployerJobPreviewArticle({
  job,
  isLoading,
  isError,
  companyLogoUrl,
  onRetry,
}: EmployerJobPreviewArticleProps) {
  const [bookmarked, setBookmarked] = useState(false);

  if (isLoading) {
    return (
      <article className="animate-pulse rounded-xl border border-border-subtle bg-surface p-6 shadow-[0_2px_10px_rgba(26,43,60,0.04)]">
        <div className="flex gap-3">
          <div className="size-12 rounded-full bg-primary-light" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-1/2 rounded bg-primary-light" />
            <div className="h-4 w-1/3 rounded bg-primary-light" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="h-12 rounded-lg bg-primary-light" />
          ))}
        </div>
      </article>
    );
  }

  if (isError || !job) {
    return (
      <article className="rounded-xl border border-border-subtle bg-surface p-8 text-center shadow-[0_2px_10px_rgba(26,43,60,0.04)]">
        <p className="text-sm text-muted">Unable to load this job.</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 text-sm font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Try again
          </button>
        ) : null}
      </article>
    );
  }

  const salary = formatJobSearchSalary(job);
  const location = formatJobSearchLocation(
    job.cityName,
    job.stateName,
    job.city,
    job.state,
  );
  const employmentType = formatJobSearchJobType(job.jobType);
  const experience = formatJobSearchExperience(job.experience);
  const education =
    job.education.length > 0
      ? job.education.map(formatJobSearchEducation).join(", ")
      : "Not specified";
  const openings = job.vacancies > 0 ? String(job.vacancies) : "Not specified";
  const workMode = formatJobSearchWorkMode(job.workMode);
  const genderLabel =
    job.gender.length > 0
      ? job.gender.map(formatJobSearchGender).join(", ")
      : "Any";
  const languageChips = job.languages
    .map(formatJobSearchLanguage)
    .filter(Boolean);
  const perkChips = job.perks.map(formatJobSearchPerk).filter(Boolean);
  const posted = formatJobSearchRelativeTime(job.publishedAt ?? job.createdAt);
  const walkInDate = formatJobSearchWalkInDateRange(
    job.walkInStartDate,
    job.walkInEndDate,
  );
  const walkInTime = formatJobSearchWalkInTimeRange(
    job.walkInStartTime,
    job.walkInEndTime,
  );
  const descriptionText = job.description?.trim() ?? "";
  const hasDescription = !isJobDescriptionEmpty(descriptionText);
  const hasAddress = Boolean(
    job.address?.trim() ||
      (location && location !== "Location not specified") ||
      job.landmark?.trim(),
  );
  const showWalkIn = job.walkInEnabled;
  const recruiterName =
    job.contactPersonName?.trim() || job.companyName.trim() || "—";
  const recruiterWhatsApp = job.applyWhatsAppNumber?.trim() || null;
  const logoUrl = companyLogoUrl?.trim() || job.companyLogoUrl?.trim() || null;

  return (
    <article className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_2px_10px_rgba(26,43,60,0.04)]">
      <div className="px-5 pt-6 pb-5 sm:px-7 sm:pt-7">
        <header className="flex items-start gap-3.5">
          <JobPosterAvatar
            companyName={job.companyName}
            imageUrl={logoUrl}
            className="size-12 rounded-full text-sm sm:size-14"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl leading-tight font-bold tracking-tight break-words text-foreground sm:text-2xl">
                {job.jobTitle}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-semibold text-primary">
                <ShieldCheck
                  className="size-3.5"
                  strokeWidth={2.25}
                  aria-hidden="true"
                />
                Verified
              </span>
            </div>
            <p className="mt-1 text-sm font-medium break-words text-muted">
              {job.companyName}
            </p>
            {posted ? (
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted">
                <Clock3
                  className="size-3.5 shrink-0"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                Posted {posted}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Share job"
              disabled
              className="inline-flex size-9 cursor-default items-center justify-center rounded-lg border border-border-subtle text-muted"
            >
              <Share2 className="size-4" strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setBookmarked((current) => !current)}
              aria-label={bookmarked ? "Remove bookmark" : "Save job"}
              aria-pressed={bookmarked}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                bookmarked
                  ? "border-primary bg-primary-light text-primary"
                  : "border-border-subtle text-muted hover:border-primary/25 hover:text-foreground",
              )}
            >
              <Bookmark
                className="size-4"
                strokeWidth={2}
                fill={bookmarked ? "currentColor" : "none"}
                aria-hidden="true"
              />
            </button>
          </div>
        </header>

        <div
          className="mt-6 border-t border-border-subtle pt-5"
          aria-label="Job information"
        >
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-3">
            <MetaField label="Salary" icon={Wallet}>
              {salary}
            </MetaField>
            <MetaField label="Location" icon={MapPin}>
              {location}
            </MetaField>
            <MetaField label="Employment Type" icon={Briefcase}>
              {employmentType}
            </MetaField>
            <MetaField label="Experience" icon={User}>
              {experience}
            </MetaField>
            <MetaField label="Qualification" icon={GraduationCap}>
              {education}
            </MetaField>
            <MetaField label="Openings" icon={Users}>
              {openings}
            </MetaField>
            <MetaField label="Work Mode" icon={Building2}>
              {workMode}
            </MetaField>
            <MetaField label="Gender Preference" icon={VenusAndMars}>
              {genderLabel}
            </MetaField>
            <MetaField label="Languages" icon={Globe2}>
              {languageChips.length > 0 ? (
                <ChipList values={languageChips} />
              ) : (
                "Not specified"
              )}
            </MetaField>
          </div>

          {perkChips.length > 0 ? (
            <div className="mt-5">
              <MetaField label="Benefits" icon={Gift}>
                <ChipList values={perkChips} />
              </MetaField>
            </div>
          ) : null}
        </div>
      </div>

      <div className="divide-y divide-border-subtle px-5 sm:px-7">
        <section className="py-6">
          <SectionHeading>Job Description</SectionHeading>
          <p className="mt-3 text-sm font-semibold text-foreground">
            {job.jobTitle}
          </p>
          {hasDescription ? (
            <JobDescriptionContent
              html={descriptionText}
              className="mt-2 text-[15px] leading-[1.75] text-muted"
            />
          ) : (
            <p className="mt-2 text-[15px] leading-[1.75] text-muted">
              No description provided.
            </p>
          )}
        </section>

        <section className="py-6">
          <SectionHeading>Address</SectionHeading>
          <div className="mt-3 space-y-1 text-[15px] leading-[1.7] break-words text-muted">
            {hasAddress ? (
              <>
                {job.address?.trim() ? <p>{job.address.trim()}</p> : null}
                {location && location !== "Location not specified" ? (
                  <p>{location}</p>
                ) : null}
                {job.landmark?.trim() ? (
                  <p>Landmark: {job.landmark.trim()}</p>
                ) : null}
              </>
            ) : (
              <p>Not specified</p>
            )}
          </div>
        </section>

        {showWalkIn ? (
          <section className="py-6">
            <SectionHeading>Walk-in Details</SectionHeading>
            <div className="mt-3 space-y-3 text-[15px] leading-[1.7] break-words text-muted">
              <div>
                <p className="text-[11px] font-medium tracking-[0.04em] text-muted uppercase">
                  Interview Address
                </p>
                <p className="mt-1">
                  {formatMissingValue(
                    job.interviewAddress ||
                      (location !== "Location not specified" ? location : ""),
                  )}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium tracking-[0.04em] text-muted uppercase">
                  Date
                </p>
                <p className="mt-1">{formatMissingValue(walkInDate)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium tracking-[0.04em] text-muted uppercase">
                  Time
                </p>
                <p className="mt-1">{formatMissingValue(walkInTime)}</p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="py-6">
          <SectionHeading>Recruiter</SectionHeading>
          <div className="mt-3 space-y-1 text-[15px] leading-[1.7] break-words text-muted">
            <p className="font-medium text-foreground">{recruiterName}</p>
            {recruiterWhatsApp ? <p>WhatsApp: {recruiterWhatsApp}</p> : null}
          </div>
        </section>
      </div>
    </article>
  );
}
