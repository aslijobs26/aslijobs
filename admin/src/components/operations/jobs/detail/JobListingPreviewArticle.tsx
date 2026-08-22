import { BadgeCheck, Briefcase, MapPin } from "lucide-react";
import type { ReactNode } from "react";

import type { OperationsJobDetail } from "../../../../types/operations-jobs";
import { perkLabel } from "../../../../utils/map-operations-post-job-preview";
import { cn } from "../../../../utils/cn";
import { EmployerLogo } from "../../../ui/EmployerLogo";
import { OperationsBadge } from "../../../ui/OperationsBadge";
import {
  descriptionParagraphs,
  formatWalkInDateRange,
  formatWalkInTimeRange,
  jobDetailStatusTone,
} from "./job-detail-format";

interface JobListingPreviewArticleProps {
  job: OperationsJobDetail;
  className?: string;
  emptyDescriptionMessage?: string;
}

function PreviewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-4 border-t border-border-subtle pt-4">
      <h4 className="text-xs font-semibold text-foreground">{title}</h4>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function WalkInField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium tracking-[0.04em] text-muted uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted">{value}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface p-2.5 ring-1 ring-border-subtle">
      <p className="text-[10px] text-muted">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function JobListingPreviewArticle({
  job,
  className,
  emptyDescriptionMessage = "No description available.",
}: JobListingPreviewArticleProps) {
  const paragraphs = descriptionParagraphs(job.description);
  const showVerified =
    job.employer.isWhatsappVerified || job.employer.registrationCompleted;

  const hasAddress = Boolean(
    job.address.trim() || job.locationLabel.trim() || job.landmark.trim(),
  );
  const walkInDate = formatWalkInDateRange(job.walkInStartDate, job.walkInEndDate);
  const walkInTime = formatWalkInTimeRange(job.walkInStartTime, job.walkInEndTime);
  const hasWalkIn = job.walkInEnabled;
  const hasRecruiter = Boolean(
    job.contactPersonName.trim() || job.contactMobile.trim(),
  );

  const salaryDisplay = job.salaryLabel.trim() || "—";
  const openingsDisplay =
    job.vacancies && job.vacancies > 0 ? String(job.vacancies) : "—";

  return (
    <article
      className={cn(
        "rounded-xl border border-border-subtle bg-hero-bg/40 p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <EmployerLogo
          name={job.employer.companyName}
          logoUrl={job.employer.logoUrl}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">
              {job.jobTitle.trim() || "Job Title"}
            </h3>
            <OperationsBadge variant={jobDetailStatusTone(job.status)}>
              {job.statusLabel}
            </OperationsBadge>
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm font-medium text-foreground">
            {job.employer.companyName || "Employer not assigned"}
            {showVerified ? (
              <BadgeCheck
                className="size-3.5 text-chart-accent"
                aria-hidden="true"
              />
            ) : null}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{job.locationLabel.trim() || "—"}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Briefcase className="size-3.5 shrink-0" aria-hidden="true" />
              {job.jobTypeLabel.trim() || "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Experience" value={job.experienceLabel.trim() || "—"} />
        <StatCard label="Salary" value={salaryDisplay} />
        <StatCard label="Education" value={job.educationLabel.trim() || "—"} />
        <StatCard label="Openings" value={openingsDisplay} />
      </div>

      <div className="mt-4">
        <h4 className="text-xs font-semibold text-foreground">About the role</h4>
        {paragraphs.length > 0 ? (
          <div className="mt-2 space-y-2 text-xs leading-relaxed text-muted">
            {paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted">{emptyDescriptionMessage}</p>
        )}
      </div>

      {hasAddress ? (
        <PreviewSection title="Address">
          <div className="space-y-1 text-xs leading-relaxed text-muted">
            {job.address.trim() ? <p>{job.address}</p> : null}
            {job.locationLabel.trim() ? <p>{job.locationLabel}</p> : null}
            {job.landmark.trim() ? <p>Landmark: {job.landmark}</p> : null}
          </div>
        </PreviewSection>
      ) : null}

      {hasWalkIn ? (
        <PreviewSection title="Walk-in Details">
          <div className="space-y-2.5">
            <WalkInField
              label="Interview Address"
              value={
                job.interviewAddress.trim() ||
                job.locationLabel.trim() ||
                "Address shared by recruiter"
              }
            />
            {walkInDate ? <WalkInField label="Date" value={walkInDate} /> : null}
            {walkInTime ? <WalkInField label="Time" value={walkInTime} /> : null}
          </div>
        </PreviewSection>
      ) : null}

      {hasRecruiter ? (
        <PreviewSection title="Recruiter">
          <div className="space-y-0.5 text-xs leading-relaxed text-muted">
            {job.contactPersonName.trim() ? (
              <p>{job.contactPersonName}</p>
            ) : null}
            {job.contactMobile.trim() ? (
              <p>WhatsApp: {job.contactMobile}</p>
            ) : null}
          </div>
        </PreviewSection>
      ) : null}

      {job.perks.length > 0 ? (
        <PreviewSection title="Perks">
          <div className="flex flex-wrap gap-1.5">
            {job.perks.map((perk) => (
              <span
                key={perk}
                className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground ring-1 ring-border-subtle"
              >
                {perkLabel(perk)}
              </span>
            ))}
          </div>
        </PreviewSection>
      ) : null}
    </article>
  );
}
