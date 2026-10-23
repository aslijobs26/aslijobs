import {
  Banknote,
  Briefcase,
  Eye,
  GraduationCap,
  MessageCircle,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { OperationsBadge } from "../../../ui/OperationsBadge";
import { OperationsCard } from "../../../ui/OperationsCard";
import { JobDescriptionContent } from "../../../ui/JobDescriptionContent";
import type { OperationsJobDetail } from "../../../../types/operations-jobs";
import { cn } from "../../../../utils/cn";
import { looksLikeJobDescriptionHtml } from "../../../../utils/job-description-html";
import {
  formatMetricCount,
  formatOperationsDate,
  jobDetailStatusTone,
  jobPostingInformationRows,
  parseJobDescription,
} from "./job-detail-format";

interface JobOverviewPanelProps {
  job: OperationsJobDetail;
  onCloseJob: () => void;
  isClosing?: boolean;
}

function InfoRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 max-sm:gap-2.5 max-sm:py-2 sm:gap-4 sm:py-2.5 xl:py-2">
      <dt className="shrink-0 text-[10px] text-muted max-sm:text-[10px] sm:text-[11px]">
        {label}
      </dt>
      <dd
        className={cn(
          "min-w-0 break-words text-right text-[11px] text-foreground max-sm:text-[11px] sm:text-xs",
          emphasize ? "font-semibold" : "font-medium",
        )}
      >
        {value || "—"}
      </dd>
    </div>
  );
}

function StatusInfoRow({
  label,
  statusLabel,
  status,
}: {
  label: string;
  statusLabel: string;
  status: OperationsJobDetail["status"];
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 max-sm:gap-2.5 max-sm:py-2 sm:gap-4 sm:py-2.5 xl:py-2">
      <dt className="shrink-0 text-[10px] text-muted max-sm:text-[10px] sm:text-[11px]">
        {label}
      </dt>
      <dd>
        <OperationsBadge
          variant={jobDetailStatusTone(status)}
          className={cn(
            "px-1.5 py-0 text-[9px] font-semibold sm:px-2 sm:py-0.5 sm:text-[10px]",
            status === "active" && "bg-success/10 text-success",
          )}
        >
          {statusLabel}
        </OperationsBadge>
      </dd>
    </div>
  );
}

function JobHighlightMetric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <article className="flex h-full min-h-[5.25rem] min-w-0 items-center gap-2 rounded-lg border border-border-subtle bg-surface px-2.5 py-2.5 shadow-sm transition-[border-color,background-color] duration-200 hover:border-primary/15 hover:bg-hero-bg/40 max-sm:min-h-[5.25rem] max-sm:rounded-lg max-sm:px-2.5 max-sm:py-2.5 sm:min-h-[7.25rem] sm:gap-3.5 sm:rounded-xl sm:px-3.5 sm:py-4.5 lg:min-h-[7.5rem] xl:gap-4 xl:px-4 xl:py-5">
      <span
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-lg max-sm:size-8 max-sm:rounded-lg sm:size-10 sm:rounded-xl xl:size-11",
          tone,
        )}
        aria-hidden="true"
      >
        <Icon className="size-3.5 max-sm:size-3.5 sm:size-[18px] xl:size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-medium uppercase tracking-[0.04em] text-muted max-sm:text-[9px] sm:text-[10px] xl:text-[11px]">
          {label}
        </p>
        <p
          className="mt-0.5 text-[11px] font-semibold leading-snug text-foreground max-sm:mt-0.5 max-sm:text-[11px] sm:mt-1 sm:text-[13px] xl:mt-1.5 xl:leading-tight"
          title={value || undefined}
        >
          {value || "—"}
        </p>
      </div>
    </article>
  );
}

