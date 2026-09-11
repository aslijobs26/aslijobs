import { Check, ExternalLink, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import {
  operationsEmployerDetailPath,
  operationsJobDetailPath,
  operationsVerificationReviewPath,
} from "../../../../constants/operations-routes";
import { useOperationsJobDetail } from "../../../../hooks/use-operations-job-detail";
import type { OperationsWorkDetail } from "../../../../types/operations-work";
import { OperationsCard } from "../../../ui/OperationsCard";
import { relatedEntityHref } from "../my-work-format";
import {
  buildStatusTimeline,
  formatTimelineClock,
  formatWorkDetailDate,
  metadataString,
} from "./my-work-detail-format";
import { cn } from "../../../../utils/cn";

interface MyWorkDetailSidePanelProps {
  item: OperationsWorkDetail;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border-subtle/70 py-2 last:border-b-0">
      <dt className="shrink-0 text-[11px] font-medium text-muted">{label}</dt>
      <dd className="min-w-0 text-right text-[12px] font-semibold text-foreground">
        {value || "—"}
      </dd>
    </div>
  );
}

function JobDetailsCard({ item }: { item: OperationsWorkDetail }) {
  const jobId =
    item.relatedEntityType === "job" ? item.relatedEntityId ?? undefined : undefined;
  const jobQuery = useOperationsJobDetail(jobId);
  const job = jobQuery.data;
  const editHref = jobId ? operationsJobDetailPath(jobId) : null;

  const rows = job
    ? [
        { label: "Job Title", value: job.jobTitle },
        { label: "Company", value: job.companyName },
        { label: "Job Type", value: job.jobTypeLabel || job.jobType },
        { label: "Vacancies", value: String(job.vacancies ?? "—") },
        {
          label: "Location",
          value: job.locationLabel || [job.cityName, job.stateName].filter(Boolean).join(", "),
        },
        {
          label: "Created On",
          value: formatWorkDetailDate(job.createdAt ?? job.publishedAt),
        },
        { label: "Job ID", value: job.jobId },
      ]
    : [
        {
          label: "Related",
          value: item.relatedLabel || "—",
        },
        {
          label: "Entity type",
          value: item.relatedEntityType || "—",
        },
        {
          label: "Location",
          value: item.relatedLocationLabel || "—",
        },
        {
          label: "Title",
          value: metadataString(item.metadata, "jobTitle") || item.title,
        },
        {
          label: "Created On",
          value: formatWorkDetailDate(item.createdAt),
        },
        {
          label: "Reference",
          value: item.relatedEntityId || item.displayId,
        },
      ];

  const title =
    item.relatedEntityType === "job"
      ? "Job Details"
      : item.relatedEntityType === "employer" ||
          item.relatedEntityType === "verification"
        ? "Employer Details"
        : "Related Details";

  return (
    <OperationsCard
      title={title}
      action={
        editHref ? (
          <Link
            to={editHref}
            className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <Pencil className="size-3" aria-hidden />
            Edit
          </Link>
        ) : null
      }
      bodyClassName="p-0 sm:p-0"
    >
      {jobQuery.isPending && jobId ? (
        <div className="space-y-2 p-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-7 animate-pulse rounded-md bg-border-subtle/70"
            />
          ))}
        </div>
      ) : (
        <dl className="px-3 py-1">
          {rows.map((row) => (
            <DetailRow key={row.label} label={row.label} value={row.value} />
          ))}
        </dl>
      )}
    </OperationsCard>
  );
}

function StatusTimelineCard({ item }: { item: OperationsWorkDetail }) {
  const steps = buildStatusTimeline(item);
  const completed = item.status === "completed";

  return (
    <OperationsCard title="Status Timeline" bodyClassName="p-3 sm:p-3.5">
      <ol className="flex items-start justify-between gap-1">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <li
              key={step.id}
              className="relative flex min-w-0 flex-1 flex-col items-center text-center"
            >
              {!isLast ? (
                <span
                  className={cn(
                    "absolute left-[calc(50%+0.75rem)] right-[calc(-50%+0.75rem)] top-[0.7rem] h-0.5",
                    step.done ? "bg-success" : "bg-border-subtle",
                  )}
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "relative z-[1] inline-flex size-6 items-center justify-center rounded-full border-2",
                  step.done
                    ? "border-success bg-success text-white"
                    : "border-border-subtle bg-surface text-transparent",
                )}
              >
                {step.done ? <Check className="size-3" strokeWidth={3} aria-hidden /> : null}
              </span>
              <p className="mt-1.5 text-[10px] font-semibold text-foreground">
                {step.label}
              </p>
              <p className="text-[9px] text-muted">
                {formatTimelineClock(step.at) || "—"}
              </p>
            </li>
          );
        })}
      </ol>

      {completed ? (
        <div
          role="status"
          className="mt-3 rounded-lg border border-success/20 bg-success/10 px-3 py-2.5 text-[11px] leading-relaxed text-success"
        >
          This work item has been completed. All required actions have been
          finished.
        </div>
      ) : item.status === "waiting" ? (
        <div
          role="status"
          className="mt-3 rounded-lg border border-warning/20 bg-warning/10 px-3 py-2.5 text-[11px] leading-relaxed text-warning"
        >
          Waiting{item.waitingReason ? `: ${item.waitingReason}` : "."}
        </div>
      ) : null}
    </OperationsCard>
  );
}

function QuickLinksCard({ item }: { item: OperationsWorkDetail }) {
  const jobId =
    item.relatedEntityType === "job" ? item.relatedEntityId ?? undefined : undefined;
  const jobQuery = useOperationsJobDetail(jobId);
  const relatedHref = relatedEntityHref(
    item.relatedEntityType,
    item.relatedEntityId,
  );
  const links: Array<{ label: string; href: string }> = [];

  if (item.relatedEntityType === "job" && item.relatedEntityId) {
    links.push({
      label: "View Job Posting",
      href: operationsJobDetailPath(item.relatedEntityId),
    });
    const employerId =
      jobQuery.data?.employerId ||
      (typeof item.metadata.employerId === "string"
        ? item.metadata.employerId
        : null);
    if (employerId) {
      links.push({
        label: "View Employer",
        href: operationsEmployerDetailPath(employerId),
      });
    }
  } else if (
    (item.relatedEntityType === "employer" ||
      item.relatedEntityType === "verification") &&
    item.relatedEntityId
  ) {
    links.push({
      label: "View Employer",
      href: operationsEmployerDetailPath(item.relatedEntityId),
    });
    links.push({
      label: "Open Verification",
      href: operationsVerificationReviewPath(item.relatedEntityId),
    });
  } else if (relatedHref) {
    links.push({
      label: "Open related record",
      href: relatedHref,
    });
  }

  if (links.length === 0) {
    return null;
  }

  return (
    <OperationsCard title="Quick Links" bodyClassName="flex flex-col gap-2 p-3">
      {links.map((link) => (
        <Link
          key={link.href + link.label}
          to={link.href}
          className="inline-flex h-10 items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface px-3 text-[12px] font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-hero-bg/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {link.label}
          <ExternalLink className="size-3.5 text-muted" aria-hidden />
        </Link>
      ))}
    </OperationsCard>
  );
}

export function MyWorkDetailSidePanel({ item }: MyWorkDetailSidePanelProps) {
  return (
    <aside className="flex min-w-0 flex-col gap-3">
      <JobDetailsCard item={item} />
      <StatusTimelineCard item={item} />
      <QuickLinksCard item={item} />
    </aside>
  );
}
