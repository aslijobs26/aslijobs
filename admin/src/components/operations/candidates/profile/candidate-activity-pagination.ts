import type {
  OperationsCandidateActivityCategory,
  OperationsCandidateActivityParams,
} from "../../../../types/operations-candidates.ts";
import {
  activityPageRange,
  activityParams,
  filterActivity,
  initialActivityView,
  newerActivityPage,
  olderActivityPage,
  resizeActivity,
  type ActivityView,
} from "../../activity/activity-pagination.ts";

export type CandidateActivityView = ActivityView<OperationsCandidateActivityCategory>;

export function initialCandidateActivityView(limit = 20): CandidateActivityView {
  return initialActivityView(limit);
}

export function candidateActivityParams(
  view: CandidateActivityView,
): OperationsCandidateActivityParams {
  return activityParams(view);
}

export function olderCandidateActivityPage(
  view: CandidateActivityView,
  nextCursor: string | null,
): CandidateActivityView {
  return olderActivityPage(view, nextCursor);
}

export function newerCandidateActivityPage(
  view: CandidateActivityView,
): CandidateActivityView {
  return newerActivityPage(view);
}

/** Cursors are only valid for the filter and page size that produced them. */
export function filterCandidateActivity(
  view: CandidateActivityView,
  category: CandidateActivityView["category"],
): CandidateActivityView {
  return filterActivity(view, category);
}

export function resizeCandidateActivity(
  view: CandidateActivityView,
  limit: number,
): CandidateActivityView {
  return resizeActivity(view, limit);
}

export function candidateActivityPageRange(
  view: CandidateActivityView,
  eventCount: number,
): { from: number; to: number } {
  return activityPageRange(view, eventCount);
}
