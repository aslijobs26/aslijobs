"use client";

import { AddSavedCandidateModal } from "@/components/employer-saved-candidates/AddSavedCandidateModal";
import { SavedCandidateNotesModal } from "@/components/employer-saved-candidates/SavedCandidateNotesModal";
import { SavedCandidateTagsModal } from "@/components/employer-saved-candidates/SavedCandidateTagsModal";
import { SavedCandidatesCardGrid } from "@/components/employer-saved-candidates/SavedCandidatesCardGrid";
import { SavedCandidatesStatsCards } from "@/components/employer-saved-candidates/SavedCandidatesStatsCards";
import {
  SavedCandidatesTable,
  type SavedCandidateRowActions,
} from "@/components/employer-saved-candidates/SavedCandidatesTable";
import { SavedCandidatesExportModal } from "@/components/employer-saved-candidates/SavedCandidatesExportModal";
import { SavedCandidatesToolbar } from "@/components/employer-saved-candidates/SavedCandidatesToolbar";
import {
  getSavedCandidatesApiErrorMessage,
  parseSavedCandidatePriority,
  parseSavedCandidateSort,
  parseSavedCandidateTag,
  parseSavedCandidatesViewMode,
} from "@/components/employer-saved-candidates/saved-candidates-utils";
import {
  CandidatesDetailPanel,
  type CandidatesDetailTab,
} from "@/components/employer-candidates/CandidatesDetailPanel";
import { InterviewScheduleModal } from "@/components/employer-interviews/InterviewScheduleModal";
import { ListPagination } from "@/components/shared/ListPagination";
import { SAVED_CANDIDATES_PAGE_SIZE } from "@/constants/saved-candidates";
import { ROUTES } from "@/constants/routes";
import { useCan } from "@/providers/employer-permission-provider";
import {
  fetchSavedCandidateStats,
  fetchSavedCandidates,
  removeSavedCandidate,
  savedCandidatesQueryKeys,
} from "@/services/saved-candidates.service";
import { fetchEmployerJobs } from "@/services/employer-jobs.service";
import type { EmployerAvailabilityFilterValue } from "@/types/employer-applications";
import type {
  SavedCandidateListItem,
  SavedCandidatePriority,
  SavedCandidateSort,
  SavedCandidatesViewMode,
} from "@/types/saved-candidates";
import {
  normalizeListPagination,
  resolveEmptyPageFallback,
} from "@/utils/list-pagination";
import { showAppToast } from "@/utils/share-job";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Bookmark, Users } from "lucide-react";
import Link from "next/link";
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

