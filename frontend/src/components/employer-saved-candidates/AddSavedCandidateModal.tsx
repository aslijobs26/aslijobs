"use client";

import { SaveCandidateModal } from "@/components/employer-saved-candidates/SaveCandidateModal";
import {
  fetchSavedCandidateApplicationIds,
  savedCandidatesQueryKeys,
} from "@/services/saved-candidates.service";
import { fetchEmployerApplications } from "@/services/employer-applications.service";
import type { SavedCandidateApplicationSummary } from "@/types/saved-candidates";
import { cn } from "@/utils/cn";
import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

type AddSavedCandidateModalProps = {
  onClose: () => void;
  onSaved?: () => void;
};

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function AddSavedCandidateModal({
  onClose,
  onSaved,
}: AddSavedCandidateModalProps) {
  const titleId = useId();
  const searchId = useId();
  const [searchDraft, setSearchDraft] = useState("");
  const search = useDebouncedValue(searchDraft.trim(), 300);
  const [pendingSave, setPendingSave] =
    useState<SavedCandidateApplicationSummary | null>(null);

  useEffect(() => {
    if (pendingSave) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, pendingSave]);

  const savedIdsQuery = useQuery({
    queryKey: savedCandidatesQueryKeys.ids(),
    queryFn: fetchSavedCandidateApplicationIds,
    staleTime: 30_000,
  });

  const applicationsQuery = useQuery({
    queryKey: ["employer", "applications", "add-saved-candidate", search],
    queryFn: () =>
      fetchEmployerApplications({
        search: search || undefined,
        sort: "newest",
        page: 1,
        limit: 25,
      }),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const savedIdSet = useMemo(
    () => new Set(savedIdsQuery.data?.applicationIds ?? []),
    [savedIdsQuery.data?.applicationIds],
  );

  const candidates = useMemo(
    () =>
      (applicationsQuery.data?.applications ?? []).filter(
        (item) => !savedIdSet.has(item.id),
      ),
    [applicationsQuery.data?.applications, savedIdSet],
  );

  if (pendingSave) {
    return (
      <SaveCandidateModal
        application={pendingSave}
        mode="save"
        onClose={() => setPendingSave(null)}
        onSuccess={() => {
          onSaved?.();
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40"
        aria-label="Close add candidate dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(90dvh,40rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle p-4 sm:p-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-lg font-bold tracking-tight text-foreground"
            >
              Add saved candidate
            </h2>
            <p className="mt-1 text-sm text-muted">
              Search applicants from your jobs and save them to this list.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="border-b border-border-subtle p-4 sm:px-5">
          <label className="relative block" htmlFor={searchId}>
            <span className="sr-only">Search applications</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              id={searchId}
              type="search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search by name, job, location, phone…"
              className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm text-foreground shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted/80 focus:border-primary-soft focus:ring-2 focus:ring-primary-soft/20"
              autoFocus
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-3">
          {applicationsQuery.isLoading ? (
            <p className="px-2 py-6 text-center text-sm text-muted">
              Loading applicants…
            </p>
          ) : candidates.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted">
              {search
                ? "No matching applicants found, or they are already saved."
                : "Start typing to search applicants from your jobs."}
            </p>
          ) : (
            <ul className="space-y-1">
              {candidates.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingSave({
                        applicationId: item.id,
                        candidateName: item.candidateName,
                        jobTitle: item.jobTitle,
                        experience: item.candidateExperienceLabel,
                        location: item.candidateLocation,
                      })
                    }
                    className={cn(
                      "flex w-full flex-col gap-0.5 rounded-xl border border-transparent px-3 py-3 text-left transition-colors hover:border-primary/20 hover:bg-primary-light/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:flex-row sm:items-center sm:justify-between",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-foreground">
                        {item.candidateName}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {item.jobTitle} · {item.publicJobId}
                      </span>
                    </span>
                    <span className="mt-2 shrink-0 text-xs font-semibold text-primary sm:mt-0">
                      Save
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
