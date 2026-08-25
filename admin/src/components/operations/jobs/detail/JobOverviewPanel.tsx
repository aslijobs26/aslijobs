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
import type { OperationsJobDetail } from "../../../../types/operations-jobs";
import { cn } from "../../../../utils/cn";
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
    <div className="flex items-start justify-between gap-4 py-2.5 xl:py-2">
      <dt className="shrink-0 text-[11px] text-muted">{label}</dt>
      <dd
        className={cn(
          "min-w-0 break-words text-right text-xs text-foreground",
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
    <div className="flex items-center justify-between gap-4 py-2.5 xl:py-2">
      <dt className="shrink-0 text-[11px] text-muted">{label}</dt>
      <dd>
        <OperationsBadge
          variant={jobDetailStatusTone(status)}
          className={cn(
            "px-2 py-0.5 text-[10px] font-semibold",
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
    <article className="flex h-full min-h-[6.75rem] min-w-0 items-center gap-3 rounded-xl border border-border-subtle bg-surface px-3 py-4 shadow-sm transition-[border-color,background-color] duration-200 hover:border-primary/15 hover:bg-hero-bg/40 sm:min-h-[7.25rem] sm:gap-3.5 sm:px-3.5 sm:py-4.5 lg:min-h-[7.5rem] xl:gap-4 xl:px-4 xl:py-5">
      <span
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-xl xl:size-11",
          tone,
        )}
        aria-hidden="true"
      >
        <Icon className="size-[18px] xl:size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.04em] text-muted xl:text-[11px]">
          {label}
        </p>
        <p
          className="mt-1 text-xs font-semibold leading-snug text-foreground sm:text-[13px] xl:mt-1.5 xl:leading-tight"
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
    <article className="rounded-lg border border-border-subtle bg-surface p-3 text-center xl:p-2.5">
      <span
        className={cn(
          "mx-auto inline-flex size-9 items-center justify-center rounded-lg",
          tone,
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <p className="mt-2 text-lg font-bold leading-none tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-1 text-[10px] leading-tight text-muted">{label}</p>
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
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-foreground">{title}</h3>
      <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const overviewCardBodyClassName = "p-2.5 sm:p-3 xl:p-2";
const pairedOverviewCardClassName = "w-full min-w-0";
const sideOverviewCardClassName = "h-auto w-full self-start";

export function JobOverviewPanel({
  job,
  onCloseJob,
  isClosing,
}: JobOverviewPanelProps) {
  const parsedDescription = parseJobDescription(job.description);
  const jobInformationRows = jobPostingInformationRows(job);
  const canClose =
    (job.status !== "closed" && job.status !== "draft") ||
    (job.status === "closed" && !job.employerNotified && Boolean(job.closedReason));
  const daysRemaining =
    job.analytics.daysRemaining == null
      ? "—"
      : job.analytics.daysRemaining < 0
        ? "Expired"
        : `${job.analytics.daysRemaining} Days`;

  const hasStructuredDescription =
    parsedDescription.intro.length > 0 ||
    parsedDescription.responsibilities.length > 0 ||
    parsedDescription.requirements.length > 0;

  return (
    <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-12 xl:gap-2">
      <div className="grid grid-cols-1 gap-2.5 lg:col-span-9 lg:grid-cols-9 lg:items-start xl:gap-2">
        <OperationsCard
          title="Job Description"
          className={cn(
            pairedOverviewCardClassName,
            "order-1 lg:order-1 lg:col-span-5 lg:col-start-1 lg:row-start-1",
          )}
          bodyClassName={overviewCardBodyClassName}
        >
          {hasStructuredDescription ? (
            <div className="space-y-4 text-xs leading-relaxed text-foreground">
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
            <p className="text-xs leading-relaxed text-foreground">
              {job.description.trim() || "No description provided."}
            </p>
          )}
        </OperationsCard>

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

      <div className="flex min-w-0 flex-col gap-2.5 lg:col-span-3 xl:gap-2">
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
