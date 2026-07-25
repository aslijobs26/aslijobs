"use client";

import { ROUTES } from "@/constants/routes";
import { fetchEmployerApplications } from "@/services/employer-applications.service";
import {
  EMPLOYER_APPLICATION_STATUS_LABELS,
  EMPLOYER_APPLICATION_STATUSES,
  type EmployerApplicationListItem,
  type EmployerApplicationStatus,
} from "@/types/employer-applications";
import { cn } from "@/utils/cn";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusClass(status: EmployerApplicationStatus): string {
  switch (status) {
    case "shortlisted":
    case "selected":
    case "offer_sent":
    case "joined":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "interview_scheduled":
    case "interview_completed":
    case "under_review":
    case "viewed":
      return "bg-sky-50 text-sky-800 ring-sky-200";
    case "rejected":
    case "withdrawn":
      return "bg-red-50 text-red-700 ring-red-200";
    default:
      return "bg-primary-light/50 text-muted ring-border-subtle";
  }
}

export function EmployerCandidatesPageContent() {
  const searchParams = useSearchParams();
  const publicJobId =
    searchParams.get("jobId")?.trim().toUpperCase() || undefined;

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EmployerApplicationStatus | "">("");

  const applicationsQuery = useQuery({
    queryKey: [
      "employer",
      "applications",
      publicJobId ?? "all",
      status || "all",
      search,
    ],
    queryFn: () =>
      fetchEmployerApplications({
        publicJobId,
        status: status || undefined,
        search: search || undefined,
      }),
  });

  const applications = applicationsQuery.data ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Candidates
          </h1>
          <p className="mt-1 text-sm text-muted">
            Review applicants and the ATS resume submitted with each application.
          </p>
          {publicJobId ? (
            <p className="mt-2 text-xs font-medium text-primary">
              Filtered by job {publicJobId}
              {" · "}
              <Link
                href={ROUTES.EMPLOYER_CANDIDATES}
                className="underline underline-offset-2 hover:text-primary-hover"
              >
                Clear filter
              </Link>
            </p>
          ) : null}
        </div>
        <Link
          href={ROUTES.EMPLOYER_JOBS}
          className="text-sm font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Back to jobs
        </Link>
      </header>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <form
          className="min-w-0 flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchDraft.trim());
          }}
        >
          <label htmlFor="candidates-search" className="sr-only">
            Search candidates
          </label>
          <div className="flex gap-2">
            <input
              id="candidates-search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search by candidate or job title"
              className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Search
            </button>
          </div>
        </form>

        <label className="sr-only" htmlFor="candidates-status">
          Status filter
        </label>
        <select
          id="candidates-status"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as EmployerApplicationStatus | "")
          }
          className="rounded-lg border border-border-subtle bg-surface px-3 py-2.5 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <option value="">All statuses</option>
          {EMPLOYER_APPLICATION_STATUSES.map((item) => (
            <option key={item} value={item}>
              {EMPLOYER_APPLICATION_STATUS_LABELS[item]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border-subtle bg-surface">
        {applicationsQuery.isLoading ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            Loading candidates…
          </p>
        ) : applicationsQuery.isError ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-muted">
              Could not load candidates. Please try again.
            </p>
            <button
              type="button"
              className="mt-4 inline-flex rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-surface hover:bg-primary-hover"
              onClick={() => void applicationsQuery.refetch()}
            >
              Retry
            </button>
          </div>
        ) : applications.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            No applications yet
            {publicJobId ? " for this job" : ""}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border-subtle bg-hero-bg/50 text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Applied</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {applications.map((item) => (
                  <CandidateRow key={item.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CandidateRow({ item }: { item: EmployerApplicationListItem }) {
  return (
    <tr className="border-b border-border-subtle last:border-b-0 hover:bg-hero-bg/35">
      <td className="px-4 py-3">
        <p className="font-semibold text-foreground">{item.candidateName}</p>
        <p className="mt-0.5 text-xs text-muted">
          {[item.candidateHeadline, item.candidateLocation]
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-foreground">{item.jobTitle}</p>
        <p className="mt-0.5 text-xs text-muted">{item.publicJobId}</p>
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
            statusClass(item.status),
          )}
        >
          {EMPLOYER_APPLICATION_STATUS_LABELS[item.status]}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-muted">
        {formatDate(item.appliedAt)}
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={ROUTES.employerCandidateDetail(item.id)}
          className="inline-flex rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          View
        </Link>
      </td>
    </tr>
  );
}
