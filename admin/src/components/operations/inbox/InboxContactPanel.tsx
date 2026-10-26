import { Link } from "react-router-dom";
import {
  Briefcase,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  MapPin,
  MessageCircle,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import {
  operationsCandidateDetailPath,
  operationsEmployerDetailPath,
} from "../../../constants/operations-routes";
import type {
  WhatsAppInboxContactDetails,
  WhatsAppInboxConversation,
} from "../../../types/operations-whatsapp-inbox";
import {
  applicationStatusVariant,
  initialsFromName,
} from "../../../utils/whatsapp-inbox-format";
import { OperationsCandidateAvatar } from "../candidates/OperationsCandidateAvatar";
import { OperationsBadge } from "../../ui/OperationsBadge";

interface InboxContactPanelProps {
  conversation: WhatsAppInboxConversation | null;
  contact: WhatsAppInboxContactDetails | null;
  loading: boolean;
  onClose?: () => void;
}

export function InboxContactPanel({
  conversation,
  contact,
  loading,
  onClose,
}: InboxContactPanelProps) {
  return (
    <aside
      className="flex h-full min-h-0 w-full min-w-0 flex-col border-border-subtle bg-surface xl:border-l"
      aria-label="Contact details"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-subtle px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">Contact details</h2>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close contact details"
            className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-hero-bg hover:text-foreground xl:hidden"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {!conversation ? (
        <p className="px-4 py-6 text-sm text-muted">
          Select a conversation to see the contact.
        </p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <ContactIdentity
            conversation={conversation}
            contact={contact}
            loading={loading}
          />
          <AdditionalDetails contact={contact} loading={loading} />
          <RecentWork contact={contact} />
        </div>
      )}
    </aside>
  );
}

