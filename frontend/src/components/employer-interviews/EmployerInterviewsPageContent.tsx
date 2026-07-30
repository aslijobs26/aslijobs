"use client";

import { CandidatesDetailPanel } from "@/components/employer-candidates/CandidatesDetailPanel";
import type { CandidatesDetailTab } from "@/components/employer-candidates/CandidatesDetailPanel";
import { InterviewCancelModal } from "@/components/employer-interviews/InterviewCancelModal";
import { InterviewScheduleModal } from "@/components/employer-interviews/InterviewScheduleModal";
import { InterviewsCalendar } from "@/components/employer-interviews/InterviewsCalendar";
import type { InterviewsCalendarMode } from "@/components/employer-interviews/interviews-calendar-utils";
import { InterviewsFilterPanel } from "@/components/employer-interviews/InterviewsFilterPanel";
import type {
  InterviewsModeFilter,
  InterviewsQuickDateFilter,
  InterviewsStatusFilter,
} from "@/components/employer-interviews/InterviewsFilterPanel";
import { InterviewsJobSelect } from "@/components/employer-interviews/InterviewsJobSelect";
import { interviewsToolbarControlClassName } from "@/components/employer-interviews/interviews-toolbar-styles";
import { InterviewsKpiStrip } from "@/components/employer-interviews/InterviewsKpiStrip";
import { InterviewsStatusOverview } from "@/components/employer-interviews/InterviewsStatusOverview";
import { InterviewsTable } from "@/components/employer-interviews/InterviewsTable";
import { InterviewsTodaySchedule } from "@/components/employer-interviews/InterviewsTodaySchedule";
import { updateEmployerApplicationStatus } from "@/services/employer-applications.service";
import {
  fetchEmployerInterviewStats,
  fetchEmployerInterviews,
} from "@/services/employer-interviews.service";
import { cn } from "@/utils/cn";
import { showAppToast } from "@/utils/share-job";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Filter, List, Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type InterviewsPageView = "list" | "calendar";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response
      ?.data?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data
      .message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return "Something went wrong. Please try again.";
}

function parseViewParam(value: string | null): InterviewsPageView {
  return value === "calendar" ? "calendar" : "list";
}

