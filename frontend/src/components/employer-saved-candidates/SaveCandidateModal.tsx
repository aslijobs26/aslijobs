"use client";

import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import { getSavedCandidatesApiErrorMessage } from "@/components/employer-saved-candidates/saved-candidates-utils";
import {
  SAVED_CANDIDATE_PRESET_TAG_LABELS,
  SAVED_CANDIDATE_PRESET_TAG_VALUES,
  SAVED_CANDIDATE_PRIORITIES,
  SAVED_CANDIDATE_PRIORITY_LABELS,
  SAVED_CANDIDATES_MAX_NOTES_LENGTH,
  SAVED_CANDIDATES_MAX_TAG_LENGTH,
  SAVED_CANDIDATES_MAX_TAGS,
  getSavedCandidateTagLabel,
} from "@/constants/saved-candidates";
import {
  fetchEmployerApplication,
  shortlistEmployerApplication,
} from "@/services/employer-applications.service";
import {
  saveCandidateApplication,
  savedCandidatesQueryKeys,
  updateSavedCandidate,
} from "@/services/saved-candidates.service";
import type { EmployerRegisterSelectOption } from "@/types/employer-register";
import type {
  SavedCandidateApplicationSummary,
  SavedCandidatePriority,
} from "@/types/saved-candidates";
import { cn } from "@/utils/cn";
import { showAppToast } from "@/utils/share-job";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

const prioritySelectOptions: EmployerRegisterSelectOption[] =
  SAVED_CANDIDATE_PRIORITIES.map((value) => ({
    value,
    label: SAVED_CANDIDATE_PRIORITY_LABELS[value],
  }));

export type SaveCandidateModalMode = "save" | "edit";

export type SaveCandidateModalInitialValues = {
  priority?: SavedCandidatePriority | null;
  tags?: string[];
  notes?: string;
};

