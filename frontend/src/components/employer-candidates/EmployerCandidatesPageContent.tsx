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
import { CandidatesMobileFiltersSheet } from "@/components/employer-candidates/CandidatesMobileFiltersSheet";
import { InterviewScheduleModal } from "@/components/employer-interviews/InterviewScheduleModal";
import { getSavedCandidatesApiErrorMessage } from "@/components/employer-saved-candidates/saved-candidates-utils";
import { SaveCandidateModal } from "@/components/employer-saved-candidates/SaveCandidateModal";
import { Can } from "@/components/rbac/Can";
import {
  fetchEmployerApplication,
  fetchEmployerApplicationStats,
  fetchEmployerApplications,
} from "@/services/employer-applications.service";
import { fetchEmployerJobs } from "@/services/employer-jobs.service";
import {
  fetchSavedCandidateApplicationIds,
  removeSavedCandidateByApplication,
  savedCandidatesQueryKeys,
} from "@/services/saved-candidates.service";
import { useCan } from "@/providers/employer-permission-provider";
import type {
  EmployerApplicationListItem,
  EmployerApplicationStatus,
  EmployerAvailabilityFilterValue,
} from "@/types/employer-applications";
import type { SavedCandidateApplicationSummary } from "@/types/saved-candidates";
import { showAppToast } from "@/utils/share-job";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Filter } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function toSaveCandidateSummary(
  item: EmployerApplicationListItem,
): SavedCandidateApplicationSummary {
  return {
    applicationId: item.id,
    candidateName: item.candidateName,
    jobTitle: item.jobTitle,
    experience: item.candidateExperienceLabel,
    location: item.candidateLocation,
  };
}

