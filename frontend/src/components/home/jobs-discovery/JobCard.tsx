import type { PopularJob } from "@/types/jobs-discovery";
import { cn } from "@/utils/cn";
import { ChevronRight, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type JobCardProps = {
  job: PopularJob;
};

export function JobCard({ job }: JobCardProps) {
  return (
    <Link
      href={job.href}
      className={cn(
        "group relative flex h-full min-w-0 rounded-xl border border-border-subtle bg-surface shadow-sm transition-[border-color,box-shadow,transform] hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        /* Mobile: compact horizontal job row */
        "flex-row items-stretch gap-2.5 p-2.5",
        /* sm+: restore stacked discovery card */
        "sm:flex-col sm:gap-0 sm:p-4",
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-lg",
          job.companyLogo
            ? (job.companyLogoBadgeClassName ??
              (job.companyLogoBleed ? "bg-black" : "bg-hero-bg"))
            : "bg-primary-light",
          "size-11 sm:mb-3 sm:size-10 sm:rounded-lg",
        )}
      >
        {job.companyLogo ? (
          <Image
            src={job.companyLogo}
            alt={`${job.companyName} logo`}
            fill
            sizes="(max-width: 639px) 48px, 40px"
            className={cn(
              "object-center",
              job.companyLogoImageClassName ??
                (job.companyLogoBleed
                  ? "object-cover"
                  : "object-contain p-1 sm:p-1"),
            )}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-[0.6875rem] font-bold text-primary sm:text-xs sm:text-foreground">
              {job.companyInitials}
            </span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-xs font-bold leading-tight text-foreground sm:whitespace-normal sm:text-base">
              {job.title}
            </h3>
            <p className="mt-0.5 truncate text-[0.6875rem] font-semibold text-primary sm:mt-1 sm:text-sm">
              {job.companyName}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-0.5 pt-0.5 sm:hidden">
            <span className="whitespace-nowrap text-[0.625rem] text-muted">
              {job.postedAt}
            </span>
            <ChevronRight
              className="size-3.5 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
              strokeWidth={2}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="mt-1 flex min-w-0 items-center gap-1 text-[0.6875rem] text-muted sm:mt-2 sm:text-sm">
          <MapPin
            className="size-3 shrink-0"
            strokeWidth={2}
            aria-hidden="true"
          />
          <span className="truncate">{job.location}</span>
        </div>

        <p className="mt-1 text-xs font-bold leading-snug text-foreground sm:mt-2 sm:text-sm">
          {job.salaryMin} - {job.salaryMax}{" "}
          <span className="font-normal text-muted">/{job.salaryPeriod}</span>
        </p>

        <div className="mt-1.5 flex flex-wrap gap-1 sm:mt-3 sm:gap-2">
          {job.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-primary-light px-1.5 py-0.5 text-[0.625rem] font-medium text-primary sm:rounded-full sm:px-2.5 sm:text-xs"
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="mt-auto hidden pt-3 text-xs text-muted sm:block">
          {job.postedAt}
        </p>
      </div>
    </Link>
  );
}