function ContactIdentity({
  conversation,
  contact,
  loading,
}: {
  conversation: WhatsAppInboxConversation;
  contact: WhatsAppInboxContactDetails | null;
  loading: boolean;
}) {
  const name = contact?.displayName || conversation.displayName;
  const phone = contact?.phoneDisplay || conversation.phoneDisplay;
  const seekerId = contact?.jobSeekerId || null;
  const employerId = contact?.employerId || null;
  const profileLinks = [
    seekerId
      ? { href: operationsCandidateDetailPath(seekerId), label: "View profile" }
      : null,
    employerId
      ? {
          href: operationsEmployerDetailPath(employerId),
          label: seekerId ? "View employer" : "View profile",
        }
      : null,
  ].filter((link): link is { href: string; label: string } => Boolean(link));

  return (
    <div className="flex flex-col items-center text-center">
      <ContactAvatar
        name={name}
        avatarUrl={contact?.avatarUrl}
        jobSeekerId={seekerId}
      />
      <p className="mt-3 text-lg font-semibold text-foreground">{name}</p>
      <OperationsBadge
        className="mt-2 gap-1"
        variant={
          conversation.participantType === "employer" ||
          conversation.participantType === "both"
            ? "employer"
            : conversation.participantType === "job_seeker"
              ? "candidate"
              : "default"
        }
      >
        <UserRound className="size-3" aria-hidden />
        {conversation.participantLabel}
      </OperationsBadge>
      <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted">
        <MessageCircle className="size-3.5 text-[#25D366]" aria-hidden />
        {phone}
      </p>
      {loading && !contact ? (
        <p className="mt-3 text-xs text-muted">Loading contact…</p>
      ) : null}
      {profileLinks.length > 0 ? (
        <div className="mt-4 flex w-full flex-col gap-2">
          {profileLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary-light px-4 text-sm font-semibold text-primary hover:bg-primary-light/80"
            >
              <ExternalLink className="size-4" aria-hidden />
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AdditionalDetails({
  contact,
  loading,
}: {
  contact: WhatsAppInboxContactDetails | null;
  loading: boolean;
}) {
  const rows = [
    { icon: MapPin, label: "Location", value: contact?.location },
    { icon: Briefcase, label: "Job role", value: displayValue(contact?.jobRole) },
    {
      icon: GraduationCap,
      label: "Education",
      value: displayValue(contact?.education),
    },
    {
      icon: Clock3,
      label: "Experience",
      value: displayValue(contact?.experience),
    },
  ].filter((row) => Boolean(row.value));

  const status = displayValue(contact?.profileStatus);
  const hasDetails = rows.length > 0 || Boolean(status);

  return (
    <section className="mt-6 border-t border-border-subtle pt-4">
      <h3 className="text-sm font-semibold text-foreground">Additional details</h3>
      {!hasDetails && !loading ? (
        <p className="mt-3 text-xs text-muted">
          Limited profile details are available for this WhatsApp number.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {rows.map((row) => (
            <li key={row.label} className="flex items-start gap-2.5 text-sm text-foreground">
              <row.icon className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
              <span>
                <span className="sr-only">{row.label}: </span>
                {row.value}
              </span>
            </li>
          ))}
          {status ? (
            <li className="flex items-center gap-2.5 text-sm text-foreground">
              <FileText className="size-4 shrink-0 text-muted" aria-hidden />
              <span className="sr-only">Status: </span>
              <span>{status}</span>
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  /incomplete|pending|rejected/i.test(status) ? "bg-muted" : "bg-success",
                )}
                aria-hidden
              />
            </li>
          ) : null}
        </ul>
      )}
    </section>
  );
}

function RecentWork({ contact }: { contact: WhatsAppInboxContactDetails | null }) {
  if (!contact) return null;
  const showApplications = contact.kind === "job_seeker" || contact.kind === "both";
  const showJobs = contact.kind === "employer" || contact.kind === "both";
  if (!showApplications && !showJobs) return null;

  const profileHref = contact.jobSeekerId
    ? operationsCandidateDetailPath(contact.jobSeekerId)
    : contact.employerId
      ? operationsEmployerDetailPath(contact.employerId)
      : null;

  return (
    <>
      {showApplications ? (
        <section className="mt-6 border-t border-border-subtle pt-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">Recent applications</h3>
            {profileHref ? (
              <Link to={profileHref} className="text-xs font-semibold text-primary">
                View all
              </Link>
            ) : null}
          </div>
          <ApplicationList applications={contact.recentApplications ?? []} />
        </section>
      ) : null}
      {showJobs ? (
        <section className="mt-6 border-t border-border-subtle pt-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">Recent jobs</h3>
            {contact.employerId ? (
              <Link
                to={operationsEmployerDetailPath(contact.employerId)}
                className="text-xs font-semibold text-primary"
              >
                View all
              </Link>
            ) : null}
          </div>
          <JobList jobs={contact.recentJobs ?? []} />
        </section>
      ) : null}
    </>
  );
}

function ApplicationList({
  applications,
}: {
  applications: NonNullable<WhatsAppInboxContactDetails["recentApplications"]>;
}) {
  if (applications.length === 0) {
    return <p className="mt-3 text-xs text-muted">No recent applications.</p>;
  }
  return (
    <ul className="mt-1">
      {applications.map((application) => (
        <li
          key={application.id}
          className="flex items-start justify-between gap-3 border-b border-border-subtle py-3 last:border-0"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {application.title}
            </p>
            <p className="truncate text-xs text-muted">
              {application.companyName || "Employer"}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <OperationsBadge variant={applicationStatusVariant(application.status)}>
              {displayValue(application.status)}
            </OperationsBadge>
            {application.appliedAt ? (
              <span className="text-[11px] text-muted">
                {formatDetailDate(application.appliedAt)}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function JobList({
  jobs,
}: {
  jobs: NonNullable<WhatsAppInboxContactDetails["recentJobs"]>;
}) {
  if (jobs.length === 0) {
    return <p className="mt-3 text-xs text-muted">No recent job posts.</p>;
  }
  return (
    <ul className="mt-1">
      {jobs.map((job) => (
        <li
          key={job.id}
          className="flex items-start justify-between gap-3 border-b border-border-subtle py-3 last:border-0"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{job.title}</p>
            <p className="truncate text-xs text-muted">{job.city || "Location not set"}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {job.status ? (
              <OperationsBadge variant="job">{displayValue(job.status)}</OperationsBadge>
            ) : null}
            {job.createdAt ? (
              <span className="text-[11px] text-muted">{formatDetailDate(job.createdAt)}</span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function ContactAvatar({
  name,
  avatarUrl,
  jobSeekerId,
}: {
  name: string;
  avatarUrl?: string;
  jobSeekerId?: string | null;
}) {
  const className =
    "flex size-16 items-center justify-center overflow-hidden rounded-full bg-primary text-lg font-semibold text-white";
  if (jobSeekerId && avatarUrl?.includes("/photo")) {
    return (
      <OperationsCandidateAvatar
        name={name}
        jobSeekerId={jobSeekerId}
        photoUrl={avatarUrl}
        className={className}
        textClassName="text-white"
      />
    );
  }
  if (avatarUrl && /^https?:\/\//i.test(avatarUrl)) {
    return (
      <span className={className}>
        <img src={avatarUrl} alt="" className="size-full object-cover" />
      </span>
    );
  }
  return <span className={className}>{initialsFromName(name)}</span>;
}

function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  if (!trimmed.includes("_") && trimmed !== trimmed.toLowerCase()) {
    return trimmed;
  }
  return trimmed
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDetailDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
