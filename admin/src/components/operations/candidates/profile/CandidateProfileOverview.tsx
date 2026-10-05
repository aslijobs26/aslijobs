import {
  Briefcase,
  CheckCircle2,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import type {
  OperationsCandidateApplicationItem,
  OperationsCandidateDetail,
} from "../../../../types/operations-candidates";
import { cn } from "../../../../utils/cn";
import { OperationsBadge } from "../../../ui/OperationsBadge";
import {
  formatCandidateDateTimeFull,
  formatCandidateGender,
  profileStatusBadgeVariant,
} from "../candidates-format";
import { CandidateApplicationsTable } from "./CandidateApplicationsTable";

interface CandidateProfileOverviewProps {
  detail: OperationsCandidateDetail;
  applications: OperationsCandidateApplicationItem[];
  applicationsTotal: number;
  onViewAllApplications: () => void;
}

function OverviewKpi({
  label,
  value,
  caption,
  icon: Icon,
  iconWrap,
  iconColor,
}: {
  label: string;
  value: string;
  caption: string;
  icon: LucideIcon;
  iconWrap: string;
  iconColor: string;
}) {
  return (
    <article className="rounded-lg border border-border-subtle bg-surface px-2.5 py-2 shadow-sm max-sm:px-2 max-sm:py-1.5 sm:px-3 sm:py-3">
      <div className="flex items-start justify-between gap-1.5 sm:gap-2">
        <div className="min-w-0">
          <p className="truncate text-[9px] text-muted max-sm:text-[8px] sm:text-[10px]">
            {label}
          </p>
          <p className="mt-0.5 truncate text-[13px] font-bold leading-snug text-foreground max-sm:text-[12px] sm:mt-1 sm:text-lg">
            {value}
          </p>
          <p className="mt-0.5 truncate text-[9px] text-muted max-sm:text-[8px] sm:mt-1 sm:text-[10px]">
            {caption}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-md max-sm:size-6 sm:size-9",
            iconWrap,
          )}
        >
          <Icon
            className={cn("size-3.5 max-sm:size-3 sm:size-4", iconColor)}
            aria-hidden="true"
          />
        </span>
      </div>
    </article>
  );
}

function ChipList({ values }: { values: string[] }) {
  if (!values.length) {
    return (
      <p className="text-[11px] text-muted max-sm:text-[10px] sm:text-xs">—</p>
    );
  }
  return (
    <div className="flex flex-wrap gap-1 max-sm:gap-1 sm:gap-1.5">
      {values.map((value) => (
        <span
          key={value}
          className="inline-flex max-w-full truncate rounded-md bg-primary-light/70 px-1.5 py-0.5 text-[10px] font-medium text-primary max-sm:text-[9px] sm:px-2 sm:text-[11px]"
        >
          {value}
        </span>
      ))}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 space-y-1 max-sm:space-y-0.5">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-muted max-sm:text-[8px] sm:text-[10px]">
        {label}
      </p>
      <p className="break-words text-[11px] font-medium leading-snug text-foreground max-sm:text-[10px] sm:text-xs">
        {value || "—"}
      </p>
    </div>
  );
}

function SectionCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border-subtle bg-surface p-3 shadow-sm max-sm:p-2.5 sm:p-4",
        className,
      )}
    >
      <h3 className="text-[13px] font-semibold text-foreground max-sm:text-[12px] sm:text-sm">
        {title}
      </h3>
      {children}
    </section>
  );
}

function formatSalary(
  amount: number | null | undefined,
  period?: string,
): string {
  if (amount == null) {
    return "—";
  }
  const formatted = amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
  return `${formatted} ${period === "per-year" ? "per year" : "per month"}`;
}

