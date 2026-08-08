"use client";

import { ResumeStatusBadge } from "@/components/job-seeker-resume/ResumeStatusBadge";
import { ROUTES } from "@/constants/routes";
import type { JobSeekerPublic } from "@/types/job-seeker";
import {
  APPLICATION_STATUS_LABELS,
  type SeekerApplicationListItem,
} from "@/types/job-seeker-applications";
import type { PublicResume } from "@/types/job-seeker-resume";
import type { NotificationListItem } from "@/types/notifications";
import type { SavedJobListItem } from "@/types/saved-jobs";
import { cn } from "@/utils/cn";
import {
  availabilityLabel,
  computeTotalExperienceLabel,
  educationInstitution,
  educationLevelLabel,
  educationTitle,
  formatCurrentLocation,
  formatExpectedSalary,
  formatExperienceDateRange,
  formatRelativeUpdatedAt,
  formatWhatsappNumber,
  jobTypeLabel,
  languageLabel,
  resolveProfessionalSummary,
  resolveSkills,
  sortExperiencesChronologically,
  workModeLabel,
  type JobSeekerProfileTab,
} from "@/utils/job-seeker-profile";
import { showAppToast } from "@/utils/share-job";
import {
  Banknote,
  Briefcase,
  Building2,
  Clock3,
  Download,
  Globe2,
  GraduationCap,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { JobSeekerProfileEditModalState } from "./JobSeekerProfileEditModals";

type JobSeekerProfileTabPanelsProps = {
  activeTab: JobSeekerProfileTab;
  jobSeeker: JobSeekerPublic;
  resume: PublicResume | null | undefined;
  applications: SeekerApplicationListItem[];
  savedJobs: SavedJobListItem[];
  notifications: NotificationListItem[];
  isApplicationsLoading: boolean;
  isSavedJobsLoading: boolean;
  isNotificationsLoading: boolean;
  isResumeBusy: boolean;
  onOpenModal: (modal: NonNullable<JobSeekerProfileEditModalState>) => void;
  onDeleteExperience: (index: number) => Promise<void>;
  onDeleteEducation: () => Promise<void>;
  onDownloadResume: () => Promise<void>;
  onRegenerateResume: () => void;
};

const iconButtonClassName =
  "inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-xs font-semibold text-foreground hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

function SectionCard({
  title,
  action,
  children,
  id,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-border-subtle bg-hero-bg/40 p-4 sm:p-5"
      aria-labelledby={id ? `${id}-heading` : undefined}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2
          id={id ? `${id}-heading` : undefined}
          className="text-base font-bold text-foreground"
        >
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function JobSeekerProfileTabPanels({
  activeTab,
  jobSeeker,
  resume,
  applications,
  savedJobs,
  notifications,
  isApplicationsLoading,
  isSavedJobsLoading,
  isNotificationsLoading,
  isResumeBusy,
  onOpenModal,
  onDeleteExperience,
  onDeleteEducation,
  onDownloadResume,
  onRegenerateResume,
}: JobSeekerProfileTabPanelsProps) {
  const summary = resolveProfessionalSummary(jobSeeker, resume);
  const skills = resolveSkills(jobSeeker, resume);
  const experiences = sortExperiencesChronologically(jobSeeker.experiences ?? []);
  const latestExperience = experiences[0];
  const locationLabel = formatCurrentLocation(jobSeeker);
  const experienceLabel = computeTotalExperienceLabel(jobSeeker);

  if (activeTab === "overview") {
    return (
      <div className="space-y-4">
        <SectionCard
          title="About me"
          action={
            <button
              type="button"
              className={iconButtonClassName}
              onClick={() => onOpenModal({ type: "about" })}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
              Edit
            </button>
          }
        >
          {summary ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {summary}
            </p>
          ) : (
            <p className="text-sm text-muted">
              Add a professional summary to help employers understand your
              background.
            </p>
          )}
        </SectionCard>

        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                label: "Current role",
                value: jobSeeker.jobRole || "Not set",
                icon: Briefcase,
              },
              {
                label: "Experience",
                value: experienceLabel || "Not set",
                icon: Clock3,
              },
              {
                label: "Location",
                value: locationLabel || "Not set",
                icon: MapPin,
              },
              {
                label: "Expected salary",
                value: formatExpectedSalary(jobSeeker) || "Not set",
                icon: Banknote,
              },
            ] as const
          ).map((card) => {
            const Icon = card.icon;
            const isEmpty = card.value === "Not set";
            return (
              <div
                key={card.label}
                className="flex items-start gap-3 rounded-2xl border border-border-subtle bg-surface p-4"
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted">{card.label}</p>
                  <p
                    className={cn(
                      "mt-0.5 truncate text-sm font-bold",
                      isEmpty ? "text-muted" : "text-foreground",
                    )}
                  >
                    {card.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <SectionCard title="Latest experience">
          {latestExperience ? (
            <div className="rounded-xl border border-border-subtle bg-surface p-3.5">
              <p className="text-sm font-bold text-foreground">
                {latestExperience.jobRole} · {latestExperience.companyName}
              </p>
              <p className="mt-1 text-xs text-muted">
                {formatExperienceDateRange(latestExperience)}
              </p>
              {latestExperience.location ? (
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {latestExperience.location}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted">
              {jobSeeker.experienceType === "fresher"
                ? "You marked yourself as a fresher."
                : "Add work experience to showcase your career."}
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="Top skills"
          action={
            <button
              type="button"
              className={iconButtonClassName}
              onClick={() => onOpenModal({ type: "skills" })}
            >
              Manage
            </button>
          }
        >
          {skills.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {skills.slice(0, 8).map((skill) => (
                <li
                  key={skill}
                  className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary"
                >
                  {skill}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Add skills to improve matching.</p>
          )}
        </SectionCard>

        <div className="rounded-2xl border border-primary/20 bg-primary-light/45 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-surface">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">
                AI profile insights
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Get tailored suggestions to improve your profile and resume.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:mt-0 sm:w-auto"
            onClick={() =>
              showAppToast("AI profile insights are coming soon.", "info")
            }
          >
            Explore
          </button>
        </div>
      </div>
    );
  }

  if (activeTab === "experience") {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">
            {jobSeeker.experienceType === "fresher"
              ? "You are registered as a fresher."
              : `${experiences.length} experience ${experiences.length === 1 ? "entry" : "entries"}`}
          </p>
          <button
            type="button"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            onClick={() =>
              onOpenModal({ type: "experience", mode: "create", index: -1 })
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            Add experience
          </button>
        </div>
        {experiences.length === 0 ? (
          <SectionCard title="Work experience">
            <p className="text-sm text-muted">No experience added yet.</p>
          </SectionCard>
        ) : (
          experiences.map((entry, index) => {
            const originalIndex = (jobSeeker.experiences ?? []).indexOf(entry);
            const experienceIndex = originalIndex >= 0 ? originalIndex : index;

            return (
            <SectionCard
              key={`${entry.companyName}-${entry.startDate}-${index}`}
              title={`${entry.jobRole} at ${entry.companyName}`}
              action={
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={iconButtonClassName}
                    onClick={() =>
                      onOpenModal({
                        type: "experience",
                        mode: "edit",
                        index: experienceIndex,
                      })
                    }
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Edit
                  </button>
                  <button
                    type="button"
                    className={cn(
                      iconButtonClassName,
                      "border-red-200 text-red-600 hover:bg-red-50",
                    )}
                    onClick={() => void onDeleteExperience(experienceIndex)}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              }
            >
              <p className="text-xs font-medium text-muted">
                {formatExperienceDateRange(entry)}
                {entry.industry ? ` · ${entry.industry}` : ""}
              </p>
              {entry.location ? (
                <p className="mt-2 text-sm text-foreground">{entry.location}</p>
              ) : null}
              {entry.responsibilities ? (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase text-muted">
                    Responsibilities
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {entry.responsibilities}
                  </p>
                </div>
              ) : null}
              {entry.achievements ? (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase text-muted">
                    Achievements
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {entry.achievements}
                  </p>
                </div>
              ) : null}
            </SectionCard>
            );
          })
        )}
      </div>
    );
  }

  if (activeTab === "education") {
    const education = jobSeeker.education;
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap justify-end gap-2">
          {education?.level ? (
            <>
              <button
                type="button"
                className={iconButtonClassName}
                onClick={() => onOpenModal({ type: "education" })}
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                Edit
              </button>
              <button
                type="button"
                className={cn(
                  iconButtonClassName,
                  "border-red-200 text-red-600 hover:bg-red-50",
                )}
                onClick={() => void onDeleteEducation()}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Remove
              </button>
            </>
          ) : (
            <button
              type="button"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover"
              onClick={() => onOpenModal({ type: "education" })}
            >
              <Plus className="size-4" aria-hidden="true" />
              Add education
            </button>
          )}
        </div>
        <SectionCard title="Education">
          {education?.level ? (
            <div className="flex gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                <GraduationCap className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {educationTitle(education)}
                </p>
                <p className="text-sm text-muted">
                  {educationLevelLabel(education.level)}
                </p>
                {educationInstitution(education) ? (
                  <p className="mt-1 text-sm text-foreground">
                    {educationInstitution(education)}
                  </p>
                ) : null}
                {education.passingYear ? (
                  <p className="mt-1 text-xs text-muted">
                    Passed {education.passingYear}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">No education added yet.</p>
          )}
        </SectionCard>
      </div>
    );
  }

  if (activeTab === "skills") {
    return (
      <SectionCard
        title="Skills"
        action={
          <button
            type="button"
            className={iconButtonClassName}
            onClick={() => onOpenModal({ type: "skills" })}
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit skills
          </button>
        }
      >
        {skills.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <li
                key={skill}
                className="rounded-full border border-primary/20 bg-primary-light px-3 py-1.5 text-sm font-semibold text-primary"
              >
                {skill}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Add skills to highlight your strengths.</p>
        )}
      </SectionCard>
    );
  }

  if (activeTab === "documents") {
    const hasResume = Boolean(resume && resume.status !== "NOT_GENERATED");
    return (
      <SectionCard title="Resume">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">My Resume</p>
            {resume ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ResumeStatusBadge status={resume.status} />
                {resume.updatedAt ? (
                  <span className="text-xs text-muted">
                    Updated {formatRelativeUpdatedAt(resume.updatedAt)}
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted">
                No resume generated yet. Open the resume builder to create one.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={ROUTES.JOB_SEEKER_MY_RESUME}
              className={iconButtonClassName}
            >
              Open builder
            </Link>
            <button
              type="button"
              className={iconButtonClassName}
              disabled={!hasResume || isResumeBusy}
              onClick={() => void onDownloadResume()}
            >
              <Download className="size-3.5" aria-hidden="true" />
              Download PDF
            </button>
            <button
              type="button"
              className={iconButtonClassName}
              disabled={isResumeBusy}
              onClick={onRegenerateResume}
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Regenerate
            </button>
          </div>
        </div>
      </SectionCard>
    );
  }

  if (activeTab === "preferences") {
    const preferenceTiles: {
      label: string;
      value: string;
      icon: LucideIcon;
    }[] = [
      {
        label: "Job type",
        value: jobTypeLabel(jobSeeker.jobType) || "Not set",
        icon: Briefcase,
      },
      {
        label: "Work mode",
        value: workModeLabel(jobSeeker.workMode) || "Not set",
        icon: Building2,
      },
      {
        label: "Preferred location",
        value: jobSeeker.preferredJobLocation || "Not set",
        icon: MapPin,
      },
      {
        label: "Expected salary",
        value: formatExpectedSalary(jobSeeker) || "Not set",
        icon: Banknote,
      },
      {
        label: "Availability",
        value: availabilityLabel(jobSeeker.availabilityStatus) || "Not set",
        icon: Clock3,
      },
      {
        label: "Current location",
        value:
          [jobSeeker.city, jobSeeker.state, jobSeeker.pincode]
            .filter(Boolean)
            .join(", ") || "Not set",
        icon: MapPin,
      },
    ];

    const languages = jobSeeker.languages ?? [];
    const whatsappLabel =
      formatWhatsappNumber(jobSeeker.whatsappNumber) || "Not set";

    return (
      <div className="space-y-4">
        <SectionCard
          title="Career preferences"
          action={
            <button
              type="button"
              className={iconButtonClassName}
              onClick={() => onOpenModal({ type: "preferences" })}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
              Edit
            </button>
          }
        >
          <div className="rounded-xl border border-primary/15 bg-primary-light/50 px-4 py-4 sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Target role
            </p>
            <p className="mt-1 text-lg font-bold tracking-tight text-foreground">
              {jobSeeker.jobRole.trim() || "Add your preferred job role"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {jobTypeLabel(jobSeeker.jobType) ? (
                <span className="inline-flex items-center rounded-lg bg-surface px-2.5 py-1 text-xs font-semibold text-foreground">
                  {jobTypeLabel(jobSeeker.jobType)}
                </span>
              ) : null}
              {workModeLabel(jobSeeker.workMode) ? (
                <span className="inline-flex items-center rounded-lg bg-surface px-2.5 py-1 text-xs font-semibold text-foreground">
                  {workModeLabel(jobSeeker.workMode)}
                </span>
              ) : null}
              {jobSeeker.preferredJobLocation.trim() ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1 text-xs font-semibold text-foreground">
                  <MapPin className="size-3.5 text-primary" aria-hidden="true" />
                  {jobSeeker.preferredJobLocation}
                </span>
              ) : null}
            </div>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {preferenceTiles.map((tile) => {
              const Icon = tile.icon;
              const isEmpty = tile.value === "Not set";
              return (
                <div
                  key={tile.label}
                  className="flex items-start gap-3 rounded-xl border border-border-subtle bg-hero-bg/70 p-3.5"
                >
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium text-muted">
                      {tile.label}
                    </dt>
                    <dd
                      className={cn(
                        "mt-0.5 truncate text-sm font-semibold",
                        isEmpty ? "text-muted" : "text-foreground",
                      )}
                    >
                      {tile.value}
                    </dd>
                  </div>
                </div>
              );
            })}
          </dl>
        </SectionCard>

        <SectionCard title="Languages & contact">
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Globe2 className="size-4 text-primary" aria-hidden="true" />
                <p className="text-sm font-semibold text-foreground">
                  Languages
                </p>
              </div>
              {languages.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {languages.map((language) => (
                    <li
                      key={language}
                      className="inline-flex items-center rounded-lg border border-border-subtle bg-surface px-2.5 py-1 text-xs font-semibold text-foreground"
                    >
                      {languageLabel(language)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">No languages added yet.</p>
              )}
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-border-subtle bg-hero-bg/70 p-3.5">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-resource-guide-icon-surface text-resource-guide-icon">
                <MessageCircle className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted">WhatsApp</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {whatsappLabel}
                </p>
                {jobSeeker.isWhatsappVerified ? (
                  <p className="mt-1 text-xs font-medium text-resource-guide-icon">
                    Verified for sign-in
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (activeTab === "activity") {
    return (
      <div className="space-y-4">
        <SectionCard title="Recently applied">
          {isApplicationsLoading ? (
            <p className="text-sm text-muted">Loading applications…</p>
          ) : applications.length === 0 ? (
            <p className="text-sm text-muted">No applications yet.</p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {applications.map((application) => (
                <li key={application.id} className="flex gap-3 py-3 first:pt-0">
                  <Briefcase
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`${ROUTES.JOB_SEEKER_APPLIED_JOBS}?application=${application.id}`}
                      className="text-sm font-semibold text-foreground hover:text-primary"
                    >
                      {application.jobTitle}
                    </Link>
                    <p className="text-xs text-muted">{application.companyName}</p>
                    <p className="mt-0.5 text-xs font-medium text-primary">
                      {APPLICATION_STATUS_LABELS[application.status] ??
                        application.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Saved jobs">
          {isSavedJobsLoading ? (
            <p className="text-sm text-muted">Loading saved jobs…</p>
          ) : savedJobs.length === 0 ? (
            <p className="text-sm text-muted">No saved jobs yet.</p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {savedJobs.map((job) => (
                <li key={job.id} className="py-3 first:pt-0">
                  <Link
                    href={`/jobs/${job.publicJobId}`}
                    className="text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {job.jobTitle}
                  </Link>
                  <p className="text-xs text-muted">
                    {job.companyName} · {job.location || job.cityName}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Notifications">
          {isNotificationsLoading ? (
            <p className="text-sm text-muted">Loading notifications…</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {notifications.map((notification) => (
                <li key={notification.id} className="py-3 first:pt-0">
                  <p className="text-sm font-semibold text-foreground">
                    {notification.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{notification.body}</p>
                  <p className="mt-1 text-[11px] text-muted">
                    {formatRelativeUpdatedAt(notification.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={ROUTES.JOB_SEEKER_NOTIFICATIONS}
            className="mt-3 inline-flex text-sm font-semibold text-primary underline underline-offset-2"
          >
            View all notifications
          </Link>
        </SectionCard>
      </div>
    );
  }

  return null;
}
