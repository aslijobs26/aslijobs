import {
  Briefcase,
  CheckCircle2,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import type {
  OperationsCandidateApplicationItem,
  OperationsCandidateDetail,
} from "../../../../types/operations-candidates";
import { cn } from "../../../../utils/cn";
import { OperationsBadge } from "../../../ui/OperationsBadge";
import {
  formatCandidateDateTimeFull,
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
    <article className="rounded-lg border border-border-subtle bg-surface px-3 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] text-muted">{label}</p>
          <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
          <p className="mt-1 text-[10px] text-muted">{caption}</p>
        </div>
        <span
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-md",
            iconWrap,
          )}
        >
          <Icon className={cn("size-4", iconColor)} aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

function ChipList({ values }: { values: string[] }) {
  if (!values.length) {
    return <p className="text-xs text-muted">—</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <span
          key={value}
          className="inline-flex rounded-md bg-primary-light/70 px-2 py-0.5 text-[11px] font-medium text-primary"
        >
          {value}
        </span>
      ))}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-xs font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

function formatSalary(
  amount: number | null,
  period: string,
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
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
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
          caption="By Employers"
          icon={Star}
          iconWrap="bg-warning/10"
          iconColor="text-warning"
        />
        <OverviewKpi
          label="Profile Status"
          value={detail.profileStatusLabel || "Incomplete"}
          caption={
            detail.profileStatus === "complete" ? "All good" : "Needs attention"
          }
          icon={CheckCircle2}
          iconWrap="bg-success/10"
          iconColor="text-success"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground">
            About Candidate
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {detail.professionalSummary ||
              detail.candidateHeadline ||
              "No summary available for this candidate."}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <DetailField
              label="Date of Birth"
              value={
                detail.dateOfBirth
                  ? formatCandidateDateTimeFull(detail.dateOfBirth).split(",")[0] ??
                    "—"
                  : "—"
              }
            />
            <DetailField
              label="Current Location"
              value={
                [detail.candidateCity, detail.candidateState]
                  .filter(Boolean)
                  .join(", ") || detail.candidateLocation
              }
            />
            <DetailField
              label="Gender"
              value={
                detail.candidateGender
                  ? detail.candidateGender.replaceAll("_", " ")
                  : ""
              }
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
        </section>

        <div className="flex flex-col gap-3">
          <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Skills</h3>
            <div className="mt-3">
              <ChipList values={detail.skills} />
            </div>
          </section>
          <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Education</h3>
            {detail.education ? (
              <div className="mt-3">
                <p className="text-xs font-semibold text-foreground">
                  {educationTitle || "Education"}
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  {educationMeta || "—"}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted">No education details.</p>
            )}
          </section>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground">
            Job Preferences / Interests
          </h3>
          <div className="mt-3 space-y-3">
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                Positions interested in
              </p>
              <ChipList values={detail.preferredRoles} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
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
              <DetailField
                label="Willing to Travel"
                value={detail.willingToTravel ?? ""}
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">
            Expected Details
          </h3>
          <div className="mt-3 space-y-3">
            <DetailField
              label="Expected Salary"
              value={formatSalary(
                detail.expectedSalary,
                detail.expectedSalaryPeriod,
              )}
            />
            <DetailField
              label="Willing to Relocate"
              value={detail.willingToRelocate ?? ""}
            />
            <DetailField
              label="Work Shift Preference"
              value={detail.workShiftPreference ?? ""}
            />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Profile Status
              </p>
              <div className="mt-1.5">
                <OperationsBadge
                  variant={profileStatusBadgeVariant(detail.profileStatus)}
                >
                  {detail.profileStatusLabel}
                </OperationsBadge>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border-subtle bg-surface shadow-sm">
        <div className="border-b border-border-subtle px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            All Applications ({applicationsTotal.toLocaleString("en-IN")})
          </h3>
        </div>
        <CandidateApplicationsTable
          applications={applications}
          isLoading={false}
          isError={false}
        />
        {applicationsTotal > applications.length ? (
          <div className="border-t border-border-subtle px-4 py-3 text-center">
            <button
              type="button"
              onClick={onViewAllApplications}
              className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              View all applications →
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
