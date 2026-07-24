"use client";

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
import { canApplyViaWhatsApp } from "@/utils/job-search-whatsapp";
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
import type { MouseEvent, ReactNode } from "react";
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
  const canApply = canApplyViaWhatsApp(job.applyWhatsAppNumber);

  const handleViewDetailsClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onSelect();
  };

  const handleBookmarkClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggleBookmark();
  };

  const handleApplyClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    protectedApply({
      applyWhatsAppNumber: job.applyWhatsAppNumber,
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      jobId: job.jobId,
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
      className={cn(
        "cursor-pointer rounded-[20px] border border-[#E8ECF0] bg-surface p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] transition-all duration-200 sm:p-5",
        selected
          ? "border-primary/50 bg-primary/[0.03] shadow-[0_4px_16px_rgba(14,133,133,0.1)]"
          : "hover:border-[#D5DBE3] hover:shadow-[0_4px_18px_rgba(15,23,42,0.07)]",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-primary-light text-[14px] font-semibold tracking-wide text-primary"
          aria-hidden="true"
        >
          {getCompanyInitials(job.companyName)}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="text-[16px] leading-snug font-semibold text-[#1F2937]">
                  {job.jobTitle}
                </h3>
                <span className="inline-flex items-center gap-1 text-[12px] leading-none font-medium text-[#0F8A4B]">
                  <ShieldCheck
                    className="size-3.5"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  Verified
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-snug font-normal text-[#6B7280]">
                {job.companyName}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2.5 pt-0.5">
              {posted ? (
                <span className="text-[12px] leading-none font-normal text-[#9CA3AF]">
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
              className="inline-flex h-6 items-center gap-1 rounded-full bg-brand-accent/8 px-2 text-[11px] leading-none font-medium text-black"
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
            className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-xl border border-[#E5E7EB] bg-surface px-4 text-[13px] font-medium text-primary transition-colors hover:border-primary/35 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            View Details
            <ChevronRight
              className="size-3.5"
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
          {canApply ? (
            <button
              type="button"
              onClick={handleApplyClick}
              className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-xl bg-primary-soft px-4 text-[13px] font-medium text-white transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft/40"
            >
              Apply Now
              <ChevronRight
                className="size-3.5"
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
          ) : (
            <span className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-muted/40 px-4 text-[13px] font-medium text-muted">
              Apply unavailable
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
