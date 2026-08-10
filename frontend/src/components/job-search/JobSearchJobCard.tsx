"use client";

import { JobApplyButton } from "@/components/jobs/JobApplyButton";
import { protectedApply } from "@/utils/job-apply-auth";
import { cn } from "@/utils/cn";
import {
  formatJobSearchEducation,
  formatJobSearchExperience,
  formatJobSearchJobType,
  formatJobSearchLocationCompact,
  formatJobSearchPerk,
  formatJobSearchRelativeTime,
  formatJobSearchSalary,
  getCompanyInitials,
} from "@/utils/job-search-format";
import {
  Bookmark,
  Briefcase,
  ChevronRight,
  Fuel,
  GraduationCap,
  IndianRupee,
  MapPin,
  Plane,
  ShieldCheck,
  User,
} from "lucide-react";
import { useState, type MouseEvent, type ReactNode } from "react";
import type { PublicJobListItem } from "@/services/public-jobs.service";

type JobSearchJobCardProps = {
  job: PublicJobListItem;
  selected: boolean;
  bookmarked: boolean;
  onSelect: () => void;
  onToggleBookmark: () => void;
};

type CardTag = {
  id: string;
  label: string;
  icon: ReactNode;
};

function buildCardTags(job: PublicJobListItem): CardTag[] {
  const tags: CardTag[] = [];

  for (const education of job.education) {
    const label = formatJobSearchEducation(education);
    if (!label) continue;
    tags.push({
      id: `education-${education}`,
      label,
      icon: (
        <GraduationCap
          className="size-3 shrink-0"
          strokeWidth={2}
          aria-hidden="true"
        />
      ),
    });
  }

  if (job.experience === "fresher") {
    tags.push({
      id: "fresher-apply",
      label: "Freshers can apply",
      icon: (
        <User className="size-3 shrink-0" strokeWidth={2} aria-hidden="true" />
      ),
    });
  }

  for (const perk of job.perks.slice(0, 1)) {
    const label = formatJobSearchPerk(perk);
    if (!label) continue;

    const icon =
      perk === "travel_allowance" ? (
        <Plane className="size-3 shrink-0" strokeWidth={2} aria-hidden="true" />
      ) : perk === "petrol_allowance" ? (
        <Fuel className="size-3 shrink-0" strokeWidth={2} aria-hidden="true" />
      ) : (
        <Briefcase
          className="size-3 shrink-0"
          strokeWidth={2}
          aria-hidden="true"
        />
      );

    tags.push({
      id: `perk-${perk}`,
      label,
      icon,
    });
  }

  return tags;
}