function PerformanceMetric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <article className="rounded-lg border border-border-subtle bg-surface p-2 text-center max-sm:p-2 sm:p-3 xl:p-2.5">
      <span
        className={cn(
          "mx-auto inline-flex size-8 items-center justify-center rounded-lg max-sm:size-8 sm:size-9",
          tone,
        )}
      >
        <Icon className="size-3.5 sm:size-4" aria-hidden="true" />
      </span>
      <p className="mt-1.5 text-base font-bold leading-none tabular-nums text-foreground max-sm:mt-1.5 max-sm:text-base sm:mt-2 sm:text-lg">
        {value}
      </p>
      <p className="mt-0.5 text-[9px] leading-tight text-muted max-sm:text-[9px] sm:mt-1 sm:text-[10px]">
        {label}
      </p>
    </article>
  );
}

function DescriptionSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1.5 max-sm:space-y-1.5 sm:space-y-2">
      <h3 className="text-[11px] font-semibold text-foreground max-sm:text-[11px] sm:text-xs">
        {title}
      </h3>
      <ul className="list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-foreground max-sm:space-y-1 max-sm:text-[11px] sm:space-y-1.5 sm:text-xs">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const overviewCardBodyClassName = "p-2 max-sm:p-2 sm:p-3 xl:p-2";
const pairedOverviewCardClassName = "h-full w-full min-w-0";
const sideOverviewCardClassName = "h-auto w-full self-start";