export function EmployerCandidatesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { can } = useCan();
  const canExportCandidates = can("candidates", "export");
  const canSaveCandidates = can("candidates", "update");
  const canScheduleInterview =
    can("interviews", "create") || can("interviews", "update");

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
  const [scheduleApplicationId, setScheduleApplicationId] = useState<
    string | null
  >(null);
  const [saveModalState, setSaveModalState] = useState<{
    application: SavedCandidateApplicationSummary;
    shortlistOnSave?: boolean;
    mode: "save" | "edit";
    savedCandidateId?: string;
  } | null>(null);

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
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (previous) => previous,
  });

  const jobsQuery = useQuery({
    queryKey: ["employer", "jobs", "candidates-filter"],
    queryFn: () => fetchEmployerJobs({ page: 1, limit: 50 }),
    staleTime: 60_000,
  });

  const savedIdsQuery = useQuery({
    queryKey: savedCandidatesQueryKeys.ids(),
    queryFn: fetchSavedCandidateApplicationIds,
    enabled: canSaveCandidates,
    staleTime: 30_000,
  });

  const unsaveMutation = useMutation({
    mutationFn: (applicationId: string) =>
      removeSavedCandidateByApplication(applicationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: savedCandidatesQueryKeys.all,
      });
      showAppToast("Removed from saved candidates.");
    },
    onError: (error) => {
      showAppToast(getSavedCandidatesApiErrorMessage(error), "error");
    },
  });

  const applications = listQuery.data?.applications ?? [];
  const pagination = listQuery.data?.pagination;
  const selectedId =
    selectedFromUrl || localSelectedId || applications[0]?.id || null;
  const savedByApplicationId =
    savedIdsQuery.data?.savedByApplicationId ?? {};

  const jobOptions = useMemo(() => {
    const jobs = jobsQuery.data?.jobs ?? [];
    return jobs
      .map((job) => ({
        publicJobId: job.jobId,
        jobTitle: job.jobTitle,
        applications: job.applications,
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

  const openScheduleInterview = (applicationId: string) => {
    if (!canScheduleInterview) {
      return;
    }
    setLocalSelectedId(applicationId);
    setScheduleApplicationId(applicationId);
    syncUrl({ selected: applicationId });
  };

  const openShortlistCandidate = (applicationId: string) => {
    if (!canSaveCandidates) {
      return;
    }

    const savedCandidateId = savedByApplicationId[applicationId];
    const openWithSummary = (summary: SavedCandidateApplicationSummary) => {
      setLocalSelectedId(applicationId);
      setSaveModalState({
        application: summary,
        shortlistOnSave: true,
        mode: savedCandidateId ? "edit" : "save",
        savedCandidateId,
      });
      syncUrl({ selected: applicationId });
    };

    const item = applications.find((app) => app.id === applicationId);
    if (item) {
      openWithSummary(toSaveCandidateSummary(item));
      return;
    }

    void fetchEmployerApplication(applicationId)
      .then((detail) => {
        openWithSummary({
          applicationId: detail.id,
          candidateName: detail.candidate.fullName,
          jobTitle: detail.jobTitle,
          experience: detail.candidate.experienceLabel,
          location:
            detail.candidate.preferredJobLocation?.trim() ||
            [detail.candidate.city, detail.candidate.state]
              .filter(Boolean)
              .join(", "),
        });
      })
      .catch((error) => {
        showAppToast(getSavedCandidatesApiErrorMessage(error), "error");
      });
  };

  const handleToggleSave = (applicationId: string, isSaved: boolean) => {
    if (!canSaveCandidates) {
      return;
    }

    const savedCandidateId = savedByApplicationId[applicationId];

    if (isSaved) {
      // Filled from shortlisted status without a saved row — open shortlist editor.
      if (!savedCandidateId) {
        openShortlistCandidate(applicationId);
        return;
      }
      const item = applications.find((app) => app.id === applicationId);
      const name = item?.candidateName ?? "this candidate";
      if (
        window.confirm(`Remove ${name} from your shortlisted candidates?`)
      ) {
        unsaveMutation.mutate(applicationId);
      }
      return;
    }

    // Bookmark click for non-shortlisted candidates opens shortlist/save flow.
    openShortlistCandidate(applicationId);
  };

  const handleFilterChange = (filter: CandidatesQuickFilter) => {
    setQuickFilter(filter);
    syncUrl({ status: filter, page: 1 });
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] overflow-x-clip px-3 pt-5 pb-[calc(5.875rem+env(safe-area-inset-bottom)+0.75rem)] sm:px-5 md:pb-5 lg:overflow-x-visible lg:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-3xl">
            Candidates
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-muted sm:text-sm">
            Manage applicants, review resumes, schedule interviews and move
            candidates through the hiring pipeline.
          </p>
          {publicJobId ? (
            <p className="mt-2 text-[11px] font-medium text-primary sm:text-xs">
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
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Can module="candidates" action="export">
            <button
              type="button"
              onClick={() => setExportModalOpen(true)}
              className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-primary bg-primary-light px-4 text-xs font-semibold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-10 sm:w-auto sm:min-w-[7.5rem] sm:gap-2 sm:px-5 sm:text-sm"
            >
              <Download
                className="size-3.5 shrink-0 sm:size-4"
                aria-hidden="true"
              />
              Export
            </button>
          </Can>
        </div>
      </header>

      {exportModalOpen && canExportCandidates ? (
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
          onClick={() => setMobileFiltersOpen(true)}
          className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <Filter className="size-3.5" aria-hidden="true" />
          Filters
        </button>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[16rem_minmax(0,1fr)_24rem] lg:grid-cols-[15rem_minmax(0,1fr)]">
        <div className="hidden lg:block">
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
          savedByApplicationId={savedByApplicationId}
          canSave={canSaveCandidates}
          onToggleSave={handleToggleSave}
        />

        <div className="hidden xl:block">
          <CandidatesDetailPanel
            applicationId={selectedId}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onScheduleInterview={openScheduleInterview}
            onOpenShortlist={openShortlistCandidate}
            variant="panel"
          />
        </div>
      </div>

      <CandidatesMobileFiltersSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
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
        onClearAll={() => {
          setQuickFilter("all");
          setSearchDraft("");
          setLocationDraft("");
          setExperienceDraft("");
          setSkillsDraft("");
          setAvailabilityDraft("");
          setAppliedFrom("");
          setAppliedTo("");
          syncUrl({ status: "all", q: "", page: 1 });
        }}
      />

      {mobileDetailOpen && selectedId ? (
        <MobileCandidateDetailDrawer
          applicationId={selectedId}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onScheduleInterview={openScheduleInterview}
          onOpenShortlist={openShortlistCandidate}
          onClose={() => setMobileDetailOpen(false)}
        />
      ) : null}

      {scheduleApplicationId ? (
        <InterviewScheduleModal
          applicationId={scheduleApplicationId}
          onClose={() => setScheduleApplicationId(null)}
          onSaved={() => setActiveTab("interview")}
        />
      ) : null}

      {saveModalState ? (
        <SaveCandidateModal
          application={saveModalState.application}
          mode={saveModalState.mode}
          savedCandidateId={saveModalState.savedCandidateId}
          shortlistOnSave={saveModalState.shortlistOnSave}
          onClose={() => setSaveModalState(null)}
          onSuccess={() => {
            void queryClient.invalidateQueries({
              queryKey: savedCandidatesQueryKeys.all,
            });
          }}
        />
      ) : null}
    </div>
  );
}

function MobileCandidateDetailDrawer({
  applicationId,
  activeTab,
  onTabChange,
  onScheduleInterview,
  onOpenShortlist,
  onClose,
}: {
  applicationId: string;
  activeTab: CandidatesDetailTab;
  onTabChange: (tab: CandidatesDetailTab) => void;
  onScheduleInterview: (applicationId: string) => void;
  onOpenShortlist: (applicationId: string) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    const focusTimer = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 20);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 xl:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40"
        aria-label="Close candidate drawer"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 flex h-[min(92dvh,100%)] max-h-[92dvh] min-h-0 flex-col overflow-hidden rounded-t-2xl bg-hero-bg p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg outline-none sm:inset-y-0 sm:right-0 sm:left-auto sm:h-dvh sm:max-h-none sm:w-[min(28rem,100%)] sm:rounded-none sm:p-4 sm:pb-4"
      >
        <span id={titleId} className="sr-only">
          Candidate details
        </span>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CandidatesDetailPanel
            applicationId={applicationId}
            activeTab={activeTab}
            onTabChange={onTabChange}
            onScheduleInterview={onScheduleInterview}
            onOpenShortlist={onOpenShortlist}
            onClose={onClose}
            variant="drawer"
          />
        </div>
      </div>
    </div>
  );
}
