"use client";

import { JobSearchOverviewSkeleton } from "@/components/job-search/JobSearchSkeletons";
import type { PublicJobDetail } from "@/services/public-jobs.service";
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
import { canApplyViaWhatsApp } from "@/utils/job-search-whatsapp";
import { protectedApply } from "@/utils/job-apply-auth";
import {
  buildAbsolutePublicJobUrl,
  shareOrCopyText,
} from "@/utils/share-job";
import { cn } from "@/utils/cn";
import {
  ArrowLeft,
  Bookmark,
  Briefcase,
  Building2,
  Clock3,
  Gift,
  Globe2,
  GraduationCap,
  MapPin,
  Send,
  Share2,
  ShieldCheck,
  User,
  Users,
  VenusAndMars,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type JobSearchOverviewPanelProps = {
  job: PublicJobDetail | undefined;
  isLoading: boolean;
  isError: boolean;
  bookmarked: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  onToggleBookmark: () => void;
  onRetry?: () => void;
};

type OverviewFieldProps = {
  label: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
};

const ICON_SURFACE = "#EAF8F3";
/** Collapse only after scrolling past this point (expanded → collapsed). */
const COLLAPSE_SCROLL_THRESHOLD_PX = 140;
/** Expand only after returning near the top (collapsed → expanded). */
const EXPAND_SCROLL_THRESHOLD_PX = 20;
/** Matches SUMMARY_MOTION duration; ignore scroll toggles mid-animation. */
const SUMMARY_TRANSITION_LOCK_MS = 340;
const SUMMARY_MOTION =
  "duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]";

function FoldSection({
  open,
  children,
  className,
  delayClassName,
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
  delayClassName?: string;
}) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,margin,padding] motion-reduce:transition-none",
        SUMMARY_MOTION,
        delayClassName,
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        className,
      )}
      aria-hidden={!open}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

function OverviewField({
  label,
  icon: Icon,
  children,
  className,
}: OverviewFieldProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center gap-1">
        <Icon
          className="size-3 shrink-0 text-primary"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <p className="truncate text-[9px] leading-none font-medium tracking-[0.05em] text-muted uppercase">
          {label}
        </p>
      </div>
      <div className="mt-0.5 pl-4">{children}</div>
    </div>
  );
}

function OverviewValue({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] leading-snug font-semibold break-words text-foreground">
      {children}
    </p>
  );
}

function OverviewChips({ values }: { values: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1">
      {values.map((value) => (
        <li key={value}>
          <span
            className="inline-flex max-w-full items-center truncate rounded-full px-1.5 py-0.5 text-[9px] leading-none font-medium text-primary"
            style={{ backgroundColor: ICON_SURFACE }}
          >
            {value}
          </span>
        </li>
      ))}
    </ul>
  );
}

function CompactMetaItem({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  if (!children) {
    return null;
  }

  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1 text-[11px] font-semibold text-foreground">
      <Icon className="size-3 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
      <span className="truncate">{children}</span>
    </span>
  );
}

function DetailSectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[18px] leading-tight font-bold text-[#1F2937]">
      {children}
    </h3>
  );
}

function DetailFieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[12px] leading-none font-medium tracking-[0.04em] text-[#9CA3AF] uppercase">
      {children}
    </p>
  );
}

function DetailPlainText({ children }: { children: ReactNode }) {
  return (
    <p className="text-[15px] leading-[1.7] text-[#374151]">{children}</p>
  );
}

function DetailMultilineText({ text }: { text: string }) {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  return (
    <p className="whitespace-pre-wrap text-[15px] leading-[1.7] text-[#374151]">
      {trimmed}
    </p>
  );
}