export function JobOverviewPanel({
  job,
  onCloseJob,
  isClosing,
}: JobOverviewPanelProps) {
  const descriptionIsHtml = looksLikeJobDescriptionHtml(job.description);
  const parsedDescription = descriptionIsHtml
    ? { intro: [], responsibilities: [], requirements: [] }
    : parseJobDescription(job.description);
  const jobInformationRows = jobPostingInformationRows(job);
  const canClose =
    (job.status !== "closed" &&
      job.status !== "draft" &&
      job.status !== "pending_approval" &&
      job.status !== "rejected") ||
    (job.status === "closed" && !job.employerNotified && Boolean(job.closedReason));
  const daysRemaining =
    job.analytics.daysRemaining == null
      ? "—"
      : job.analytics.daysRemaining < 0
        ? "Expired"
        : `${job.analytics.daysRemaining} Days`;

  const hasStructuredDescription =
    !descriptionIsHtml &&
    (parsedDescription.intro.length > 0 ||
      parsedDescription.responsibilities.length > 0 ||
      parsedDescription.requirements.length > 0);

  return (
    <div className="grid grid-cols-1 gap-2 max-sm:gap-2 sm:gap-2.5 lg:grid-cols-12 xl:gap-2">
      <div className="grid grid-cols-1 gap-2 max-sm:gap-2 sm:gap-2.5 lg:col-span-9 lg:grid-cols-9 lg:items-stretch xl:gap-2">
        <OperationsCard
          title="Job Description"
          className={cn(
            pairedOverviewCardClassName,
            "order-1 lg:order-1 lg:col-span-5 lg:col-start-1 lg:row-start-1",
          )}
          bodyClassName={overviewCardBodyClassName}
        >
          {descriptionIsHtml ? (
            <JobDescriptionContent
              html={job.description}
              className="text-[11px] leading-relaxed text-foreground max-sm:text-[11px] sm:text-xs"
              emptyFallback="No description provided."
            />
          ) : hasStructuredDescription ? (
            <div className="space-y-3 text-[11px] leading-relaxed text-foreground max-sm:space-y-3 max-sm:text-[11px] sm:space-y-4 sm:text-xs">
              {parsedDescription.intro.length > 0 ? (
                <div className="space-y-2">
                  {parsedDescription.intro.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              ) : null}
              <DescriptionSection
                title="Key Responsibilities"
                items={parsedDescription.responsibilities}
              />
              <DescriptionSection
                title="Requirements"
                items={parsedDescription.requirements}
              />
            </div>
          ) : (
            <p className="text-[11px] leading-relaxed text-foreground max-sm:text-[11px] sm:text-xs">
              {job.description.trim() || "No description provided."}
            </p>
          )}        </OperationsCard>

        <OperationsCard
          title="Job Information"
          className={cn(
            pairedOverviewCardClassName,
            "order-3 lg:order-2 lg:col-span-4 lg:col-start-6 lg:row-start-1",
          )}
          bodyClassName={overviewCardBodyClassName}
        >
          <dl className="divide-y divide-border-subtle/80">
            {jobInformationRows.map((row) => (
              <InfoRow key={row.label} label={row.label} value={row.value} />
            ))}
          </dl>
        </OperationsCard>

        <div
          className={cn(
            "order-2 grid grid-cols-2 items-stretch gap-2 sm:gap-2.5",
            "lg:order-3 lg:col-span-9 lg:col-start-1 lg:row-start-2 lg:grid-cols-4 lg:gap-3",
          )}
          aria-label="Key job requirements"
        >
          <JobHighlightMetric
            label="Experience"
            value={job.experienceLabel}
            icon={Briefcase}
            tone="bg-primary-light text-primary"
          />
          <JobHighlightMetric
            label="Salary"
            value={job.salaryLabel}
            icon={Banknote}
            tone="bg-success/10 text-success"
          />
          <JobHighlightMetric
            label="Gender"
            value={job.genderLabel}
            icon={UserRound}
            tone="bg-chart-accent/10 text-chart-accent"
          />
          <JobHighlightMetric
            label="Education"
            value={job.educationLabel}
            icon={GraduationCap}
            tone="bg-chart-accent-alt/10 text-chart-accent-alt"
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-2 max-sm:gap-2 sm:gap-2.5 lg:col-span-3 xl:gap-2">
        <OperationsCard
          title="Job Status & Visibility"
          className={sideOverviewCardClassName}
          bodyClassName={overviewCardBodyClassName}
        >
          <dl className="divide-y divide-border-subtle/80">
            <StatusInfoRow
              label="Status"
              statusLabel={job.statusLabel}
              status={job.status}
            />
            <InfoRow label="Visibility" value={job.visibilityLabel} />
            <InfoRow
              label="Auto Expiry"
              value={formatOperationsDate(job.analytics.autoExpiryAt)}
              emphasize
            />
            <InfoRow label="Days Remaining" value={daysRemaining} emphasize />
          </dl>
          <button
            type="button"
            onClick={onCloseJob}
            disabled={!canClose || isClosing}
            className={cn(
              "mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg border text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 xl:mt-2 xl:h-8",
              canClose
                ? "border-primary-soft text-primary-soft hover:bg-success/5"
                : "cursor-not-allowed border-border-subtle text-muted",
            )}
          >
            {isClosing
              ? "Closing…"
              : job.status === "closed" && !job.employerNotified && job.closedReason
                ? "Send notification"
                : "Close Job"}
          </button>
        </OperationsCard>

        <OperationsCard
          title="Job Performance"
          className={sideOverviewCardClassName}
          bodyClassName={overviewCardBodyClassName}
        >
          <div className="grid grid-cols-2 gap-2 xl:gap-1.5">
            <PerformanceMetric
              label="Total Views"
              value={formatMetricCount(job.analytics.views)}
              icon={Eye}
              tone="bg-primary-light text-primary"
            />
            <PerformanceMetric
              label="Total Applications"
              value={formatMetricCount(job.analytics.applications)}
              icon={Users}
              tone="bg-primary-light text-primary"
            />
            <PerformanceMetric
              label="WhatsApp Shares"
              value={formatMetricCount(job.analytics.shares)}
              icon={MessageCircle}
              tone="bg-whatsapp/10 text-whatsapp"
            />
            <PerformanceMetric
              label="Today's Applications"
              value={formatMetricCount(job.analytics.applicationsToday)}
              icon={Users}
              tone="bg-success/10 text-success"
            />
          </div>
        </OperationsCard>
      </div>
    </div>
  );
}
