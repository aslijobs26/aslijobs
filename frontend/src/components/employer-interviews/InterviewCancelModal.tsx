"use client";

import { cancelEmployerApplicationInterview } from "@/services/employer-applications.service";
import type { CancelEmployerInterviewPayload } from "@/services/employer-applications.service";
import { showAppToast } from "@/utils/share-job";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";

const REASON_OPTIONS: CancelEmployerInterviewPayload["reason"][] = [
  "Interviewer unavailable",
  "Candidate unavailable",
  "Position closed",
  "Position filled",
  "Scheduling conflict",
  "Other",
];

type InterviewCancelModalProps = {
  applicationId: string;
  candidateName: string;
  onClose: () => void;
};

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
  return "Unable to cancel interview. Please try again.";
}

export function InterviewCancelModal({
  applicationId,
  candidateName,
  onClose,
}: InterviewCancelModalProps) {
  const queryClient = useQueryClient();
  const titleId = useId();
  const reasonId = useId();
  const otherReasonId = useId();
  const [reason, setReason] = useState<
    CancelEmployerInterviewPayload["reason"] | ""
  >("");
  const [otherReason, setOtherReason] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const cancelMutation = useMutation({
    mutationFn: () => {
      if (!reason) {
        throw new Error("Please select a cancellation reason.");
      }
      return cancelEmployerApplicationInterview(applicationId, {
        reason,
        otherReason: reason === "Other" ? otherReason.trim() : "",
      });
    },
    onSuccess: async () => {
      showAppToast("Interview cancelled. Candidate has been notified.", "success");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["employer", "interviews"] }),
        queryClient.invalidateQueries({
          queryKey: ["employer", "interview-stats"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["employer", "application", applicationId],
        }),
        queryClient.invalidateQueries({ queryKey: ["employer", "applications"] }),
      ]);
      onClose();
    },
    onError: (error) => showAppToast(getErrorMessage(error), "error"),
  });

  const canConfirm =
    Boolean(reason) &&
    (reason !== "Other" || otherReason.trim().length > 0) &&
    !cancelMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close cancel interview dialog"
        className="absolute inset-0 bg-foreground/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <div>
            <h2 id={titleId} className="text-base font-bold text-foreground">
              Cancel Interview
            </h2>
            <p className="mt-1 text-sm text-muted">
              Are you sure you want to cancel this interview with{" "}
              <span className="font-semibold text-foreground">
                {candidateName}
              </span>
              ? This action will notify the candidate.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 px-4 py-4">
          <div>
            <label
              htmlFor={reasonId}
              className="block text-xs font-semibold text-muted"
            >
              Reason
            </label>
            <select
              id={reasonId}
              value={reason}
              onChange={(event) =>
                setReason(
                  event.target.value as CancelEmployerInterviewPayload["reason"] | "",
                )
              }
              className="mt-1.5 h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <option value="" disabled>
                Select a reason…
              </option>
              {REASON_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {reason === "Other" ? (
            <div>
              <label
                htmlFor={otherReasonId}
                className="block text-xs font-semibold text-muted"
              >
                Reason details
              </label>
              <textarea
                id={otherReasonId}
                value={otherReason}
                onChange={(event) => setOtherReason(event.target.value)}
                rows={3}
                required
                placeholder="Enter cancellation reason…"
                className="mt-1.5 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border-subtle px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-subtle px-3 py-2 text-sm font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => cancelMutation.mutate()}
            className="rounded-lg bg-pin-state px-3 py-2 text-sm font-semibold text-surface hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pin-state/30"
          >
            {cancelMutation.isPending ? "Cancelling…" : "Confirm Cancellation"}
          </button>
        </div>
      </div>
    </div>
  );
}
