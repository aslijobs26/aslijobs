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

import { OPERATIONS_POST_JOB_LANGUAGE_OPTIONS } from "../../../../constants/operations-post-job";
import type { OperationsJobDetail } from "../../../../types/operations-jobs";
import { perkLabel } from "../../../../utils/map-operations-post-job-preview";
import { cn } from "../../../../utils/cn";
import { EmployerLogo } from "../../../ui/EmployerLogo";
import { JobDescriptionContent } from "../../../ui/JobDescriptionContent";
import {
  descriptionParagraphs,
  formatOperationsRelativePostedAt,
  formatWalkInDateRange,
  formatWalkInTimeRange,
} from "./job-detail-format";
import {
  getJobDescriptionPlainText,
  looksLikeJobDescriptionHtml,
} from "../../../../utils/job-description-html";


interface JobListingPreviewArticleProps {
  job: OperationsJobDetail;
  className?: string;
  emptyDescriptionMessage?: string;
}

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
      <div className="flex items-center gap-1">
        <Icon
          className="size-3 shrink-0 text-primary"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <p className="text-[10px] font-medium tracking-[0.04em] text-muted uppercase">
          {label}
        </p>
      </div>
      <div className="mt-1 text-xs font-semibold break-words text-foreground">
        {children}
      </div>
    </div>
  );
}

