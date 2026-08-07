import { DEFAULT_SAVED_CANDIDATE_SORT } from "@/constants/saved-candidates";
import type {
  SavedCandidatePriority,
  SavedCandidateSort,
  SavedCandidatesViewMode,
} from "@/types/saved-candidates";

export function parseSavedCandidateSort(
  value: string | null,
): SavedCandidateSort {
  const allowed: SavedCandidateSort[] = [
    "recently_saved",
    "oldest_saved",
    "recently_updated",
    "experience",
    "expected_salary",
    "name_asc",
    "name_desc",
    "priority",
  ];
  if (value && allowed.includes(value as SavedCandidateSort)) {
    return value as SavedCandidateSort;
  }
  return DEFAULT_SAVED_CANDIDATE_SORT;
}

export function parseSavedCandidateTag(
  value: string | null,
): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function parseSavedCandidatePriority(
  value: string | null,
): SavedCandidatePriority | undefined {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return undefined;
}

export function parseSavedCandidatesViewMode(
  value: string | null,
): SavedCandidatesViewMode {
  return value === "grid" ? "grid" : "table";
}

export function formatSavedCandidateChangePercent(
  value: number | null | undefined,
): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded}%`;
}

export function getSavedCandidatesApiErrorMessage(error: unknown): string {
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

export function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** True when an interview has been scheduled for this application. */
export function hasSavedCandidateInterviewScheduled(input: {
  hasActiveInterview?: boolean;
  applicationStatus?: string;
}): boolean {
  if (typeof input.hasActiveInterview === "boolean") {
    return input.hasActiveInterview;
  }
  return (
    input.applicationStatus === "interview_scheduled" ||
    input.applicationStatus === "interview_completed"
  );
}