export function JobSearchOverviewPanel({
  job,
  isLoading,
  isError,
  bookmarked,
  showBackButton = false,
  onBack,
  onToggleBookmark,
  onRetry,
}: JobSearchOverviewPanelProps) {
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false);
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const collapsedRef = useRef(false);
  const transitionLockRef = useRef(false);
  const transitionUnlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const rafIdRef = useRef(0);

  useEffect(() => {
    collapsedRef.current = false;
    transitionLockRef.current = false;
    if (transitionUnlockTimerRef.current !== null) {
      clearTimeout(transitionUnlockTimerRef.current);
      transitionUnlockTimerRef.current = null;
    }
    setIsSummaryCollapsed(false);
    if (scrollBodyRef.current) {
      scrollBodyRef.current.scrollTop = 0;
    }
  }, [job?.jobId]);

  useEffect(() => {
    const scrollElement = scrollBodyRef.current;
    if (!scrollElement || !job?.jobId) {
      return;
    }

    const resolveCollapsedForScrollTop = (scrollTop: number): boolean => {
      if (collapsedRef.current) {
        return scrollTop > EXPAND_SCROLL_THRESHOLD_PX;
      }
      return scrollTop >= COLLAPSE_SCROLL_THRESHOLD_PX;
    };

    const commitCollapsedState = (nextCollapsed: boolean) => {
      if (nextCollapsed === collapsedRef.current) {
        return;
      }

      collapsedRef.current = nextCollapsed;
      transitionLockRef.current = true;
      setIsSummaryCollapsed(nextCollapsed);

      if (transitionUnlockTimerRef.current !== null) {
        clearTimeout(transitionUnlockTimerRef.current);
      }

      transitionUnlockTimerRef.current = setTimeout(() => {
        transitionUnlockTimerRef.current = null;
        transitionLockRef.current = false;

        // Re-sync once after the animation so we are not stuck if scroll moved.
        commitCollapsedState(
          resolveCollapsedForScrollTop(scrollElement.scrollTop),
        );
      }, SUMMARY_TRANSITION_LOCK_MS);
    };

    const evaluateScrollPosition = () => {
      rafIdRef.current = 0;

      if (transitionLockRef.current) {
        return;
      }

      commitCollapsedState(
        resolveCollapsedForScrollTop(scrollElement.scrollTop),
      );
    };

    const handleScroll = () => {
      if (rafIdRef.current !== 0) {
        return;
      }
      rafIdRef.current = requestAnimationFrame(evaluateScrollPosition);
    };

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
      if (rafIdRef.current !== 0) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
      if (transitionUnlockTimerRef.current !== null) {
        clearTimeout(transitionUnlockTimerRef.current);
        transitionUnlockTimerRef.current = null;
      }
      transitionLockRef.current = false;
    };
  }, [job?.jobId]);

  if (isLoading) {
    return <JobSearchOverviewSkeleton />;
  }

  if (isError || !job) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-surface p-5">
        {showBackButton && onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to jobs
          </button>
        ) : null}
        <h2 className="text-lg font-bold text-foreground">Job unavailable</h2>
        <p className="mt-2 text-sm text-muted">
          Unable to load this job. It may have been closed or removed.
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
  const canApply = canApplyViaWhatsApp(job.applyWhatsAppNumber);
  const genderLabel =
    job.gender.length > 0
      ? job.gender.map(formatJobSearchGender).join(", ")
      : "Any";
  const languageChips = job.languages
    .map(formatJobSearchLanguage)
    .filter(Boolean);
  const education =
    job.education.length > 0
      ? job.education.map(formatJobSearchEducation).join(", ")
      : "";
  const perkChips = job.perks.map(formatJobSearchPerk).filter(Boolean);
  const employmentType = formatJobSearchJobType(job.jobType);
  const experience = formatJobSearchExperience(job.experience);
  const workMode = formatJobSearchWorkMode(job.workMode);
  const openings = job.vacancies ? String(job.vacancies) : "";

  const handleShare = () => {
    void shareOrCopyText({
      title: job.jobTitle,
      text: `${job.jobTitle} at ${job.companyName}`,
      url: buildAbsolutePublicJobUrl(job.jobId),
      successMessage: "Job link copied",
    });
  };

  const handleApplyClick = () => {
    protectedApply({
      applyWhatsAppNumber: job.applyWhatsAppNumber,
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      jobId: job.jobId,
    });
  };

  return (
    <article className="flex h-full min-h-0 max-h-full flex-col overflow-hidden rounded-[22px] border border-[#E8ECF0] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div
        className={cn(
          "relative z-20 isolate shrink-0 border-b bg-white transition-[padding,box-shadow,border-color] motion-reduce:transition-none",
          SUMMARY_MOTION,
          isSummaryCollapsed
            ? "border-[#EEF1F4] px-3.5 py-2 shadow-[0_4px_14px_rgba(15,23,42,0.06)] sm:px-5"
            : "border-transparent px-3.5 pt-3 pb-2.5 sm:px-5 sm:pt-4 sm:pb-3.5 lg:px-6",
        )}
      >
        {showBackButton && onBack ? (
          <button
            type="button"
            onClick={onBack}
            className={cn(
              "inline-flex items-center gap-1.5 text-sm font-semibold text-primary-soft transition-[margin] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              SUMMARY_MOTION,
              isSummaryCollapsed ? "mb-2" : "mb-3 sm:mb-4",
            )}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to jobs
          </button>
        ) : null}

        <header className="flex items-start gap-2.5">
          <div
            className={cn(
              "flex shrink-0 items-center justify-center font-bold text-foreground transition-all motion-reduce:transition-none",
              SUMMARY_MOTION,
              isSummaryCollapsed
                ? "size-9 rounded-[11px] text-xs"
                : "size-10 rounded-[12px] text-sm sm:size-11",
            )}
            style={{ backgroundColor: ICON_SURFACE }}
            aria-hidden="true"
          >
            {getCompanyInitials(job.companyName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2
                className={cn(
                  "min-w-0 leading-tight font-bold tracking-tight break-words text-foreground transition-[font-size] motion-reduce:transition-none",
                  SUMMARY_MOTION,
                  isSummaryCollapsed
                    ? "text-[15px] sm:text-base"
                    : "text-base sm:text-lg",
                )}
              >
                {job.jobTitle}
              </h2>
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-primary"
                style={{ backgroundColor: ICON_SURFACE }}
              >
                <ShieldCheck className="size-3.5" strokeWidth={2.25} aria-hidden="true" />
                Verified
              </span>
            </div>
            <p
              className={cn(
                "truncate font-medium text-muted transition-[margin,font-size] motion-reduce:transition-none",
                SUMMARY_MOTION,
                isSummaryCollapsed ? "mt-1 text-xs" : "mt-1 text-sm",
              )}
            >
              {job.companyName}
            </p>
            {posted ? (
              <p
                className={cn(
                  "inline-flex items-center gap-1.5 text-muted transition-[margin,font-size] motion-reduce:transition-none",
                  SUMMARY_MOTION,
                  isSummaryCollapsed ? "mt-1 text-[11px]" : "mt-1 text-xs",
                )}
              >
                <Clock3
                  className={cn(
                    "shrink-0",
                    isSummaryCollapsed ? "size-3" : "size-3.5",
                  )}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                Posted {posted}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share job"
              className="inline-flex size-8 items-center justify-center rounded-[10px] border border-[#E5E7EB] text-[#9CA3AF] transition-colors hover:border-[#D1D5DB] hover:text-[#6B7280] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft/30"
            >
              <Share2 className="size-3.5" strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onToggleBookmark}
              aria-label={bookmarked ? "Remove bookmark" : "Save job"}
              aria-pressed={bookmarked}
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-[10px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft/30",
                bookmarked
                  ? "border-primary bg-primary-light text-primary"
                  : "border-[#E5E7EB] text-[#9CA3AF] hover:border-[#D1D5DB] hover:text-[#6B7280]",
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

        <FoldSection
          open={!isSummaryCollapsed}
          className={isSummaryCollapsed ? "mt-0" : "mt-3"}
        >
          <div
            className="border-t border-[#EEF1F4] pt-3"
            aria-label="Job information"
          >
            <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 xl:grid-cols-3 xl:gap-x-4 xl:gap-y-4">
              {salary ? (
                <OverviewField label="Salary" icon={Wallet}>
                  <OverviewValue>{salary}</OverviewValue>
                </OverviewField>
              ) : null}
              {location ? (
                <OverviewField label="Location" icon={MapPin}>
                  <OverviewValue>{location}</OverviewValue>
                </OverviewField>
              ) : null}
              {employmentType ? (
                <OverviewField label="Employment Type" icon={Briefcase}>
                  <OverviewValue>{employmentType}</OverviewValue>
                </OverviewField>
              ) : null}
              {experience ? (
                <OverviewField label="Experience" icon={User}>
                  <OverviewValue>{experience}</OverviewValue>
                </OverviewField>
              ) : null}
              {education ? (
                <OverviewField label="Qualification" icon={GraduationCap}>
                  <OverviewValue>{education}</OverviewValue>
                </OverviewField>
              ) : null}
              {openings ? (
                <OverviewField label="Openings" icon={Users}>
                  <OverviewValue>{openings}</OverviewValue>
                </OverviewField>
              ) : null}
              {workMode ? (
                <OverviewField label="Work Mode" icon={Building2}>
                  <OverviewValue>{workMode}</OverviewValue>
                </OverviewField>
              ) : null}
              <OverviewField label="Gender Preference" icon={VenusAndMars}>
                <OverviewValue>{genderLabel}</OverviewValue>
              </OverviewField>
              {languageChips.length > 0 ? (
                <OverviewField label="Languages" icon={Globe2}>
                  <OverviewChips values={languageChips} />
                </OverviewField>
              ) : null}
              {perkChips.length > 0 ? (
                <OverviewField
                  label="Benefits"
                  icon={Gift}
                  className="col-span-2 xl:col-span-3"
                >
                  <OverviewChips values={perkChips} />
                </OverviewField>
              ) : null}
            </div>
          </div>
        </FoldSection>

        <FoldSection
          open={isSummaryCollapsed}
          className={isSummaryCollapsed ? "mt-2" : "mt-0"}
          delayClassName="delay-[90ms] motion-reduce:delay-0"
        >
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-t border-[#EEF1F4] px-0.5 pt-2.5 pb-1 sm:gap-x-3 sm:pt-3 sm:pb-3.5">
            <CompactMetaItem icon={Wallet}>{salary}</CompactMetaItem>
            <CompactMetaItem icon={MapPin}>{location}</CompactMetaItem>
            <CompactMetaItem icon={Briefcase}>{employmentType}</CompactMetaItem>
          </div>
        </FoldSection>
      </div>

      <div
        ref={scrollBodyRef}
        className="relative z-0 min-h-0 flex-1 overflow-y-auto bg-white px-3.5 pt-3 pb-4 sm:px-6 sm:pt-4 sm:pb-6 lg:px-7 lg:pb-7 scrollbar-hidden"
      >
        <div className="divide-y divide-[#EEEEEE]">
          <section className="pb-5">
            <DetailSectionHeading>Job Description</DetailSectionHeading>
            <p className="mt-2 text-[16px] leading-snug font-semibold text-[#1F2937]">
              {job.jobTitle}
            </p>
            {job.description?.trim() ? (
              <div className="mt-3">
                <DetailMultilineText text={job.description} />
              </div>
            ) : (
              <p className="mt-3 text-[15px] leading-[1.7] text-[#9CA3AF]">
                No description provided.
              </p>
            )}
          </section>

          {job.address || location || job.landmark ? (
            <section className="py-5">
              <DetailSectionHeading>Address</DetailSectionHeading>
              <div className="mt-3 space-y-1">
                {job.address ? (
                  <DetailPlainText>{job.address}</DetailPlainText>
                ) : null}
                {location ? <DetailPlainText>{location}</DetailPlainText> : null}
                {job.landmark ? (
                  <DetailPlainText>Landmark: {job.landmark}</DetailPlainText>
                ) : null}
              </div>
            </section>
          ) : null}

          {job.walkInEnabled ? (
            <section className="py-5">
              <DetailSectionHeading>Walk-in Details</DetailSectionHeading>
              <div className="mt-4 space-y-4">
                <div>
                  <DetailFieldLabel>Interview Address</DetailFieldLabel>
                  <div className="mt-1.5">
                    <DetailPlainText>
                      {job.interviewAddress ||
                        location ||
                        "Address shared by recruiter"}
                    </DetailPlainText>
                  </div>
                </div>
                {formatJobSearchWalkInDateRange(
                  job.walkInStartDate,
                  job.walkInEndDate,
                ) ? (
                  <div>
                    <DetailFieldLabel>Date</DetailFieldLabel>
                    <div className="mt-1.5">
                      <DetailPlainText>
                        {formatJobSearchWalkInDateRange(
                          job.walkInStartDate,
                          job.walkInEndDate,
                        )}
                      </DetailPlainText>
                    </div>
                  </div>
                ) : null}
                {formatJobSearchWalkInTimeRange(
                  job.walkInStartTime,
                  job.walkInEndTime,
                ) ? (
                  <div>
                    <DetailFieldLabel>Time</DetailFieldLabel>
                    <div className="mt-1.5">
                      <DetailPlainText>
                        {formatJobSearchWalkInTimeRange(
                          job.walkInStartTime,
                          job.walkInEndTime,
                        )}
                      </DetailPlainText>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {job.interviewInstructions?.trim() ? (
            <section className="py-5">
              <DetailSectionHeading>Other Instructions</DetailSectionHeading>
              <div className="mt-3">
                <DetailMultilineText text={job.interviewInstructions} />
              </div>
            </section>
          ) : null}

          {job.contactPersonName || job.applyWhatsAppNumber ? (
            <section className="py-5">
              <DetailSectionHeading>Recruiter</DetailSectionHeading>
              <div className="mt-3 space-y-1">
                {job.contactPersonName ? (
                  <DetailPlainText>{job.contactPersonName}</DetailPlainText>
                ) : null}
                {job.applyWhatsAppNumber ? (
                  <DetailPlainText>
                    WhatsApp: {job.applyWhatsAppNumber}
                  </DetailPlainText>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-[#EEEEEE] pt-5">
          {canApply ? (
            <button
              type="button"
              onClick={handleApplyClick}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:flex-none"
            >
              <Send className="size-4" strokeWidth={2.25} aria-hidden="true" />
              Apply Now
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <Share2 className="size-4" aria-hidden="true" />
            Share Job
          </button>
          <button
            type="button"
            onClick={onToggleBookmark}
            aria-pressed={bookmarked}
            className={cn(
              "inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              bookmarked
                ? "border-primary bg-primary-light text-primary"
                : "border-border text-foreground hover:border-primary/40",
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