export function SavedCandidatesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { can, canField } = useCan();
  const canUpdateCandidates = can("candidates", "update");
  const canExportCandidates = can("candidates", "export");
  const canWriteNotes = canField("candidates", "notes", "write");
  const canScheduleInterview =
    can("interviews", "create") || can("interviews", "update");
  const drawerTitleId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);

  const publicJobId =
    searchParams.get("jobId")?.trim().toUpperCase() || "";
  const selectedFromUrl = searchParams.get("selected")?.trim() || null;
  const pageFromUrl = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const sort = parseSavedCandidateSort(searchParams.get("sort"));
  const viewMode = parseSavedCandidatesViewMode(searchParams.get("view"));
  const tagFilter = parseSavedCandidateTag(searchParams.get("tag")) ?? "";
  const priorityFilter =
    parseSavedCandidatePriority(searchParams.get("priority")) ?? "";

  const [searchDraft, setSearchDraft] = useState(
    searchParams.get("q")?.trim() || "",
  );
  const [locationDraft, setLocationDraft] = useState(
    searchParams.get("location")?.trim() || "",
  );
  const [experienceDraft, setExperienceDraft] = useState(
    searchParams.get("experience")?.trim() || "",
  );
  const [availabilityDraft, setAvailabilityDraft] =
    useState<EmployerAvailabilityFilterValue>(
      (searchParams.get("availability")?.trim() as EmployerAvailabilityFilterValue) ||
        "",
    );
  const [priorityDraft, setPriorityDraft] = useState<
    SavedCandidatePriority | ""
  >(priorityFilter || "");
  const [tagDraft, setTagDraft] = useState(tagFilter || "");

  const normalizeSearch = (value: string) =>
    value.trim().replace(/\s+/g, " ");
  const search = useDebouncedValue(normalizeSearch(searchDraft), 300);
  const location = useDebouncedValue(locationDraft.trim(), 300);
  const experience = useDebouncedValue(experienceDraft.trim(), 300);
  const availability = useDebouncedValue(availabilityDraft, 300);
  const priority = useDebouncedValue(priorityDraft, 0);
  const tag = useDebouncedValue(tagDraft, 0);

  const [activeTab, setActiveTab] = useState<CandidatesDetailTab>("resume");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [localSelectedApplicationId, setLocalSelectedApplicationId] = useState<
    string | null
  >(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [tagsModalItem, setTagsModalItem] =
    useState<SavedCandidateListItem | null>(null);
  const [notesModalItem, setNotesModalItem] =
    useState<SavedCandidateListItem | null>(null);
  const [scheduleApplicationId, setScheduleApplicationId] = useState<
    string | null
  >(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const listParams = useMemo(
    () => ({
      search: search || undefined,
      publicJobId: publicJobId || undefined,
      location: location || undefined,
      experience: experience || undefined,
      availability: availability || undefined,
      priority: priority || undefined,
      tag: tag || undefined,
      sort,
      page: pageFromUrl,
      limit: SAVED_CANDIDATES_PAGE_SIZE,
    }),
    [
      search,
      publicJobId,
      location,
      experience,
      availability,
      priority,
      tag,
      sort,
      pageFromUrl,
    ],
  );

  const statsQuery = useQuery({
    queryKey: savedCandidatesQueryKeys.stats(),
    queryFn: fetchSavedCandidateStats,
    staleTime: 30_000,
  });

  const listQuery = useQuery({
    queryKey: savedCandidatesQueryKeys.list(listParams),
    queryFn: () => fetchSavedCandidates(listParams),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const jobsQuery = useQuery({
    queryKey: ["employer", "jobs", "saved-candidates-filter"],
    queryFn: () => fetchEmployerJobs({ page: 1, limit: 50 }),
    staleTime: 60_000,
  });

  const items = listQuery.data?.savedCandidates ?? [];
  const pagination = normalizeListPagination(
    listQuery.data?.pagination,
    SAVED_CANDIDATES_PAGE_SIZE,
  );

  const jobOptions = useMemo(() => {
    const jobs = jobsQuery.data?.jobs ?? [];
    return jobs
      .filter(
        (job) =>
          Boolean(job.jobId?.trim()) &&
          job.status !== "draft",
      )
      .map((job) => {
        const title = job.jobTitle?.trim() || "Untitled job";
        return {
          publicJobId: job.jobId.trim().toUpperCase(),
          jobTitle: title,
        };
      });
  }, [jobsQuery.data]);

  const selectedApplicationId =
    selectedFromUrl ||
    localSelectedApplicationId ||
    items[0]?.applicationId ||
    null;

  const syncUrl = (next: {
    jobId?: string;
    selected?: string | null;
    page?: number;
    q?: string;
    sort?: SavedCandidateSort;
    view?: SavedCandidatesViewMode;
    location?: string;
    experience?: string;
    availability?: string;
    priority?: SavedCandidatePriority | "";
    tag?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    const applyString = (key: string, value: string | undefined, removeWhenEmpty = true) => {
      if (value === undefined) {
        return;
      }
      if (!value && removeWhenEmpty) {
        params.delete(key);
      } else if (value) {
        params.set(key, value);
      }
    };

    if (next.jobId !== undefined) {
      applyString("jobId", next.jobId);
    }
    if (next.selected !== undefined) {
      if (next.selected) {
        params.set("selected", next.selected);
      } else {
        params.delete("selected");
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
      applyString("q", next.q);
    }
    if (next.sort !== undefined) {
      if (next.sort !== "recently_saved") {
        params.set("sort", next.sort);
      } else {
        params.delete("sort");
      }
    }
    if (next.view !== undefined) {
      if (next.view !== "table") {
        params.set("view", next.view);
      } else {
        params.delete("view");
      }
    }
    if (next.location !== undefined) {
      applyString("location", next.location);
    }
    if (next.experience !== undefined) {
      applyString("experience", next.experience);
    }
    if (next.availability !== undefined) {
      applyString("availability", next.availability);
    }
    if (next.priority !== undefined) {
      applyString("priority", next.priority);
    }
    if (next.tag !== undefined) {
      applyString("tag", next.tag);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  useEffect(() => {
    syncUrl({
      q: search,
      location,
      experience,
      availability,
      priority: priority || "",
      tag: tag || "",
      page: 1,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounced filter sync
  }, [search, location, experience, availability, priority, tag]);

  useEffect(() => {
    const fallback = resolveEmptyPageFallback(pageFromUrl, pagination.totalPages);
    if (fallback !== pageFromUrl && !listQuery.isLoading) {
      syncUrl({ page: fallback });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.totalPages, pageFromUrl, listQuery.isLoading]);

  const removeMutation = useMutation({
    mutationFn: (savedCandidateId: string) =>
      removeSavedCandidate(savedCandidateId),
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

  const selectCandidate = (applicationId: string) => {
    setLocalSelectedApplicationId(applicationId);
    setMobileDetailOpen(true);
    syncUrl({ selected: applicationId });
  };

  const openScheduleInterview = (applicationId: string) => {
    if (!canScheduleInterview) {
      return;
    }
    setLocalSelectedApplicationId(applicationId);
    setScheduleApplicationId(applicationId);
    syncUrl({ selected: applicationId });
  };

  const rowActions: SavedCandidateRowActions = {
    onSelect: selectCandidate,
    onScheduleInterview: openScheduleInterview,
    onEditTags: (item) => {
      if (!canUpdateCandidates) {
        return;
      }
      setTagsModalItem(item);
    },
    onEditNotes: (item) => {
      if (!canWriteNotes && !canUpdateCandidates) {
        return;
      }
      setNotesModalItem(item);
    },
    onUnsave: (item) => {
      if (!canUpdateCandidates) {
        return;
      }
      if (
        window.confirm(
          `Remove ${item.candidateName} from your saved candidates?`,
        )
      ) {
        removeMutation.mutate(item.id);
      }
    },
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(publicJobId) ||
    Boolean(location) ||
    Boolean(experience) ||
    Boolean(availability) ||
    Boolean(priority) ||
    Boolean(tag);

  const showEmptyState =
    !listQuery.isLoading && items.length === 0 && !hasActiveFilters;

  const showTableOnDesktop = viewMode === "table";

  useEffect(() => {
    if (!mobileDetailOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileDetailOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const focusTimer = window.setTimeout(() => {
      drawerRef.current?.focus();
    }, 20);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [mobileDetailOpen]);

  return (
    <div className="mx-auto w-full max-w-[1600px] overflow-x-clip px-3 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-5 lg:overflow-x-visible lg:px-6 lg:pb-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl xl:text-3xl">
            Shortlisted Candidates
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-muted sm:text-sm">
            Candidates you&apos;ve shortlisted and saved for future
            opportunities.
          </p>
          {publicJobId ? (
            <p className="mt-2 text-[11px] font-medium text-primary sm:text-xs">
              Filtered by job {publicJobId}
              {" · "}
              <button
                type="button"
                className="underline underline-offset-2 hover:text-primary-hover"
                onClick={() => syncUrl({ jobId: "", page: 1 })}
              >
                Clear job filter
              </button>
            </p>
          ) : null}
        </div>
      </header>

      <div className="mt-5">
        <SavedCandidatesStatsCards
          stats={statsQuery.data}
          isLoading={statsQuery.isLoading}
        />
      </div>

      <div className="mt-4">
        <SavedCandidatesToolbar
          searchDraft={searchDraft}
          onSearchDraftChange={setSearchDraft}
          onSearchSubmit={() => {
            const nextSearch = normalizeSearch(searchDraft);
            setSearchDraft(nextSearch);
            syncUrl({ q: nextSearch, page: 1 });
          }}
          publicJobId={publicJobId}
          onJobChange={(jobId) => syncUrl({ jobId, page: 1 })}
          jobOptions={jobOptions}
          location={locationDraft}
          onLocationChange={setLocationDraft}
          experience={experienceDraft}
          onExperienceChange={setExperienceDraft}
          availability={availabilityDraft}
          onAvailabilityChange={setAvailabilityDraft}
          priority={priorityDraft}
          onPriorityChange={setPriorityDraft}
          tag={tagDraft}
          onTagChange={setTagDraft}
          sort={sort}
          onSortChange={(value) => syncUrl({ sort: value, page: 1 })}
          viewMode={viewMode}
          onViewModeChange={(mode) => syncUrl({ view: mode })}
          onOpenExportModal={() => setExportModalOpen(true)}
          canExport={canExportCandidates}
          onOpenAddModal={() => setAddModalOpen(true)}
          canAdd={canUpdateCandidates}
        />
      </div>

      {showEmptyState ? (
        <div className="mt-6 rounded-xl border border-dashed border-border-subtle bg-surface px-6 py-12 text-center">
          <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
            <Bookmark className="size-7" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-foreground">
            No shortlisted candidates yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Shortlist applicants from your pipeline to build a list you can
            filter, tag, and export anytime.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {canUpdateCandidates ? (
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Add saved candidate
              </button>
            ) : null}
            <Link
              href={ROUTES.EMPLOYER_CANDIDATES}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border-subtle px-5 text-sm font-semibold text-foreground hover:border-primary/30 hover:bg-primary-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Users className="size-4 shrink-0" aria-hidden="true" />
              Browse candidates
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="min-w-0">
            {!listQuery.isLoading && items.length === 0 && hasActiveFilters ? (
              <div className="rounded-xl border border-border-subtle bg-surface px-6 py-10 text-center">
                <p className="text-sm font-semibold text-foreground">
                  No shortlisted candidates match your filters
                </p>
                <p className="mt-1 text-sm text-muted">
                  Try clearing search or filters to see more results.
                </p>
              </div>
            ) : (
              <>
                <div className="lg:hidden">
                  <SavedCandidatesCardGrid
                    items={items}
                    selectedApplicationId={selectedApplicationId}
                    isLoading={listQuery.isLoading}
                    actions={rowActions}
                  />
                </div>
                <div className="hidden lg:block">
                  {showTableOnDesktop ? (
                    <SavedCandidatesTable
                      items={items}
                      selectedApplicationId={selectedApplicationId}
                      isLoading={listQuery.isLoading}
                      actions={rowActions}
                    />
                  ) : (
                    <SavedCandidatesCardGrid
                      items={items}
                      selectedApplicationId={selectedApplicationId}
                      isLoading={listQuery.isLoading}
                      actions={rowActions}
                      variant="grid"
                    />
                  )}
                </div>

                <ListPagination
                  page={pagination.page}
                  limit={pagination.limit}
                  total={pagination.total}
                  totalPages={pagination.totalPages}
                  onPageChange={(nextPage) => syncUrl({ page: nextPage })}
                  isLoading={listQuery.isFetching}
                  entityLabel="saved candidates"
                  ariaLabel="Saved candidates pagination"
                />
              </>
            )}
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-20">
              <CandidatesDetailPanel
                applicationId={selectedApplicationId}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onScheduleInterview={openScheduleInterview}
                variant="panel"
                allowedTabs={["resume"]}
              />
            </div>
          </div>
        </div>
      )}

      {mobileDetailOpen && selectedApplicationId ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40"
            aria-label="Close candidate drawer"
            onClick={() => setMobileDetailOpen(false)}
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
            tabIndex={-1}
            className="absolute inset-x-0 bottom-0 flex h-[min(92dvh,100%)] max-h-[92dvh] min-h-0 flex-col overflow-hidden rounded-t-2xl bg-hero-bg p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg outline-none sm:inset-y-0 sm:right-0 sm:left-auto sm:h-dvh sm:max-h-none sm:w-[min(28rem,100%)] sm:rounded-none sm:p-4 sm:pb-4"
          >
            <span id={drawerTitleId} className="sr-only">
              Candidate details
            </span>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <CandidatesDetailPanel
                applicationId={selectedApplicationId}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onScheduleInterview={openScheduleInterview}
                onClose={() => setMobileDetailOpen(false)}
                variant="drawer"
                allowedTabs={["resume"]}
              />
            </div>
          </div>
        </div>
      ) : null}

      {exportModalOpen ? (
        <SavedCandidatesExportModal
          onClose={() => setExportModalOpen(false)}
          filters={{
            search: search || undefined,
            publicJobId: publicJobId || undefined,
            location: location || undefined,
            experience: experience || undefined,
            availability: availability || undefined,
            priority: priority || undefined,
            tag: tag || undefined,
            sort,
          }}
        />
      ) : null}

      {addModalOpen ? (
        <AddSavedCandidateModal
          onClose={() => setAddModalOpen(false)}
          onSaved={() => setAddModalOpen(false)}
        />
      ) : null}

      {tagsModalItem ? (
        <SavedCandidateTagsModal
          item={tagsModalItem}
          onClose={() => setTagsModalItem(null)}
        />
      ) : null}

      {notesModalItem ? (
        <SavedCandidateNotesModal
          item={notesModalItem}
          onClose={() => setNotesModalItem(null)}
        />
      ) : null}

      {scheduleApplicationId ? (
        <InterviewScheduleModal
          applicationId={scheduleApplicationId}
          onClose={() => setScheduleApplicationId(null)}
          onSaved={() => setActiveTab("resume")}
        />
      ) : null}
    </div>
  );
}