export function JobSearchJobCard({
  job,
  selected,
  bookmarked,
  onSelect,
  onToggleBookmark,
}: JobSearchJobCardProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [appliedLocally, setAppliedLocally] = useState(false);
  const isApplied = appliedLocally || job.isApplied === true;
  const location = formatJobSearchLocationCompact(
    job.cityName,
    job.stateName,
    job.city,
    job.state,
  );
  const salary = formatJobSearchSalary(job)
    .replaceAll("₹", "")
    .replace(" /month", "/mo")
    .replace(" /year", "/yr");
  const experience = formatJobSearchExperience(job.experience);
  const jobType = formatJobSearchJobType(job.jobType);
  const tags = buildCardTags(job);
  const posted = formatJobSearchRelativeTime(job.publishedAt ?? job.createdAt);

  const handleViewDetailsClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onSelect();
  };

  const handleBookmarkClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggleBookmark();
  };

  const handleApplyClick = () => {
    if (isApplying || isApplied) {
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

  const metaItems = [
    {
      id: "location",
      icon: (
        <MapPin className="size-3 shrink-0" strokeWidth={2} aria-hidden="true" />
      ),
      label: location,
    },
    {
      id: "salary",
      icon: (
        <IndianRupee
          className="size-3 shrink-0"
          strokeWidth={2}
          aria-hidden="true"
        />
      ),
      label: salary,
    },
    {
      id: "type",
      icon: (
        <Briefcase
          className="size-3 shrink-0"
          strokeWidth={2}
          aria-hidden="true"
        />
      ),
      label: jobType,
    },
    {
      id: "experience",
      icon: (
        <User className="size-3 shrink-0" strokeWidth={2} aria-hidden="true" />
      ),
      label: experience,
    },
  ].filter((item) => Boolean(item.label));

  return (
    <article
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-[20px] border p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] transition-all duration-200 sm:p-5",
        selected
          ? "border-primary-soft/60 bg-job-card-selected-surface shadow-[0_6px_20px_rgba(0,186,165,0.16)]"
          : "border-[#E8ECF0] bg-surface hover:border-primary/20 hover:shadow-[0_10px_28px_rgba(15,23,42,0.12)] motion-safe:hover:-translate-y-0.5",
      )}
    >
      {selected ? (
        <span
          className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary-soft to-brand-accent"
          aria-hidden="true"
        />
      ) : null}

      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-primary-light text-[12px] font-semibold tracking-wide text-primary sm:size-11 sm:text-[14px]"
          aria-hidden="true"
        >
          {getCompanyInitials(job.companyName)}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="text-sm leading-snug font-semibold text-[#1F2937] sm:text-[16px]">
                  {job.jobTitle}
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] leading-none font-medium text-[#0F8A4B] sm:text-[12px]">
                  <ShieldCheck
                    className="size-3.5"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  Verified
                </span>
              </div>
              <p className="mt-1 text-xs leading-snug font-normal text-[#6B7280] sm:text-[13px]">
                {job.companyName}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2.5 pt-0.5">
              {posted ? (
                <span className="text-[11px] leading-none font-normal text-[#9CA3AF] sm:text-[12px]">
                  {posted}
                </span>
              ) : null}
              <button
                type="button"
                onClick={handleBookmarkClick}
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
          </div>
        </div>
      </div>

      {/* Meta row */}
      {metaItems.length > 0 ? (
        <ul className="mt-3.5 flex min-w-0 items-center sm:mt-4">
          {metaItems.map((item, index) => (
            <li
              key={item.id}
              className="flex min-w-0 flex-1 items-center text-[11px] leading-tight font-normal text-[#4B5563] sm:text-[12px]"
            >
              {index > 0 ? (
                <span
                  className="mx-1.5 h-3 w-px shrink-0 bg-[#E5E7EB] sm:mx-2"
                  aria-hidden="true"
                />
              ) : null}
              <span className="inline-flex min-w-0 items-center gap-1 overflow-hidden">
                <span className="shrink-0 text-[#9CA3AF]">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Tags */}
      {tags.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-x-2 gap-y-1.5">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="inline-flex h-6 items-center gap-1 rounded-full bg-brand-accent/8 px-2 text-[10px] leading-none font-medium text-black sm:text-[11px]"
            >
              {tag.icon}
              {tag.label}
            </li>
          ))}
        </ul>
      ) : null}

      {/* Actions */}
      <div className="mt-4 border-t border-[#EEF1F4] pt-3.5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
          <button
            type="button"
            onClick={handleViewDetailsClick}
            className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-xl border border-[#E5E7EB] bg-surface px-4 text-xs font-medium text-primary transition-colors hover:border-primary/35 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-[13px]"
          >
            View Details
            <ChevronRight
              className="size-3.5"
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
          <div
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <JobApplyButton
              isApplied={isApplied}
              isApplying={isApplying}
              onClick={handleApplyClick}
              className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-xl bg-primary-soft px-4 text-xs font-medium text-white transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft/40 sm:text-[13px]"
              appliedClassName="h-9 w-full text-xs font-medium sm:text-[13px]"
              endIcon={
                <ChevronRight
                  className="size-3.5"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              }
            />
          </div>
        </div>
      </div>
    </article>
  );
}
