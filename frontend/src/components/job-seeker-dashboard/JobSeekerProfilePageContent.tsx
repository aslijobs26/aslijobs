"use client";

import { JOB_SEEKER_LANGUAGE_OPTIONS } from "@/constants/job-seeker-register";
import { ROUTES } from "@/constants/routes";
import { fetchAuthenticatedJobSeeker } from "@/services/job-seeker-login.service";
import { fetchMyResume } from "@/services/job-seeker-resume.service";
import type { JobSeekerLanguage } from "@/types/job-seeker";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "JS";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function languageLabel(value: JobSeekerLanguage): string {
  const match = JOB_SEEKER_LANGUAGE_OPTIONS.find(
    (option) => option.value === value,
  );
  return match?.label ?? value;
}

type ProfileFieldProps = {
  label: string;
  value: string;
};

function ProfileField({ label, value }: ProfileFieldProps) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

export function JobSeekerProfilePageContent() {
  const profileQuery = useQuery({
    queryKey: ["job-seeker", "me"],
    queryFn: fetchAuthenticatedJobSeeker,
    staleTime: 60_000,
  });

  const resumeQuery = useQuery({
    queryKey: ["job-seeker", "resume"],
    queryFn: fetchMyResume,
    staleTime: 60_000,
  });

  if (profileQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-40 rounded bg-primary-light/50" />
          <div className="h-40 rounded-xl bg-primary-light/25" />
          <div className="h-56 rounded-xl bg-primary-light/25" />
        </div>
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="mt-3 text-sm text-muted">
          We couldn&apos;t load your profile. Please try again.
        </p>
        <Link
          href={ROUTES.JOB_SEEKER_DASHBOARD}
          className="mt-6 inline-flex text-sm font-semibold text-primary underline underline-offset-2"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  const jobSeeker = profileQuery.data.jobSeeker;
  const fullName = jobSeeker.fullName.trim() || "Job Seeker";
  const locationLabel =
    [jobSeeker.city, jobSeeker.state, jobSeeker.pincode]
      .filter(Boolean)
      .join(", ") || "Not set";
  const languages =
    jobSeeker.languages?.map(languageLabel).join(", ") || "Not set";
  const completionPercent = resumeQuery.data?.profileCompletionPercent;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Profile
          </h1>
          <p className="mt-1 text-sm text-muted">
            Your AsliJobs job seeker account details.
          </p>
        </div>
        <button
          type="button"
          disabled
          title="Profile editing will be available soon"
          className="inline-flex min-h-10 cursor-not-allowed items-center justify-center rounded-lg border border-border-subtle bg-surface px-4 py-2 text-sm font-semibold text-muted opacity-70"
        >
          Edit Profile
        </button>
      </header>

      <section className="mt-6 rounded-xl border border-border-subtle bg-surface p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span
            className="inline-flex size-16 items-center justify-center rounded-full bg-primary-soft text-xl font-bold text-surface"
            aria-hidden="true"
          >
            {getInitials(fullName)}
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground">{fullName}</h2>
            <p className="mt-0.5 text-sm text-muted">
              {jobSeeker.jobRole || "Job Seeker"}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          <ProfileField
            label="Mobile Number"
            value={
              jobSeeker.whatsappNumber
                ? `+91 ${jobSeeker.whatsappNumber}`
                : "Not set"
            }
          />
          <ProfileField label="Current Location" value={locationLabel} />
          <ProfileField
            label="Preferred Job Location"
            value={jobSeeker.preferredJobLocation || "Not set"}
          />
          <ProfileField label="Preferred Language" value={languages} />
          <ProfileField
            label="Profile Completion"
            value={
              typeof completionPercent === "number"
                ? `${completionPercent}%`
                : "Not available"
            }
          />
          <ProfileField
            label="WhatsApp Verified"
            value={jobSeeker.isWhatsappVerified ? "Yes" : "No"}
          />
        </dl>

        <p className="mt-6 text-xs text-muted">
          Profile editing is coming soon. Your details are based on registration
          and resume data.
        </p>
      </section>
    </div>
  );
}
