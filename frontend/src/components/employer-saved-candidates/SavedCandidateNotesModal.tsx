"use client";

import { getSavedCandidatesApiErrorMessage } from "@/components/employer-saved-candidates/saved-candidates-utils";
import { SAVED_CANDIDATES_MAX_NOTES_LENGTH } from "@/constants/saved-candidates";
import {
  savedCandidatesQueryKeys,
  updateSavedCandidate,
} from "@/services/saved-candidates.service";
import type { SavedCandidateListItem } from "@/types/saved-candidates";
import { showAppToast } from "@/utils/share-job";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";

type SavedCandidateNotesModalProps = {
  item: SavedCandidateListItem;
  onClose: () => void;
};

export function SavedCandidateNotesModal({
  item,
  onClose,
}: SavedCandidateNotesModalProps) {
  const titleId = useId();
  const notesId = useId();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(item.notes ?? "");

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

  const mutation = useMutation({
    mutationFn: () => updateSavedCandidate(item.id, { notes: notes.trim() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: savedCandidatesQueryKeys.all,
      });
      showAppToast("Notes saved.");
      onClose();
    },
    onError: (error) => {
      showAppToast(getSavedCandidatesApiErrorMessage(error), "error");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40"
        aria-label="Close notes dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-border-subtle bg-surface p-4 shadow-xl sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-lg font-bold tracking-tight text-foreground"
            >
              Saved candidate notes
            </h2>
            <p className="mt-1 text-sm text-muted">
              Private to your team — not visible on the application notes tab.
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

        <label className="mt-4 block" htmlFor={notesId}>
          <span className="mb-1.5 block text-xs font-semibold text-muted">
            Notes for {item.candidateName}
          </span>
          <textarea
            id={notesId}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={SAVED_CANDIDATES_MAX_NOTES_LENGTH}
            rows={6}
            className="w-full resize-y rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted/80 focus:border-primary-soft focus:ring-2 focus:ring-primary-soft/20"
            placeholder="Add hiring notes, follow-up reminders, or context for your team…"
          />
          <span className="mt-1 block text-right text-xs text-muted">
            {notes.length}/{SAVED_CANDIDATES_MAX_NOTES_LENGTH}
          </span>
        </label>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
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
            onClick={() => mutation.mutate()}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
          >
            {mutation.isPending ? "Saving…" : "Save notes"}
          </button>
        </div>
      </div>
    </div>
  );
}
