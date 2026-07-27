"use client";

import { CandidatesDetailPanel } from "@/components/employer-candidates/CandidatesDetailPanel";
import type { CandidatesDetailTab } from "@/components/employer-candidates/CandidatesDetailPanel";
import { CandidatesExportModal } from "@/components/employer-candidates/CandidatesExportModal";
import {
  CandidatesFilterPanel,
  type CandidatesQuickFilter,
} from "@/components/employer-candidates/CandidatesFilterPanel";
import { CandidatesKpiStrip } from "@/components/employer-candidates/CandidatesKpiStrip";
import { CandidatesListPanel } from "@/components/employer-candidates/CandidatesListPanel";
import {
  fetchEmployerApplicationStats,
  fetchEmployerApplications,
} from "@/services/employer-applications.service";
import { fetchEmployerJobs } from "@/services/employer-jobs.service";
import type {
  EmployerApplicationStatus,
  EmployerAvailabilityFilterValue,
} from "@/types/employer-applications";
import { cn } from "@/utils/cn";
import { useQuery } from "@tanstack/react-query";
import { Filter } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function EmployerCandidatesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const publicJobId =
    searchParams.get("jobId")?.trim().toUpperCase() || undefined;
  const selectedFromUrl = searchParams.get("selected")?.trim() || null;
  const statusFromUrl = searchParams.get("status")?.trim() || "";
  const pageFromUrl = Number(searchParams.get("page") || "1");

  const [quickFilter, setQuickFilter] = useState<CandidatesQuickFilter>(
    (statusFromUrl as CandidatesQuickFilter) || "all",
  );
  const [searchDraft, setSearchDraft] = useState(
    searchParams.get("q")?.trim() || "",
  );
  const [sort, setSort] = useState<"newest" | "oldest" | "updated">(
    (searchParams.get("sort") as "newest" | "oldest" | "updated") || "newest",
  );
  const [activeTab, setActiveTab] = useState<CandidatesDetailTab>("profile");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const [locationDraft, setLocationDraft] = useState("");
  const [experienceDraft, setExperienceDraft] = useState("");
  const [skillsDraft, setSkillsDraft] = useState("");
  const [availabilityDraft, setAvailabilityDraft] =
    useState<EmployerAvailabilityFilterValue>("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const normalizeSearch = (value: string) =>
    value.trim().replace(/\s+/g, " ");
  const search = useDebouncedValue(normalizeSearch(searchDraft), 300);
  const location = useDebouncedValue(locationDraft.trim(), 300);
  const experience = useDebouncedValue(experienceDraft.trim(), 300);
  const skills = useDebouncedValue(skillsDraft.trim(), 300);
  const availability = useDebouncedValue(availabilityDraft, 300);

  const statusFilter: EmployerApplicationStatus | undefined =
    quickFilter === "all" ? undefined : quickFilter;

  const filterKey = [
    search,
    quickFilter,
    sort,
    publicJobId ?? "",
    location,
    experience,
    skills,
    availability,
    appliedFrom,
    appliedTo,
  ].join("|");

  const [pageState, setPageState] = useState({
    key: filterKey,
    page: Number.isFinite(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1,
  });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (nextPage: number) => {
    setPageState({ key: filterKey, page: nextPage });
  };

  const syncUrl = (next: {
    jobId?: string | undefined;
    selected?: string | null;
    status?: string;
    page?: number;
    q?: string;
    sort?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.jobId !== undefined) {
      if (next.jobId) {
        params.set("jobId", next.jobId);
      } else {
        params.delete("jobId");
      }
    }
    if (next.selected !== undefined) {
      if (next.selected) {
        params.set("selected", next.selected);
      } else {
        params.delete("selected");
      }
    }
    if (next.status !== undefined) {
      if (next.status && next.status !== "all") {
        params.set("status", next.status);
      } else {
        params.delete("status");
      }
    }
    if (next.page !== undefined) {
      if (next.page > 1) {
        params.set("page", String(next.page));
      } else {
        params.delete("page");
      }
    }
    if (next.q !== undefined) {
      if (next.q) {
        params.set("q", next.q);
      } else {
        params.delete("q");
      }
    }
    if (next.sort !== undefined) {
      if (next.sort && next.sort !== "newest") {
        params.set("sort", next.sort);
      } else {
        params.delete("sort");
      }
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const statsQuery = useQuery({
    queryKey: ["employer", "application-stats", publicJobId ?? "all"],
    queryFn: () =>
      fetchEmployerApplicationStats({
        publicJobId,
      }),
    staleTime: 30_000,
  });

  const listQuery = useQuery({
    queryKey: [
      "employer",
      "applications",
      publicJobId ?? "all",
      statusFilter ?? "all",
      search,
      sort,
      page,
      location,
      experience,
      skills,
      availability,
      appliedFrom,
      appliedTo,
    ],
    queryFn: () =>
      fetchEmployerApplications({
        publicJobId,
        status: statusFilter,
        search: search || undefined,
        sort,
        page,
        limit: 20,
        location: location || undefined,
        experience: experience || undefined,
        skills: skills || undefined,
        availability: availability || undefined,
        appliedFrom: appliedFrom || undefined,
        appliedTo: appliedTo || undefined,
      }),
    placeholderData: (previous) => previous,
  });

  const jobsQuery = useQuery({
    queryKey: ["employer", "jobs", "candidates-filter"],
    queryFn: () => fetchEmployerJobs({ page: 1, limit: 50 }),
    staleTime: 60_000,
  });

  const applications = listQuery.data?.applications ?? [];
  const pagination = listQuery.data?.pagination;
  const selectedId =
    selectedFromUrl || localSelectedId || applications[0]?.id || null;

  const jobOptions = useMemo(() => {
    const jobs = jobsQuery.data?.jobs ?? [];
    return jobs
      .map((job) => ({
        publicJobId: job.jobId,
        jobTitle: job.jobTitle,
      }))
      .filter((job) => Boolean(job.publicJobId));
  }, [jobsQuery.data]);

  const selectCandidate = (
    id: string,
    options?: { tab?: CandidatesDetailTab; openMobile?: boolean },
  ) => {
    setLocalSelectedId(id);
    if (options?.tab) {
      setActiveTab(options.tab);
    }
    if (options?.openMobile !== false) {
      setMobileDetailOpen(true);
    }
    syncUrl({ selected: id });
  };

  const handleFilterChange = (filter: CandidatesQuickFilter) => {
    setQuickFilter(filter);
    syncUrl({ status: filter, page: 1 });
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 py-5 sm:px-5 lg:px-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Candidates
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Manage applicants, review resumes, schedule interviews and move
            candidates through the hiring pipeline.
          </p>
          {publicJobId ? (
            <p className="mt-2 text-xs font-medium text-primary">
              Filtered by job {publicJobId}
              {" · "}
              <button
                type="button"
                className="underline underline-offset-2 hover:text-primary-hover"
                onClick={() => {
                  syncUrl({ jobId: "" });
                }}
              >
                Clear job filter
              </button>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border-subtle bg-surface px-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Export
          </button>
        </div>
      </header>

      {exportModalOpen ? (
        <CandidatesExportModal
          onClose={() => setExportModalOpen(false)}
          jobOptions={jobOptions}
          filters={{
            publicJobId,
            status: statusFilter,
            search: search || undefined,
            location: location || undefined,
            experience: experience || undefined,
            skills: skills || undefined,
            availability: availability || undefined,
            appliedFrom: appliedFrom || undefined,
            appliedTo: appliedTo || undefined,
          }}
        />
      ) : null}

      <div className="mt-5">
        <CandidatesKpiStrip
          stats={statsQuery.data}
          isLoading={statsQuery.isLoading}
        />
      </div>

      <div className="mt-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen((open) => !open)}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface px-3 text-sm font-semibold text-foreground"
        >
          <Filter className="size-4" aria-hidden="true" />
          {mobileFiltersOpen ? "Hide filters" : "Show filters"}
        </button>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[16rem_minmax(0,1fr)_24rem] lg:grid-cols-[15rem_minmax(0,1fr)]">
        <div
          className={cn(
            "lg:block",
            mobileFiltersOpen ? "block" : "hidden",
          )}
        >
          <div className="lg:sticky lg:top-20">
            <CandidatesFilterPanel
              stats={statsQuery.data}
              activeFilter={quickFilter}
              onFilterChange={handleFilterChange}
              searchDraft={searchDraft}
              location={locationDraft}
              experience={experienceDraft}
              skills={skillsDraft}
              availability={availabilityDraft}
              appliedFrom={appliedFrom}
              appliedTo={appliedTo}
              publicJobId={publicJobId}
              searchInputRef={searchInputRef}
              onSearchDraftChange={setSearchDraft}
              onSearchSubmit={() => {
                const nextSearch = normalizeSearch(searchDraft);
                setSearchDraft(nextSearch);
                syncUrl({ q: nextSearch, page: 1 });
              }}
              onLocationChange={setLocationDraft}
              onExperienceChange={setExperienceDraft}
              onSkillsChange={setSkillsDraft}
              onAvailabilityChange={setAvailabilityDraft}
              onAppliedFromChange={setAppliedFrom}
              onAppliedToChange={setAppliedTo}
              onClearAdvanced={() => {
                setLocationDraft("");
                setExperienceDraft("");
                setSkillsDraft("");
                setAvailabilityDraft("");
                setAppliedFrom("");
                setAppliedTo("");
              }}
            />
          </div>
        </div>

        <CandidatesListPanel
          applications={applications}
          pagination={pagination}
          isLoading={listQuery.isLoading}
          selectedId={selectedId}
          sort={sort}
          jobOptions={jobOptions}
          publicJobId={publicJobId}
          hasActiveSearch={Boolean(search)}
          hasLocationFilter={Boolean(location)}
          onClearSearch={() => {
            setSearchDraft("");
            syncUrl({ q: "", page: 1 });
          }}
          onClearLocation={() => {
            setLocationDraft("");
          }}
          onSortChange={(value) => {
            setSort(value);
            syncUrl({ sort: value, page: 1 });
          }}
          onJobChange={(jobId) => {
            syncUrl({ jobId: jobId || "", page: 1 });
          }}
          onSelect={(id) => selectCandidate(id)}
          onPageChange={(nextPage) => {
            setPage(nextPage);
            syncUrl({ page: nextPage });
          }}
          onOpenResume={(id) =>
            selectCandidate(id, { tab: "resume", openMobile: true })
          }
          onScheduleInterview={(id) =>
            selectCandidate(id, { tab: "interview", openMobile: true })
          }
        />

        <div className="hidden xl:block">
          <CandidatesDetailPanel
            applicationId={selectedId}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="panel"
          />
        </div>
      </div>

      {mobileDetailOpen && selectedId ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40"
            aria-label="Close candidate drawer"
            onClick={() => setMobileDetailOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-hidden rounded-t-2xl bg-hero-bg p-3 shadow-lg sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[min(28rem,100%)] sm:rounded-none sm:p-4">
            <CandidatesDetailPanel
              applicationId={selectedId}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onClose={() => setMobileDetailOpen(false)}
              variant="drawer"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