function ChipList({ values }: { values: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1">
      {values.map((value) => (
        <li key={value}>
          <span className="inline-flex rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-medium text-primary">
            {value}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h4 className="text-sm font-semibold tracking-tight text-foreground">
      {children}
    </h4>
  );
}

function languageLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return (
    OPERATIONS_POST_JOB_LANGUAGE_OPTIONS.find(
      (option) => option.value === trimmed,
    )?.label ?? trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
  );
}

function cleanDescriptionParagraphs(description: string): string[] {
  return descriptionParagraphs(description).filter((paragraph) => {
    const withoutMarkdown = paragraph.replace(/^#{1,6}\s*/, "").trim();
    if (!withoutMarkdown) {
      return false;
    }
    // Drop redundant heading lines that duplicate the section title.
    return !/^job\s+description\s*:?\s*$/i.test(withoutMarkdown);
  });
}

export function JobListingPreviewArticle({
  job,
  className,
  emptyDescriptionMessage = "No description provided.",
}: JobListingPreviewArticleProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const paragraphs = cleanDescriptionParagraphs(job.description);
  const descriptionIsHtml = looksLikeJobDescriptionHtml(job.description);
  const hasDescription = descriptionIsHtml
    ? Boolean(getJobDescriptionPlainText(job.description))
    : paragraphs.length > 0;

  const salaryDisplay = job.salaryLabel.trim();
  const locationDisplay = job.locationLabel.trim();
  const employmentType = job.jobTypeLabel.trim();
  const experience = job.experienceLabel.trim();
  const qualification = job.educationLabel.trim();
  const openingsDisplay =
    job.vacancies && job.vacancies > 0 ? String(job.vacancies) : "";
  const workMode = job.workModeLabel.trim();
  const genderDisplay = job.genderLabel.trim() || "Any";
  const languageChips = job.languages
    .map(languageLabel)
    .map((value) => value.trim())
    .filter(Boolean);
  const benefitChips = job.perks
    .map(perkLabel)
    .map((value) => value.trim())
    .filter(Boolean);

  const postedAt = formatOperationsRelativePostedAt(
    job.publishedAt ?? job.submittedForApprovalAt ?? job.createdAt,
  );

  const hasAddress = Boolean(
    job.address.trim() || locationDisplay || job.landmark.trim(),
  );
  const hasWalkIn = job.walkInEnabled;
  const walkInDate = formatWalkInDateRange(job.walkInStartDate, job.walkInEndDate);
  const walkInTime = formatWalkInTimeRange(job.walkInStartTime, job.walkInEndTime);
  const hasRecruiter = Boolean(
    job.contactPersonName.trim() ||
      job.contactMobile.trim() ||
      job.contactEmail.trim(),
  );

  const companyName =
    job.employer.companyName.trim() ||
    job.companyName.trim() ||
    "Employer not assigned";

  const handleShare = async () => {
    const title = job.jobTitle.trim() || "Job";
    const text = `${title} at ${companyName}`;
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title, text });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setShareFeedback("Copied");
        window.setTimeout(() => setShareFeedback(null), 1500);
      }
    } catch {
      setShareFeedback(null);
    }
  };

  return (
    <article
      className={cn(
        "job-preview-card overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-sm",
        className,
      )}
    >
      <div className="bg-[color-mix(in_srgb,var(--color-primary)_5%,white)] px-4 pt-5 pb-4 sm:px-6 sm:pt-6 dark:bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-surface))]">
        <header className="flex items-start gap-3">
          <EmployerLogo
            name={companyName}
            logoUrl={job.employer.logoUrl}
            size="lg"
            className="size-11 rounded-full bg-primary-light text-primary-soft ring-0"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-base font-bold leading-tight tracking-tight text-foreground sm:text-lg">
                {job.jobTitle.trim() || "Job Title"}
              </h3>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-primary-light px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                <ShieldCheck
                  className="size-3"
                  strokeWidth={2.25}
                  aria-hidden="true"
                />
                Verified
              </span>
            </div>

            <p className="mt-0.5 text-xs font-medium text-muted">{companyName}</p>

            {postedAt ? (
              <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted">
                <Clock3
                  className="size-3 shrink-0"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                Posted {postedAt}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => void handleShare()}
              aria-label="Share job"
              className="inline-flex size-8 items-center justify-center rounded-full border border-border-subtle bg-surface text-muted transition-colors hover:border-primary/25 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Share2 className="size-3.5" strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setBookmarked((current) => !current)}
              aria-label={bookmarked ? "Remove bookmark" : "Save job"}
              aria-pressed={bookmarked}
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-full border bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                bookmarked
                  ? "border-primary text-primary"
                  : "border-border-subtle text-muted hover:border-primary/25 hover:text-foreground",
              )}
            >
              <Bookmark
                className="size-3.5"
                strokeWidth={2}
                fill={bookmarked ? "currentColor" : "none"}
                aria-hidden="true"
              />
            </button>
          </div>
        </header>

        {shareFeedback ? (
          <p className="mt-1.5 text-right text-[10px] font-medium text-success" role="status">
            {shareFeedback}
          </p>
        ) : null}

        <div
          className="mt-4 border-t border-border-subtle pt-4"
          aria-label="Job information"
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 md:grid-cols-3">
            {salaryDisplay ? (
              <MetaField label="Salary" icon={Wallet}>
                {salaryDisplay}
              </MetaField>
            ) : null}
            {locationDisplay ? (
              <MetaField label="Location" icon={MapPin}>
                {locationDisplay}
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
            {qualification ? (
              <MetaField label="Qualification" icon={GraduationCap}>
                {qualification}
              </MetaField>
            ) : null}
            {openingsDisplay ? (
              <MetaField label="Openings" icon={Users}>
                {openingsDisplay}
              </MetaField>
            ) : null}
            {workMode ? (
              <MetaField label="Work Mode" icon={Building2}>
                {workMode}
              </MetaField>
            ) : null}
            <MetaField label="Gender Preference" icon={VenusAndMars}>
              {genderDisplay}
            </MetaField>
            {languageChips.length > 0 ? (
              <MetaField label="Languages" icon={Globe2}>
                <ChipList values={languageChips} />
              </MetaField>
            ) : null}
          </div>

          {benefitChips.length > 0 ? (
            <div className="mt-3.5">
              <MetaField label="Benefits" icon={Gift}>
                <ChipList values={benefitChips} />
              </MetaField>
            </div>
          ) : null}
        </div>
      </div>

      <div className="divide-y divide-border-subtle bg-[color-mix(in_srgb,var(--color-primary)_5%,white)] px-4 sm:px-6 dark:bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-surface))]">
        <section className="py-4">
          <SectionHeading>Job Description</SectionHeading>
          {job.jobTitle.trim() ? (
            <p className="mt-1.5 text-xs font-semibold text-foreground">
              {job.jobTitle.trim()}
            </p>
          ) : null}
          {hasDescription ? (
            descriptionIsHtml ? (
              <JobDescriptionContent
                html={job.description}
                className="mt-2 text-xs leading-relaxed text-muted sm:text-[13px] sm:leading-[1.65]"
              />
            ) : (
              <div className="mt-2 space-y-2 text-xs leading-relaxed break-words text-muted sm:text-[13px] sm:leading-[1.65]">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)} className="whitespace-pre-wrap">
                    {paragraph.replace(/^#{1,6}\s*/, "")}
                  </p>
                ))}
              </div>
            )
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-muted sm:text-[13px]">
              {emptyDescriptionMessage}
            </p>
          )}
        </section>

        {hasAddress ? (
          <section className="py-4">
            <SectionHeading>Address</SectionHeading>
            <div className="mt-2 space-y-0.5 text-xs leading-relaxed break-words text-muted sm:text-[13px] sm:leading-[1.65]">
              {job.address.trim() ? <p>{job.address.trim()}</p> : null}
              {locationDisplay ? <p>{locationDisplay}</p> : null}
              {job.landmark.trim() ? (
                <p>Landmark: {job.landmark.trim()}</p>
              ) : null}
            </div>
          </section>
        ) : null}

        {hasWalkIn ? (
          <section className="py-4">
            <SectionHeading>Walk-in Details</SectionHeading>
            <div className="mt-2 space-y-2.5 text-xs leading-relaxed break-words text-muted sm:text-[13px] sm:leading-[1.65]">
              <div>
                <p className="text-[10px] font-medium tracking-[0.04em] text-muted uppercase">
                  Interview Address
                </p>
                <p className="mt-0.5">
                  {job.interviewAddress.trim() ||
                    locationDisplay ||
                    "Address shared by recruiter"}
                </p>
              </div>
              {walkInDate ? (
                <div>
                  <p className="text-[10px] font-medium tracking-[0.04em] text-muted uppercase">
                    Date
                  </p>
                  <p className="mt-0.5">{walkInDate}</p>
                </div>
              ) : null}
              {walkInTime ? (
                <div>
                  <p className="text-[10px] font-medium tracking-[0.04em] text-muted uppercase">
                    Time
                  </p>
                  <p className="mt-0.5">{walkInTime}</p>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {hasRecruiter ? (
          <section className="py-4">
            <SectionHeading>Recruiter</SectionHeading>
            <div className="mt-2 space-y-0.5 text-xs leading-relaxed break-words sm:text-[13px] sm:leading-[1.65]">
              {job.contactPersonName.trim() ? (
                <p className="font-semibold text-foreground">
                  {job.contactPersonName.trim()}
                </p>
              ) : null}
              {job.contactMobile.trim() ? (
                <p className="text-muted">
                  WhatsApp: {job.contactMobile.trim()}
                </p>
              ) : null}
              {job.contactEmail.trim() ? (
                <p className="text-muted">{job.contactEmail.trim()}</p>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
}