export function EmployerInterviewsPageContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = parseViewParam(searchParams.get("view"));

  const [searchDraft, setSearchDraft] = useState("");
  const [quickDate, setQuickDate] = useState<InterviewsQuickDateFilter>("");
  const [status, setStatus] = useState<InterviewsStatusFilter>("");
  const [mode, setMode] = useState<InterviewsModeFilter>("");
  const [interviewerDraft, setInterviewerDraft] = useState("");
  const [interviewFrom, setInterviewFrom] = useState("");
  const [interviewTo, setInterviewTo] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"interview_asc" | "interview_desc">(
    "interview_asc",
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CandidatesDetailTab>("interview");
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editApplicationId, setEditApplicationId] = useState<string | null>(
    null,
  );
  const [cancelApplicationId, setCancelApplicationId] = useState<string | null>(
    null,
  );
  const [selectedPublicJobId, setSelectedPublicJobId] = useState<string | null>(
    null,
  );
  const [calendarRange, setCalendarRange] = useState<{
    from: string;
    to: string;
    mode: InterviewsCalendarMode;
  } | null>(null);

  const search = useDebouncedValue(searchDraft.trim().replace(/\s+/g, " "), 300);
  const interviewer = useDebouncedValue(interviewerDraft.trim(), 300);

  const filterKey = [
    search,
    quickDate,
    status,
    mode,
    interviewer,
    interviewFrom,
    interviewTo,
    selectedPublicJobId ?? "",
  ].join("|");

  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  const setView = useCallback(
    (next: InterviewsPageView) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", next);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const sharedListFilters = useMemo(
    () => ({
      publicJobId: selectedPublicJobId || undefined,
      search: search || undefined,
      status:
        status === "interview_scheduled" || status === "interview_completed"
          ? status
          : undefined,
      rescheduledOnly: status === "rescheduled",
      cancelledOnly: status === "cancelled",
      mode: mode || undefined,
      interviewer: interviewer || undefined,
    }),
    [selectedPublicJobId, search, status, mode, interviewer],
  );

  const listQuery = useQuery({
    queryKey: ["employer", "interviews", "list", filterKey, page, sort],
    queryFn: () =>
      fetchEmployerInterviews({
        ...sharedListFilters,
        quickDate: quickDate || undefined,
        interviewFrom: quickDate ? undefined : interviewFrom || undefined,
        interviewTo: quickDate ? undefined : interviewTo || undefined,
        page,
        limit: 10,
        sort,
      }),
    enabled: view === "list",
  });

  const calendarQuery = useQuery({
    queryKey: [
      "employer",
      "interviews",
      "calendar",
      filterKey,
      calendarRange?.from ?? "",
      calendarRange?.to ?? "",
    ],
    queryFn: () =>
      fetchEmployerInterviews({
        ...sharedListFilters,
        interviewFrom: calendarRange!.from,
        interviewTo: calendarRange!.to,
        page: 1,
        limit: 200,
        sort: "interview_asc",
      }),
    enabled:
      view === "calendar" && Boolean(calendarRange?.from && calendarRange?.to),
  });

  const statsQuery = useQuery({
    queryKey: ["employer", "interview-stats"],
    queryFn: () => fetchEmployerInterviewStats(),
  });

  const jobTabs = statsQuery.data?.jobTabs ?? [];
  const selectedJobTitle =
    selectedPublicJobId == null
      ? null
      : (jobTabs.find((tab) => tab.publicJobId === selectedPublicJobId)
          ?.jobTitle ?? selectedPublicJobId);

  const completeMutation = useMutation({
    mutationFn: (applicationId: string) =>
      updateEmployerApplicationStatus(applicationId, "interview_completed"),
    onSuccess: async () => {
      showAppToast("Interview marked as completed.", "success");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["employer", "interviews"] }),
        queryClient.invalidateQueries({
          queryKey: ["employer", "interview-stats"],
        }),
      ]);
    },
    onError: (error) => showAppToast(getErrorMessage(error), "error"),
  });

  const openCandidate = (
    applicationId: string,
    tab: CandidatesDetailTab = "interview",
  ) => {
    setSelectedId(applicationId);
    setActiveTab(tab);
    setMobileDetailOpen(true);
  };

  const openScheduleModal = (applicationId?: string | null) => {
    setEditApplicationId(applicationId ?? null);
    setScheduleModalOpen(true);
  };

  const clearInterviewFilters = () => {
    setQuickDate("");
    setStatus("");
    setMode("");
    setInterviewerDraft("");
    setInterviewFrom("");
    setInterviewTo("");
    setSearchDraft("");
    setSelectedPublicJobId(null);
  };

  const handleCalendarRangeChange = useCallback(
    (range: { from: string; to: string; mode: InterviewsCalendarMode }) => {
      setCalendarRange((current) => {
        if (
          current &&
          current.from === range.from &&
          current.to === range.to &&
          current.mode === range.mode
        ) {
          return current;
        }
        return range;
      });
    },
    [],
  );

  const interviews = listQuery.data?.interviews ?? [];
  const pagination = listQuery.data?.pagination;
  const calendarInterviews = calendarQuery.data?.interviews ?? [];
  const cancelLookup = view === "calendar" ? calendarInterviews : interviews;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 py-5 sm:px-5 lg:px-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Interviews
          </h1>
          <p className="mt-1 text-sm text-muted">
            Schedule, manage and track all interviews in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex overflow-hidden rounded-lg border border-border-subtle bg-surface"
            role="tablist"
            aria-label="Interviews view"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "calendar"}
              onClick={() => setView("calendar")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
                view === "calendar"
                  ? "bg-primary text-surface"
                  : "text-muted hover:bg-primary-light/40 hover:text-foreground",
              )}
            >
              <CalendarDays className="size-3.5" aria-hidden="true" />
              Calendar View
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "list"}
              aria-current={view === "list" ? "page" : undefined}
              onClick={() => setView("list")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
                view === "list"
                  ? "bg-primary text-surface"
                  : "text-muted hover:bg-primary-light/40 hover:text-foreground",
              )}
            >
              <List className="size-3.5" aria-hidden="true" />
              List View
            </button>
          </span>
          <button
            type="button"
            onClick={() => openScheduleModal(null)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <Plus className="size-4" aria-hidden="true" />
            Schedule Interview
          </button>
        </div>
      </header>

      <div className="mt-5">
        <InterviewsKpiStrip
          stats={statsQuery.data?.stats}
          isLoading={statsQuery.isLoading}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-stretch lg:grid-cols-1">
        <div className="flex min-h-0 min-w-0 flex-col gap-4 lg:min-h-[32rem] xl:min-h-[calc(100dvh-13rem)]">
          <div className="shrink-0 rounded-xl border border-border-subtle bg-surface p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <InterviewsJobSelect
                jobTabs={jobTabs}
                selectedPublicJobId={selectedPublicJobId}
                isLoading={statsQuery.isLoading}
                onSelect={setSelectedPublicJobId}
              />
              <label className="sr-only" htmlFor="interviews-search">
                Search interviews
              </label>
              <input
                id="interviews-search"
                type="search"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Search candidate, job, interviewer…"
                className={`${interviewsToolbarControlClassName} shrink-0 sm:max-w-sm`}
              />
            </div>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((open) => !open)}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface px-3 text-sm font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:hidden"
              aria-expanded={mobileFiltersOpen}
            >
              <Filter className="size-4" aria-hidden="true" />
              {mobileFiltersOpen ? "Hide filters" : "Show filters"}
            </button>
          </div>

          {mobileFiltersOpen ? (
            <div className="lg:hidden">
              <InterviewsFilterPanel
                quickDate={quickDate}
                status={status}
                mode={mode}
                interviewer={interviewerDraft}
                interviewFrom={interviewFrom}
                interviewTo={interviewTo}
                onQuickDateChange={setQuickDate}
                onStatusChange={setStatus}
                onModeChange={setMode}
                onInterviewerChange={setInterviewerDraft}
                onInterviewFromChange={setInterviewFrom}
                onInterviewToChange={setInterviewTo}
                onClear={clearInterviewFilters}
              />
            </div>
          ) : null}

          {view === "calendar" ? (
            <InterviewsCalendar
              interviews={calendarInterviews}
              isLoading={calendarQuery.isLoading || !calendarRange}
              isError={calendarQuery.isError}
              onRetry={() => void calendarQuery.refetch()}
              onSelect={(id) => openCandidate(id, "interview")}
              onScheduleInterview={() => openScheduleModal(null)}
              onRangeChange={handleCalendarRangeChange}
            />
          ) : (
            <InterviewsTable
              interviews={interviews}
              isLoading={listQuery.isLoading}
              isError={listQuery.isError}
              page={pagination?.page ?? page}
              limit={pagination?.limit ?? 10}
              total={pagination?.total ?? 0}
              totalPages={pagination?.totalPages ?? 1}
              sort={sort}
              emptyTitle={
                selectedJobTitle
                  ? "No interviews scheduled for this job."
                  : "No interviews scheduled"
              }
              emptyDescription={
                selectedJobTitle
                  ? "Schedule an interview for a candidate on this job to see it here."
                  : "Schedule an interview from a candidate profile to see it here."
              }
              onScheduleInterview={() => openScheduleModal(null)}
              onRetry={() => void listQuery.refetch()}
              onPageChange={setPage}
              onSortChange={setSort}
              onRowOpen={(id) => openCandidate(id, "profile")}
              onEditInterview={(id) => openScheduleModal(id)}
              onCompleteStatus={(id) => completeMutation.mutate(id)}
              onCancelInterview={(id) => setCancelApplicationId(id)}
            />
          )}
        </div>

        <aside
          className={cn("space-y-4", !mobileFiltersOpen && "hidden lg:block")}
        >
          <div className="hidden lg:block">
            <InterviewsFilterPanel
              quickDate={quickDate}
              status={status}
              mode={mode}
              interviewer={interviewerDraft}
              interviewFrom={interviewFrom}
              interviewTo={interviewTo}
              onQuickDateChange={setQuickDate}
              onStatusChange={setStatus}
              onModeChange={setMode}
              onInterviewerChange={setInterviewerDraft}
              onInterviewFromChange={setInterviewFrom}
              onInterviewToChange={setInterviewTo}
              onClear={clearInterviewFilters}
            />
          </div>
          <InterviewsTodaySchedule
            items={statsQuery.data?.todaysSchedule ?? []}
            isLoading={statsQuery.isLoading}
            onSelect={(id) => openCandidate(id, "interview")}
            onScheduleInterview={() => openScheduleModal(null)}
            onViewAll={() => {
              setView("list");
              setQuickDate("today");
              setPage(1);
            }}
          />
          <InterviewsStatusOverview />
        </aside>
      </div>

      {selectedId && mobileDetailOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close candidate details"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => {
              setMobileDetailOpen(false);
              setSelectedId(null);
            }}
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-2xl bg-hero-bg p-3 shadow-lg sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:max-h-none sm:w-[min(28rem,100%)] sm:rounded-none sm:p-4">
            <CandidatesDetailPanel
              applicationId={selectedId}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onClose={() => {
                setMobileDetailOpen(false);
                setSelectedId(null);
              }}
              variant="drawer"
            />
          </div>
        </div>
      ) : null}

      {scheduleModalOpen ? (
        <InterviewScheduleModal
          applicationId={editApplicationId}
          onClose={() => {
            setScheduleModalOpen(false);
            setEditApplicationId(null);
          }}
        />
      ) : null}

      {cancelApplicationId ? (
        <InterviewCancelModal
          applicationId={cancelApplicationId}
          candidateName={
            cancelLookup.find((item) => item.id === cancelApplicationId)
              ?.candidateName ?? "candidate"
          }
          onClose={() => setCancelApplicationId(null)}
        />
      ) : null}
    </div>
  );
}
