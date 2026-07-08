import type { PopularJob } from "@/types/jobs-discovery";
import { cn } from "@/utils/cn";
import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type JobCardProps = {
  job: PopularJob;
};

export function JobCard({ job }: JobCardProps) {
  return (
    <Link
      href={job.href}
      className="group flex h-full min-w-0 flex-col rounded-xl border border-border-subtle bg-surface p-4 shadow-sm transition-[border-color,box-shadow] hover:border-primary/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div
        className={cn(
          "relative mb-3 size-10 shrink-0 overflow-hidden rounded-lg",
          job.companyLogo ? "bg-surface" : "bg-hero-glow",
        )}
      >
        {job.companyLogo ? (
          <Image
            src={job.companyLogo}
            alt={`${job.companyName} logo`}
            fill
            sizes="40px"
            className="object-contain object-center p-1"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs font-bold text-foreground">
              {job.companyInitials}
            </span>
          </div>
        )}
      </div>

      <h3 className="text-base font-bold leading-tight text-foreground">
        {job.title}
      </h3>

      <p className="mt-1 text-sm font-semibold text-primary">
        {job.companyName}
      </p>

      <div className="mt-2 flex items-center gap-1 text-sm text-muted">
        <MapPin
          className="size-3.5 shrink-0"
          strokeWidth={2}
          aria-hidden="true"
        />
        <span>{job.location}</span>
      </div>

      <p className="mt-2 text-sm font-bold text-foreground">
        {job.salaryMin} - {job.salaryMax}{" "}
        <span className="font-normal text-muted">/{job.salaryPeriod}</span>
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {job.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary"
          >
            {tag}
          </span>
        ))}
      </div>

      <p className="mt-auto pt-3 text-xs text-muted">{job.postedAt}</p>
    </Link>
  );
}