type SaveCandidateModalProps = {
  application: SavedCandidateApplicationSummary;
  mode: SaveCandidateModalMode;
  savedCandidateId?: string;
  initialValues?: SaveCandidateModalInitialValues;
  /**
   * When true, Save Candidate also sets application status to Shortlisted
   * (status changes only after confirm — never on dropdown select alone).
   */
  shortlistOnSave?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

function normalizeCustomTag(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function isValidCustomTag(value: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9 _-]*$/.test(value);
}

export function SaveCandidateModal({
  application,
  mode,
  savedCandidateId,
  initialValues,
  shortlistOnSave = false,
  onClose,
  onSuccess,
}: SaveCandidateModalProps) {
  const titleId = useId();
  const priorityId = useId();
  const notesId = useId();
  const customTagId = useId();
  const queryClient = useQueryClient();

  const [priority, setPriority] = useState<SavedCandidatePriority | "">(
    initialValues?.priority ?? "",
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialValues?.tags ?? [],
  );
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [customTagDraft, setCustomTagDraft] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [hydratedForId, setHydratedForId] = useState<string | null>(null);

  const prefillQuery = useQuery({
    queryKey: ["employer", "application", application.applicationId],
    queryFn: () => fetchEmployerApplication(application.applicationId),
    enabled:
      shortlistOnSave &&
      !initialValues &&
      hydratedForId !== application.applicationId,
    staleTime: 30_000,
  });

  useEffect(() => {
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
  }, [onClose]);

  useEffect(() => {
    if (hydratedForId === application.applicationId) {
      return;
    }

    if (initialValues) {
      setPriority(initialValues.priority ?? "");
      setSelectedTags(initialValues.tags ?? []);
      setNotes(initialValues.notes ?? "");
      setHydratedForId(application.applicationId);
      return;
    }

    if (!shortlistOnSave || !prefillQuery.data) {
      return;
    }

    const saved = prefillQuery.data.savedCandidate;
    const shortlist = prefillQuery.data.shortlist;
    setPriority(shortlist?.priority ?? saved?.priority ?? "");
    setSelectedTags(shortlist?.tags ?? saved?.tags ?? []);
    setNotes(shortlist?.notes ?? saved?.notes ?? "");
    setHydratedForId(application.applicationId);
  }, [
    application.applicationId,
    hydratedForId,
    initialValues,
    prefillQuery.data,
    shortlistOnSave,
  ]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (priority !== "high" && priority !== "medium" && priority !== "low") {
        throw new Error("Select a priority.");
      }

      const payload = {
        priority,
        tags: selectedTags,
        notes: notes.trim(),
      };

      if (shortlistOnSave) {
        return shortlistEmployerApplication(application.applicationId, {
          ...payload,
          nextAction: "none",
          alsoSave: true,
        });
      }

      if (mode === "edit") {
        if (!savedCandidateId) {
          throw new Error("Missing saved candidate id.");
        }
        return updateSavedCandidate(savedCandidateId, payload);
      }

      return saveCandidateApplication({
        applicationId: application.applicationId,
        ...payload,
      });
    },
    onSuccess: async () => {
      const invalidations = [
        queryClient.invalidateQueries({
          queryKey: savedCandidatesQueryKeys.all,
        }),
      ];

      if (shortlistOnSave) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: ["employer", "applications"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["employer", "application-stats"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["employer", "application", application.applicationId],
          }),
          queryClient.invalidateQueries({ queryKey: ["employer-jobs"] }),
          queryClient.invalidateQueries({
            queryKey: ["employer-dashboard-home"],
          }),
        );
      }

      await Promise.all(invalidations);

      showAppToast(
        shortlistOnSave
          ? "Candidate shortlisted successfully."
          : mode === "edit"
            ? "Saved candidate updated."
            : "Candidate saved successfully.",
      );
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      showAppToast(getSavedCandidatesApiErrorMessage(error), "error");
    },
  });

  const toggleTag = (tag: string) => {
    setFormError(null);
    setSelectedTags((current) => {
      if (current.includes(tag)) {
        return current.filter((value) => value !== tag);
      }
      if (current.length >= SAVED_CANDIDATES_MAX_TAGS) {
        setFormError(`You can select up to ${SAVED_CANDIDATES_MAX_TAGS} tags.`);
        return current;
      }
      return [...current, tag];
    });
  };

  const addCustomTag = () => {
    const normalized = normalizeCustomTag(customTagDraft);
    setFormError(null);

    if (!normalized) {
      return;
    }
    if (normalized.length < 2) {
      setFormError("Custom tags must be at least 2 characters.");
      return;
    }
    if (normalized.length > SAVED_CANDIDATES_MAX_TAG_LENGTH) {
      setFormError(
        `Custom tags must be at most ${SAVED_CANDIDATES_MAX_TAG_LENGTH} characters.`,
      );
      return;
    }
    if (!isValidCustomTag(normalized)) {
      setFormError(
        "Tags may only include letters, numbers, spaces, hyphens, and underscores.",
      );
      return;
    }

    const exists = selectedTags.some(
      (tag) => tag.toLowerCase() === normalized.toLowerCase(),
    );
    if (exists) {
      setCustomTagDraft("");
      return;
    }
    if (selectedTags.length >= SAVED_CANDIDATES_MAX_TAGS) {
      setFormError(`You can select up to ${SAVED_CANDIDATES_MAX_TAGS} tags.`);
      return;
    }

    setSelectedTags((current) => [...current, normalized]);
    setCustomTagDraft("");
  };

  const customSelectedTags = selectedTags.filter(
    (tag) =>
      !(SAVED_CANDIDATE_PRESET_TAG_VALUES as readonly string[]).includes(tag),
  );

  const summaryParts = [
    application.experience?.trim() || null,
    application.location?.trim() || null,
  ].filter(Boolean);

  const title = shortlistOnSave
    ? "Shortlisted Candidate"
    : mode === "edit"
      ? "Edit Saved Candidate"
      : "Save Candidate";
  const confirmLabel = shortlistOnSave
    ? "Shortlist Candidate"
    : mode === "edit"
      ? "Save changes"
      : "Save";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40"
        aria-label="Close save candidate dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(92dvh,42rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle p-4 sm:p-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-lg font-bold tracking-tight text-foreground"
            >
              {title}
            </h2>
            <p className="mt-1 truncate text-sm font-semibold text-foreground">
              {application.candidateName}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted">
              {application.jobTitle}
              {summaryParts.length ? ` · ${summaryParts.join(" · ")}` : ""}
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

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          <div className="block">
            <span className="mb-1.5 block text-xs font-semibold text-foreground">
              Priority <span className="text-red-600">*</span>
            </span>
            <EmployerRegisterSearchableSelect
              id={priorityId}
              label="Priority"
              hideLabel
              value={priority}
              placeholder="Select priority"
              options={prioritySelectOptions}
              onChange={(value) => {
                if (
                  value === "high" ||
                  value === "medium" ||
                  value === "low"
                ) {
                  setPriority(value);
                }
              }}
              hideSearch
              triggerClassName="!h-11 w-full rounded-xl border-border bg-surface !text-sm shadow-sm transition-[border-color,box-shadow] hover:border-primary/25 focus-visible:border-primary-soft focus-visible:ring-2 focus-visible:ring-primary-soft/20"
            />
          </div>

          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold text-foreground">
              Tags
            </legend>
            <div className="flex flex-wrap gap-2">
              {SAVED_CANDIDATE_PRESET_TAG_VALUES.map((tag) => {
                const isActive = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      isActive
                        ? "bg-primary text-surface ring-primary"
                        : "bg-surface text-foreground ring-border-subtle hover:ring-primary/40",
                    )}
                    aria-pressed={isActive}
                  >
                    {SAVED_CANDIDATE_PRESET_TAG_LABELS[tag]}
                  </button>
                );
              })}
              {customSelectedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-surface ring-1 ring-inset ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  aria-pressed
                >
                  {getSavedCandidateTagLabel(tag)}
                  <X className="size-3" aria-hidden="true" />
                </button>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <label className="min-w-0 flex-1" htmlFor={customTagId}>
                <span className="sr-only">Add custom tag</span>
                <input
                  id={customTagId}
                  type="text"
                  value={customTagDraft}
                  maxLength={SAVED_CANDIDATES_MAX_TAG_LENGTH}
                  onChange={(event) => setCustomTagDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addCustomTag();
                    }
                  }}
                  placeholder="Create custom tag…"
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted/80 focus:border-primary-soft focus:ring-2 focus:ring-primary-soft/20"
                />
              </label>
              <button
                type="button"
                onClick={addCustomTag}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-xl border border-border-subtle px-3 text-xs font-semibold text-foreground hover:bg-primary-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Add
              </button>
            </div>
          </fieldset>

          <label className="block" htmlFor={notesId}>
            <span className="mb-1.5 block text-xs font-semibold text-foreground">
              Notes
            </span>
            <textarea
              id={notesId}
              value={notes}
              maxLength={SAVED_CANDIDATES_MAX_NOTES_LENGTH}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder="Add notes about this candidate…"
              className="w-full resize-y rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted/80 focus:border-primary-soft focus:ring-2 focus:ring-primary-soft/20"
            />
            <span className="mt-1 block text-right text-[11px] text-muted">
              {notes.length}/{SAVED_CANDIDATES_MAX_NOTES_LENGTH}
            </span>
          </label>

          {formError ? (
            <p className="text-xs font-medium text-red-600" role="alert">
              {formError}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border-subtle p-4 sm:p-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border-subtle px-4 text-sm font-semibold text-foreground hover:bg-primary-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => {
              if (
                priority !== "high" &&
                priority !== "medium" &&
                priority !== "low"
              ) {
                setFormError("Select a priority.");
                return;
              }
              setFormError(null);
              mutation.mutate();
            }}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
          >
            {mutation.isPending ? "Saving…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
