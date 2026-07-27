"use client";

import {
  getStatsChipCount,
} from "@/components/job-seeker-applications/applied-jobs-utils";
import { ROUTES } from "@/constants/routes";
import { fetchAuthenticatedJobSeeker } from "@/services/job-seeker-login.service";
import {
  fetchSeekerApplicationStats,
  fetchSeekerApplications,
} from "@/services/job-seeker-applications.service";
import { fetchMyResume } from "@/services/job-seeker-resume.service";
import { fetchNotificationUnreadCount } from "@/services/notifications.service";
import {
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
} from "@/types/job-seeker-applications";
import type { ResumeStatus } from "@/types/job-seeker-resume";
import { cn } from "@/utils/cn";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Bookmark,
  Briefcase,
  ChevronRight,
  FileText,
  Search,
  UserRound,
} from "lucide-react";
import Link from "next/link";

const RESUME_STATUS_LABELS: Record<ResumeStatus, string> = {
  READY: "Ready",
  OUTDATED: "Outdated",
  FAILED: "Failed",
  REGENERATING: "Regenerating",
  NOT_GENERATED: "Not generated",
};

function getGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 17) {
    return "Good afternoon";
  }
  return "Good evening";
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

type SummaryCardProps = {
  href: string;
  label: string;
  value: string;
  hint?: string;
  icon: typeof Briefcase;
};

function SummaryCard({ href, label, value, hint, icon: Icon }: SummaryCardProps) {
  return (
    <Link
      href={href}
      className="group flex min-h-[7.5rem] flex-col justify-between rounded-xl border border-border-subtle bg-surface p-4 transition-colors hover:border-primary/30 hover:bg-primary-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary-light text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <ChevronRight
          className="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
          aria-hidden="true"
        />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      </div>
    </Link>
  );
}

type QuickActionProps = {
  href: string;
  label: string;
  icon: typeof Briefcase;
};

function QuickAction({ href, label, icon: Icon }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <Icon className="size-4 text-primary" aria-hidden="true" />
      {label}
    </Link>
  );
}

