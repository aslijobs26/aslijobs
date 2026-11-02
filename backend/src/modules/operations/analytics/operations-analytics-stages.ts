export type StageHistoryEvent = {
  status: string;
  at: Date | string;
  remark?: string;
};

export type StageReach = {
  shortlisted: boolean;
  interviewScheduled: boolean;
  interviewCompleted: boolean;
  offerSent: boolean;
  selected: boolean;
  joined: boolean;
  rescheduled: boolean;
  cancelled: boolean;
};

const RESCHEDULE_REMARK = /^Interview Rescheduled/i;

function inWindow(value: Date | string, from: Date, to: Date): boolean {
  const time = new Date(value).getTime();
  return !Number.isNaN(time) && time >= from.getTime() && time <= to.getTime();
}

/**
 * One application counts once per stage.
 * A later rejection does not remove an earlier stage whose timestamp is in range.
 * Interview completion is only an interview_completed history event.
 * Joined is only a joined history event, never selected.
 * Rescheduled is a history remark, or a second interview_scheduled event in range.
 */
export function reachFromHistory(
  events: StageHistoryEvent[],
  from: Date,
  to: Date,
  cancelledAt?: Date | string | null,
): StageReach {
  const inRange = events.filter((event) => inWindow(event.at, from, to));
  const has = (status: string) => inRange.some((event) => event.status === status);
  const scheduledEvents = inRange.filter((event) => event.status === "interview_scheduled");
  const rescheduled =
    inRange.some((event) => RESCHEDULE_REMARK.test(event.remark ?? "")) ||
    scheduledEvents.length >= 2;
  return {
    shortlisted: has("shortlisted"),
    interviewScheduled: scheduledEvents.length > 0,
    interviewCompleted: has("interview_completed"),
    offerSent: has("offer_sent"),
    selected: has("selected"),
    joined: has("joined"),
    rescheduled,
    cancelled: cancelledAt != null && inWindow(cancelledAt, from, to),
  };
}

export function summarizeStageFixture(
  applications: Array<{
    events: StageHistoryEvent[];
    cancelledAt?: Date | string | null;
  }>,
  from: Date,
  to: Date,
): Record<keyof StageReach, number> {
  const totals: Record<keyof StageReach, number> = {
    shortlisted: 0,
    interviewScheduled: 0,
    interviewCompleted: 0,
    offerSent: 0,
    selected: 0,
    joined: 0,
    rescheduled: 0,
    cancelled: 0,
  };
  for (const application of applications) {
    const reach = reachFromHistory(application.events, from, to, application.cancelledAt);
    for (const key of Object.keys(totals) as Array<keyof StageReach>) {
      if (reach[key]) totals[key] += 1;
    }
  }
  return totals;
}
