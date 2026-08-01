"use client";

import { formatCandidateDateTime } from "@/components/employer-candidates/candidates-ats-utils";
import { isEmployerTerminalStatus } from "@/types/employer-applications";
import type { EmployerApplicationDetail } from "@/types/employer-applications";
import { cn } from "@/utils/cn";
import { useEffect, useState } from "react";

export const EMPLOYER_NOTES_MAX_LENGTH = 5000;

type EmployerCandidateNotesEditorProps = {
  application: EmployerApplicationDetail;
  isSaving: boolean;
  onSave: (payload: {
    notes: string;
    employerNotesVisibleToSeeker: boolean;
  }) => void;
  className?: string;
  compact?: boolean;
  canWrite?: boolean;
};

export function EmployerCandidateNotesEditor({
  application,
  isSaving,
  onSave,
  className,
  compact = false,
  canWrite = true,
}: EmployerCandidateNotesEditorProps) {
  const [notesDraft, setNotesDraft] = useState(application.employerNotes ?? "");
  const [notesVisible, setNotesVisible] = useState(
    application.employerNotesVisibleToSeeker === true,
  );

  useEffect(() => {
    setNotesDraft(application.employerNotes ?? "");
    setNotesVisible(application.employerNotesVisibleToSeeker === true);
  }, [
    application.id,
    application.employerNotes,
    application.employerNotesVisibleToSeeker,
    application.employerNotesUpdatedAt,
  ]);

  const isTerminal = isEmployerTerminalStatus(application.status);
  const isReadOnly = isTerminal || !canWrite;
  const savedNotes = application.employerNotes ?? "";
  const savedVisible = application.employerNotesVisibleToSeeker === true;
  const isDirty =
    notesDraft.trim() !== savedNotes.trim() || notesVisible !== savedVisible;
  const isOverLimit = notesDraft.length > EMPLOYER_NOTES_MAX_LENGTH;
  const canSave =
    canWrite && !isTerminal && !isSaving && isDirty && !isOverLimit;

  const handleSave = () => {
    if (!canSave) {
      return;
    }
    onSave({
      notes: notesDraft.trim(),
      employerNotesVisibleToSeeker: notesVisible,
    });
  };

  const handleDelete = () => {
    if (isReadOnly || isSaving) {
      return;
    }
    setNotesDraft("");
    setNotesVisible(false);
    onSave({
      notes: "",
      employerNotesVisibleToSeeker: false,
    });
  };

  const createdAt = application.employerNotesCreatedAt ?? null;
  const updatedAt = application.employerNotesUpdatedAt ?? null;
  const updatedBy = application.employerNotesUpdatedByName?.trim() || null;
  const hasSavedNotes = savedNotes.trim().length > 0;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
            savedVisible
              ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
              : "bg-slate-50 text-slate-700 ring-slate-200",
          )}
        >
          {savedVisible ? "SHARED WITH CANDIDATE" : "PRIVATE"}
        </span>
        {isReadOnly ? (
          <span className="text-xs text-muted">
            {isTerminal
              ? "This candidate is in a terminal hiring status. Notes are read-only."
              : "You do not have permission to edit notes."}
          </span>
        ) : (
          <span className="text-xs text-muted">
            Private by default. Clear and save to delete notes.
          </span>
        )}
      </div>

      <label className="sr-only" htmlFor={`employer-notes-${application.id}`}>
        Employer notes
      </label>
      <textarea
        id={`employer-notes-${application.id}`}
        rows={compact ? 6 : 5}
        value={notesDraft}
        maxLength={EMPLOYER_NOTES_MAX_LENGTH}
        disabled={isReadOnly || isSaving}
        onChange={(event) =>
          setNotesDraft(event.target.value.slice(0, EMPLOYER_NOTES_MAX_LENGTH))
        }
        className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
        placeholder="Add recruiter notes…"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className={cn(
            "text-xs",
            isOverLimit ? "font-medium text-red-600" : "text-muted",
          )}
        >
          {notesDraft.length} / {EMPLOYER_NOTES_MAX_LENGTH}
        </p>
        {isOverLimit ? (
          <p className="text-xs font-medium text-red-600">
            Notes must be 5000 characters or fewer.
          </p>
        ) : null}
      </div>

      <label className="flex items-start gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={notesVisible}
          disabled={isReadOnly || isSaving}
          onChange={(event) => setNotesVisible(event.target.checked)}
          className="mt-0.5 size-4 rounded border-border-subtle text-primary focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed"
        />
        <span>Share notes with candidate</span>
      </label>

      <dl className="grid gap-2 rounded-lg border border-border-subtle bg-hero-bg px-3 py-2 text-xs sm:grid-cols-3">
        <div>
          <dt className="font-medium text-muted">Added By</dt>
          <dd className="mt-0.5 text-foreground">{updatedBy || "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted">Created</dt>
          <dd className="mt-0.5 text-foreground">
            {formatCandidateDateTime(createdAt)}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-muted">Updated</dt>
          <dd className="mt-0.5 text-foreground">
            {updatedAt
              ? formatCandidateDateTime(updatedAt)
              : createdAt
                ? formatCandidateDateTime(createdAt)
                : "—"}
          </dd>
        </div>
      </dl>

      {canWrite ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className={cn(
              "inline-flex min-h-9 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60",
              !compact && "min-h-10 w-full text-sm sm:w-auto",
            )}
          >
            {isSaving ? "Saving…" : "Save notes"}
          </button>
          <button
            type="button"
            disabled={isReadOnly || isSaving || (!hasSavedNotes && !notesDraft)}
            onClick={handleDelete}
            className={cn(
              "inline-flex min-h-9 items-center justify-center rounded-lg border border-border-subtle px-3 text-xs font-semibold text-foreground hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60",
              !compact && "min-h-10 w-full text-sm sm:w-auto",
            )}
          >
            Delete notes
          </button>
        </div>
      ) : null}
    </div>
  );
}
