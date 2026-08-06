import {
  hasRequiredInterviewDetails,
  hasRequiredOfferDetails,
  type EmployerApplicationStatus,
} from "@/types/employer-applications";
import type {
  ApplicationInterview,
  ApplicationOffer,
} from "@/types/job-seeker-applications";

export type EmployerStatusSelectResult =
  | { action: "mutate"; status: EmployerApplicationStatus }
  | { action: "open_shortlist"; message: string }
  | { action: "open_interview"; message: string }
  | { action: "open_offer"; message: string }
  | { action: "blocked"; message: string };

/**
 * Client-side hiring pipeline guard for status dropdowns.
 * Backend remains the final authority.
 */
export function resolveEmployerStatusSelect(input: {
  nextStatus: EmployerApplicationStatus;
  interview: ApplicationInterview;
  offer: ApplicationOffer;
}): EmployerStatusSelectResult {
  const { nextStatus, interview, offer } = input;

  if (nextStatus === "shortlisted") {
    return {
      action: "open_shortlist",
      message:
        "Save the candidate with priority, tags, and notes to set status to Shortlisted.",
    };
  }

  if (nextStatus === "interview_scheduled") {
    return {
      action: "open_interview",
      message:
        "Fill interview details and save to set status to Interview Scheduled.",
    };
  }

  if (nextStatus === "interview_completed") {
    if (!hasRequiredInterviewDetails(interview)) {
      return {
        action: "blocked",
        message:
          "Schedule and complete an interview before marking it as completed.",
      };
    }
  }

  if (nextStatus === "offer_sent") {
    if (!hasRequiredOfferDetails(offer)) {
      return {
        action: "open_offer",
        message:
          "Complete offer details (offer date, joining date, and package) before sending an offer.",
      };
    }
  }

  if (nextStatus === "joined") {
    // Transition map already limits this; keep a clear client message if offer is incomplete.
    if (!hasRequiredOfferDetails(offer)) {
      return {
        action: "blocked",
        message: "Send an offer before marking the candidate as joined.",
      };
    }
  }

  return { action: "mutate", status: nextStatus };
}