export function DashboardHomeContent() {
  const profileQuery = useQuery({
    queryKey: ["job-seeker", "me"],
    queryFn: fetchAuthenticatedJobSeeker,
    staleTime: 60_000,
  });

  const statsQuery = useQuery({
    queryKey: ["job-seeker", "application-stats"],
    queryFn: fetchSeekerApplicationStats,
    staleTime: 30_000,
  });

  const resumeQuery = useQuery({
    queryKey: ["job-seeker", "resume"],
    queryFn: fetchMyResume,
    staleTime: 60_000,
  });

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchNotificationUnreadCount,
    staleTime: 30_000,
  });

  const recentQuery = useQuery({
    queryKey: ["job-seeker", "applications", "dashboard-recent"],
    queryFn: () =>
      fetchSeekerApplications({
        sort: "newest",
        page: 1,
        limit: 5,
      }),
    staleTime: 20_000,
  });

  const jobSeeker = profileQuery.data?.jobSeeker;
  const fullName = jobSeeker?.fullName?.trim() || "Job Seeker";
  const locationLabel = [jobSeeker?.city, jobSeeker?.state]
    .filter(Boolean)
    .join(", ");
  const resume = resumeQuery.data;
  const resumeStatus = (resume?.status ?? "NOT_GENERATED") as ResumeStatus;
  const completionPercent = resume?.profileCompletionPercent;
  const appliedCount = getStatsChipCount("all", statsQuery.data) ?? 0;
  const unreadCount = unreadQuery.data ?? 0;
  const recentApplications = recentQuery.data?.applications ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5">
        <p className="text-sm font-medium text-primary">
          {getGreeting()}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {fullName}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Your job search hub — track applications, resume, and updates in one
          place.
        </p>
      </header>

      <section className="mt-6" aria-labelledby="profile-summary-heading">
        <h2 id="profile-summary-heading" className="sr-only">
          Profile summary
        </h2>
        <div className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-start gap-4">
            <span
              className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-surface"
              aria-hidden="true"
            >
              {fullName
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase() ?? "")
                .join("") || "JS"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-foreground">{fullName}</p>
              <p className="mt-1 text-sm text-muted">
                {jobSeeker?.whatsappNumber
                  ? `+91 ${jobSeeker.whatsappNumber}`
                  : "Mobile not available"}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {locationLabel || "Location not set"}
                {jobSeeker?.jobRole ? ` · ${jobSeeker.jobRole}` : ""}
              </p>
            </div>
            <Link
              href={ROUTES.JOB_SEEKER_PROFILE}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border-subtle bg-surface px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              View Profile
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6" aria-labelledby="summary-cards-heading">
        <h2
          id="summary-cards-heading"
          className="text-base font-bold text-foreground"
        >
          Overview
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            href={ROUTES.JOB_SEEKER_PROFILE}
            label="Profile Completion"
            value={
              typeof completionPercent === "number"
                ? `${completionPercent}%`
                : "—"
            }
            hint="Based on your resume profile"
            icon={UserRound}
          />
          <SummaryCard
            href={ROUTES.JOB_SEEKER_MY_RESUME}
            label="Resume Status"
            value={RESUME_STATUS_LABELS[resumeStatus]}
            hint={
              resume?.versionNumber
                ? `Version ${resume.versionNumber}`
                : undefined
            }
            icon={FileText}
          />
          <SummaryCard
            href={ROUTES.JOB_SEEKER_APPLIED_JOBS}
            label="Applied Jobs"
            value={String(appliedCount)}
            hint="Total applications"
            icon={Briefcase}
          />
          <SummaryCard
            href={ROUTES.JOB_SEEKER_NOTIFICATIONS}
            label="Notifications"
            value={String(unreadCount)}
            hint="Unread"
            icon={Bell}
          />
          <SummaryCard
            href={ROUTES.JOB_SEEKER_SAVED_JOBS}
            label="Saved Jobs"
            value="0"
            hint="Coming soon"
            icon={Bookmark}
          />
        </div>
      </section>

      <section className="mt-6" aria-labelledby="quick-actions-heading">
        <h2
          id="quick-actions-heading"
          className="text-base font-bold text-foreground"
        >
          Quick actions
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <QuickAction
            href={ROUTES.JOB_SEEKER_PROFILE}
            label="View Profile"
            icon={UserRound}
          />
          <QuickAction
            href={ROUTES.JOB_SEEKER_MY_RESUME}
            label="My Resume"
            icon={FileText}
          />
          <QuickAction
            href={ROUTES.JOB_SEEKER_APPLIED_JOBS}
            label="Applied Jobs"
            icon={Briefcase}
          />
          <QuickAction
            href={ROUTES.JOB_SEEKER_NOTIFICATIONS}
            label="Notifications"
            icon={Bell}
          />
          <QuickAction
            href={ROUTES.FIND_JOBS}
            label="Browse Jobs"
            icon={Search}
          />
        </div>
      </section>

      <section className="mt-6" aria-labelledby="recent-activity-heading">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2
            id="recent-activity-heading"
            className="text-base font-bold text-foreground"
          >
            Recent activity
          </h2>
          <Link
            href={ROUTES.JOB_SEEKER_APPLIED_JOBS}
            className="text-sm font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            View all
          </Link>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-border-subtle bg-surface">
          {recentQuery.isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-muted">
              Loading recent applications…
            </p>
          ) : recentApplications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-muted">
                No applications yet. Browse jobs and apply to get started.
              </p>
              <Link
                href={ROUTES.FIND_JOBS}
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Browse Jobs
              </Link>
            </div>
          ) : (
            <ul>
              {recentApplications.map((application, index) => {
                const statusLabel =
                  APPLICATION_STATUS_LABELS[
                    application.status as ApplicationStatus
                  ] ?? application.status;
                return (
                  <li
                    key={application.id}
                    className={cn(
                      index > 0 && "border-t border-border-subtle",
                    )}
                  >
                    <Link
                      href={ROUTES.jobSeekerApplicationDetail(application.id)}
                      className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-primary-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
                    >
                      <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                        <Briefcase className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {statusLabel} — {application.jobTitle}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {application.companyName || "Company"}
                          {application.location
                            ? ` · ${application.location}`
                            : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted">
                        {formatRelativeTime(
                          application.lastStatusUpdatedAt ||
                            application.appliedAt,
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
