import { SAVED_CANDIDATE_PRIORITIES } from "../saved-candidates/saved-candidate.constants.js";

export const APPLICATION_SHORTLIST_PRIORITIES = SAVED_CANDIDATE_PRIORITIES;

export const APPLICATION_SHORTLIST_NEXT_ACTIONS = [
  "none",
  "schedule_interview",
  "send_message",
  "call_candidate",
] as const;

export type ApplicationShortlistNextAction =
  (typeof APPLICATION_SHORTLIST_NEXT_ACTIONS)[number];

export const APPLICATION_SHORTLIST_NEXT_ACTION_LABELS: Record<
  ApplicationShortlistNextAction,
  string
> = {
  none: "No Further Action",
  schedule_interview: "Schedule Interview",
  send_message: "Send Message",
  call_candidate: "Call Candidate",
};

export const DEFAULT_APPLICATION_SHORTLIST_NEXT_ACTION: ApplicationShortlistNextAction =
  "none";
