"use client";

import type { PublicJobDetail } from "@/services/public-jobs.service";
import { protectedApply } from "@/utils/job-apply-auth";
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
  getCompanyInitials,
} from "@/utils/job-search-format";
import {
  buildAbsolutePublicJobUrl,
  shareOrCopyText,
} from "@/utils/share-job";
import { cn } from "@/utils/cn";
import {
  Bookmark,
  Briefcase,
  Building2,
  ChevronDown,
  Clock3,
  Footprints,
  Gift,
  Globe2,
  GraduationCap,
  MapPin,
  Share2,
  ShieldCheck,
  Send,
  User,
  Users,
  VenusAndMars,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

type JobDetailsCenterPanelProps = {
  job: PublicJobDetail | undefined;
  isLoading: boolean;
  isError: boolean;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  onRetry?: () => void;
};

const DESCRIPTION_COLLAPSE_CHARS = 420;

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
      <div className="mt-1.5 text-sm font-semibold text-foreground">
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
          <span className="inline-flex rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary">
            {value}
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

function splitInstructionLines(text: string): string[] {
  return text
    .split(/\r?\n|•/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

export function JobDetailsCenterPanel({
  job,
  isLoading,
  isError,
  bookmarked,
  onToggleBookmark,
  onRetry,
}: JobDetailsCenterPanelProps) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const descriptionNeedsCollapse = useMemo(() => {
    const length = job?.description?.trim().length ?? 0;
    return length > DESCRIPTION_COLLAPSE_CHARS;
  }, [job?.description]);

  if (isLoading) {
    return (
      <article className="animate-pulse rounded-xl border border-border-subtle bg-surface p-6 shadow-[0_2px_10px_rgba(26,43,60,0.04)]">
        <div className="flex gap-3">
          <div className="size-14 rounded-full bg-primary-light" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-1/2 rounded bg-primary-light" />
            <div className="h-4 w-1/3 rounded bg-primary-light" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4">
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
      : "";
  const openings = job.vacancies ? String(job.vacancies) : "";
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
  const hasAddress = Boolean(job.address || location || job.landmark);
  const hasWalkIn = job.walkInEnabled;
  const instructionLines = job.interviewInstructions?.trim()
    ? splitInstructionLines(job.interviewInstructions)
    : [];
  const descriptionText = job.description?.trim() ?? "";
  const visibleDescription =
    !descriptionNeedsCollapse || descriptionExpanded
      ? descriptionText
      : `${descriptionText.slice(0, DESCRIPTION_COLLAPSE_CHARS).trimEnd()}…`;

  const handleShare = () => {
    void shareOrCopyText({
      title: job.jobTitle,
      text: `${job.jobTitle} at ${job.companyName}`,
      url: buildAbsolutePublicJobUrl(job.jobId),
      successMessage: "Job link copied",
    });
  };

  const handleApplyClick = () => {
    if (isApplying) {
      return;
    }
    setIsApplying(true);
    void protectedApply({
      applyWhatsAppNumber: job.applyWhatsAppNumber,
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      jobId: job.jobId,
    }).finally(() => {
      setIsApplying(false);
    });
  };

  return (
    <article className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_2px_10px_rgba(26,43,60,0.04)]">
      <div className="px-5 pt-6 pb-5 sm:px-7 sm:pt-7">
        <header className="flex items-start gap-3.5">
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-foreground"
            aria-hidden="true"
          >
            {getCompanyInitials(job.companyName)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl leading-tight font-bold tracking-tight text-foreground">
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
            <p className="mt-1 text-sm font-medium text-muted">
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
              onClick={handleShare}
              aria-label="Share job"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-border-subtle text-muted transition-colors hover:border-primary/25 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Share2 className="size-4" strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onToggleBookmark}
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

        <div className="mt-6 border-t border-border-subtle pt-5" aria-label="Job information">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-3">
            {salary ? (
              <MetaField label="Salary" icon={Wallet}>
                {salary}
              </MetaField>
            ) : null}
            {location ? (
              <MetaField label="Location" icon={MapPin}>
                {location}
              </MetaField>
            ) : null}
            {employmentType ? (
              <MetaField label="Employment Type" icon={Briefcase}>
                {employmentType}
              </MetaField>
            ) : null}
            {experience ? (
              <MetaField label="Experience" icon={User}>
                {experience}
              </MetaField>
            ) : null}
            {education ? (
              <MetaField label="Qualification" icon={GraduationCap}>
                {education}
              </MetaField>
            ) : null}
            {openings ? (
              <MetaField label="Openings" icon={Users}>
                {openings}
              </MetaField>
            ) : null}
            {workMode ? (
              <MetaField label="Work Mode" icon={Building2}>
                {workMode}
              </MetaField>
            ) : null}
            <MetaField label="Gender Preference" icon={VenusAndMars}>
              {genderLabel}
            </MetaField>
            {languageChips.length > 0 ? (
              <MetaField label="Languages" icon={Globe2}>
                <ChipList values={languageChips} />
              </MetaField>
            ) : null}
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
          {descriptionText ? (
            <>
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-[1.75] text-muted">
                {visibleDescription}
              </p>
              {descriptionNeedsCollapse ? (
                <button
                  type="button"
                  onClick={() => setDescriptionExpanded((current) => !current)}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  aria-expanded={descriptionExpanded}
                >
                  {descriptionExpanded ? "Show less" : "Show more"}
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      descriptionExpanded && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </button>
              ) : null}
            </>
          ) : (
            <p className="mt-3 text-[15px] leading-[1.75] text-muted">
              No description provided.
            </p>
          )}
        </section>

        {hasAddress || hasWalkIn ? (
          <section className="py-6">
            <div
              className={cn(
                "grid grid-cols-1 gap-6",
                hasAddress && hasWalkIn && "md:grid-cols-2 md:gap-8",
              )}
            >
              {hasAddress ? (
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin
                      className="size-4 text-primary"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <SectionHeading>Address</SectionHeading>
                  </div>
                  <div className="mt-3 space-y-1 text-[15px] leading-[1.7] text-muted">
                    {job.address ? <p>{job.address}</p> : null}
                    {location ? <p>{location}</p> : null}
                    {job.landmark ? <p>Landmark: {job.landmark}</p> : null}
                  </div>
                </div>
              ) : null}

              {hasWalkIn ? (
                <div>
                  <div className="flex items-center gap-2">
                    <Footprints
                      className="size-4 text-primary"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <SectionHeading>Walk-in Details</SectionHeading>
                  </div>
                  <div className="mt-3 space-y-3 text-[15px] leading-[1.7] text-muted">
                    <div>
                      <p className="text-[11px] font-medium tracking-[0.04em] text-muted uppercase">
                        Interview Address
                      </p>
                      <p className="mt-1">
                        {job.interviewAddress ||
                          location ||
                          "Address shared by recruiter"}
                      </p>
                    </div>
                    {walkInDate ? (
                      <div>
                        <p className="text-[11px] font-medium tracking-[0.04em] text-muted uppercase">
                          Date
                        </p>
                        <p className="mt-1">{walkInDate}</p>
                      </div>
                    ) : null}
                    {walkInTime ? (
                      <div>
                        <p className="text-[11px] font-medium tracking-[0.04em] text-muted uppercase">
                          Time
                        </p>
                        <p className="mt-1">{walkInTime}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {instructionLines.length > 0 ? (
          <section className="py-6">
            <SectionHeading>Other Instructions</SectionHeading>
            <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
              {instructionLines.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2 text-[15px] leading-[1.7] text-muted"
                >
                  <span
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  {line}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {job.contactPersonName || job.applyWhatsAppNumber ? (
          <section className="py-6">
            <p className="text-[15px] leading-[1.7] text-muted">
              <span className="font-semibold text-foreground">Recruiter:</span>{" "}
              {job.contactPersonName || "—"}
              {job.applyWhatsAppNumber
                ? `  ·  WhatsApp: ${job.applyWhatsAppNumber}`
                : null}
            </p>
          </section>
        ) : null}
      </div>

      <div className="sticky bottom-0 border-t border-border-subtle bg-surface/95 px-5 py-4 backdrop-blur-md sm:px-7">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleApplyClick}
            disabled={isApplying}
            className="inline-flex h-11 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="size-4" strokeWidth={2.25} aria-hidden="true" />
            {isApplying ? "Submitting…" : "Apply Now"}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border-subtle bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <Share2 className="size-4" aria-hidden="true" />
            Share Job
          </button>
          <button
            type="button"
            onClick={onToggleBookmark}
            aria-pressed={bookmarked}
            className={cn(
              "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              bookmarked
                ? "border-primary bg-primary-light text-primary"
                : "border-border-subtle bg-surface text-foreground hover:border-primary/30",
            )}
          >
            <Bookmark
              className="size-4"
              fill={bookmarked ? "currentColor" : "none"}
              aria-hidden="true"
            />
            {bookmarked ? "Saved" : "Save Job"}
          </button>
        </div>
      </div>
    </article>
  );
}