export function CandidateProfileOverview({
  detail,
  applications,
  applicationsTotal,
  onViewAllApplications,
}: CandidateProfileOverviewProps) {
  const educationTitle = detail.education
    ? [
        detail.education.levelLabel,
        detail.education.stream || detail.education.degree,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
  const educationMeta = detail.education
    ? [
        detail.education.board ||
          detail.education.schoolName ||
          detail.education.collegeName ||
          detail.education.instituteName,
        detail.education.passingYear,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <div className="flex flex-col gap-2.5 max-sm:gap-2 sm:gap-3">
      <div className="grid grid-cols-2 gap-1.5 max-sm:gap-1.5 sm:gap-2 lg:grid-cols-4">
        <OverviewKpi
          label="Experience"
          value={detail.candidateExperienceLabel || "Not specified"}
          caption={
            detail.candidateExperienceLabel?.toLowerCase().includes("fresher")
              ? "0 Years"
              : "Work history"
          }
          icon={Briefcase}
          iconWrap="bg-chart-accent/10"
          iconColor="text-chart-accent"
        />
        <OverviewKpi
          label="Applications"
          value={String(detail.applicationCount ?? 0)}
          caption="Total Applied"
          icon={Users}
          iconWrap="bg-chart-accent-alt/10"
          iconColor="text-chart-accent-alt"
        />
        <OverviewKpi
          label="Shortlisted"
          value={String(detail.shortlistedCount ?? 0)}
          caption="Application status count"
          icon={Star}
          iconWrap="bg-warning/10"
          iconColor="text-warning"
        />
        <OverviewKpi
          label="Registration"
          value={detail.profileStatusLabel || "Incomplete"}
          caption={
            detail.profileStatus === "complete"
              ? "Registration flow finished"
              : "Registration still incomplete"
          }
          icon={CheckCircle2}
          iconWrap="bg-success/10"
          iconColor="text-success"
        />
      </div>

      <div className="grid gap-2.5 max-sm:gap-2 sm:gap-3 lg:grid-cols-3">
        <SectionCard title="About Candidate" className="lg:col-span-2">
          <p className="mt-2 text-[11px] leading-relaxed text-muted max-sm:mt-1.5 max-sm:text-[10px] sm:text-xs">
            {detail.professionalSummary ||
              detail.candidateHeadline ||
              "No summary available for this candidate."}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3.5 border-t border-border-subtle/80 pt-3.5 max-sm:mt-3 max-sm:gap-x-3 max-sm:gap-y-3 max-sm:pt-3 sm:mt-4 sm:gap-x-4 sm:gap-y-3.5 sm:pt-4">
            <DetailField
              label="Date of Birth"
              value={
                detail.dateOfBirth
                  ? formatCandidateDateTimeFull(detail.dateOfBirth).split(
                      ",",
                    )[0] ?? "—"
                  : "—"
              }
            />
            <DetailField
              label="Current Location"
              value={
                [detail.candidateCity, detail.candidateState]
                  .filter(Boolean)
                  .join(", ") ||
                detail.candidateLocation ||
                "—"
              }
            />
            <DetailField
              label="Gender"
              value={formatCandidateGender(detail.candidateGender)}
            />
            <DetailField
              label="Availability"
              value={detail.availabilityLabel || detail.availabilityStatus}
            />
            <DetailField
              label="Languages Known"
              value={detail.languages.join(", ")}
            />
            <DetailField label="Preferred Work Mode" value={detail.workMode} />
          </div>
        </SectionCard>

        <div className="flex flex-col gap-2.5 max-sm:gap-2 sm:gap-3">
          <SectionCard title="Skills">
            <div className="mt-2 sm:mt-3">
              <ChipList values={detail.skills} />
            </div>
          </SectionCard>
          <SectionCard title="Education">
            {detail.education ? (
              <div className="mt-2 sm:mt-3">
                <p className="text-[11px] font-semibold text-foreground max-sm:text-[10px] sm:text-xs">
                  {educationTitle || "Education"}
                </p>
                <p className="mt-0.5 text-[10px] text-muted max-sm:text-[9px] sm:mt-1 sm:text-[11px]">
                  {educationMeta || "—"}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-muted max-sm:text-[10px] sm:mt-3 sm:text-xs">
                No education details.
              </p>
            )}
          </SectionCard>
        </div>
      </div>

      <div className="grid gap-2.5 max-sm:gap-2 sm:gap-3 lg:grid-cols-3">
        <SectionCard
          title="Job Preferences / Interests"
          className="lg:col-span-2"
        >
          <div className="mt-2 space-y-3 max-sm:mt-1.5 max-sm:space-y-2.5 sm:mt-3 sm:space-y-3.5">
            <div>
              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-muted max-sm:mb-1 max-sm:text-[8px] sm:text-[10px]">
                Positions interested in
              </p>
              <ChipList values={detail.preferredRoles} />
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-3 border-t border-border-subtle/80 pt-3 max-sm:gap-x-3 max-sm:gap-y-3 max-sm:pt-2.5 sm:gap-x-4 sm:gap-y-3.5 sm:pt-4">
              <div className="min-w-0">
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-muted max-sm:mb-1 max-sm:text-[8px] sm:text-[10px]">
                  Preferred Locations
                </p>
                <ChipList values={detail.preferredLocations} />
              </div>
              <DetailField
                label="Preferred Salary Range"
                value={formatSalary(
                  detail.expectedSalary,
                  detail.expectedSalaryPeriod,
                )}
              />
              <DetailField label="Preferred Work Type" value={detail.jobType} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Expected Details">
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-border-subtle/80 pt-3 max-sm:mt-1.5 max-sm:gap-x-3 max-sm:gap-y-3 max-sm:pt-2.5 sm:mt-3 sm:grid-cols-1 sm:gap-3 sm:border-0 sm:pt-0">
            <DetailField
              label="Expected Salary"
              value={formatSalary(
                detail.expectedSalary,
                detail.expectedSalaryPeriod,
              )}
            />
            <div className="min-w-0 space-y-1 max-sm:space-y-0.5">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted max-sm:text-[8px] sm:text-[10px]">
                Registration Status
              </p>
              <div className="sm:mt-0.5">
                <OperationsBadge
                  variant={profileStatusBadgeVariant(detail.profileStatus)}
                  className="px-1.5 py-0 text-[9px] max-sm:text-[8px] sm:text-[11px] sm:px-2 sm:py-0.5"
                >
                  {detail.profileStatusLabel}
                </OperationsBadge>
              </div>
              <p className="text-[9px] leading-snug text-muted max-sm:text-[8px] sm:mt-1 sm:text-[10px]">
                Completeness score: {detail.profileCompletionPercent ?? 0}%
                (field fill)
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <section className="rounded-xl border border-border-subtle bg-surface shadow-sm">
        <div className="border-b border-border-subtle px-3 py-2 max-sm:px-2.5 max-sm:py-1.5 sm:px-4 sm:py-3">
          <h3 className="text-[13px] font-semibold text-foreground max-sm:text-[12px] sm:text-sm">
            All Applications ({applicationsTotal.toLocaleString("en-IN")})
          </h3>
        </div>
        <CandidateApplicationsTable
          applications={applications}
          isLoading={false}
          isError={false}
        />
        {applicationsTotal > applications.length ? (
          <div className="border-t border-border-subtle px-3 py-2 text-center max-sm:px-2.5 max-sm:py-1.5 sm:px-4 sm:py-3">
            <button
              type="button"
              onClick={onViewAllApplications}
              className="text-[11px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 max-sm:text-[10px] sm:text-xs"
            >
              View all applications →
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
