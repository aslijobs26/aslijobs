import { OperationsNotificationModel } from "../registration-awareness/operations-notification.model.js";

export type WorkAssignmentNotifyInput = {
  workItemId: string;
  displayId: string;
  title: string;
  assigneeUserId: string;
  actorName: string;
  kind: "assigned" | "reassigned" | "claimed";
  previousAssigneeUserId?: string | null;
};

function idempotencyKey(
  kind: WorkAssignmentNotifyInput["kind"],
  workItemId: string,
  assigneeUserId: string,
  atIso: string,
): string {
  return `work.${kind}:${workItemId}:${assigneeUserId}:${atIso}`;
}

/**
 * Assignee-targeted Operations inbox notification for work assignment.
 * Best-effort; never throws to the caller.
 */
export async function emitWorkAssignmentNotification(
  input: WorkAssignmentNotifyInput,
): Promise<void> {
  const now = new Date();
  const type =
    input.kind === "reassigned"
      ? "work.reassigned"
      : input.kind === "claimed"
        ? "work.claimed"
        : "work.assigned";
  const title =
    input.kind === "reassigned"
      ? "Work reassigned to you"
      : input.kind === "claimed"
        ? "Work claimed"
        : "New work assigned to you";
  const body = `${input.displayId} · ${input.title}`;
  const key = idempotencyKey(
    input.kind,
    input.workItemId,
    input.assigneeUserId,
    now.toISOString(),
  );

  try {
    await OperationsNotificationModel.updateOne(
      { idempotencyKey: key },
      {
        $setOnInsert: {
          idempotencyKey: key,
          type,
          title,
          body,
          entityType: "work",
          entityId: input.workItemId,
          actionPath: `/operations/my-work/${encodeURIComponent(input.workItemId)}`,
          actorName: input.actorName || "SYSTEM",
          recipientUserId: input.assigneeUserId,
          metadata: {
            workItemId: input.workItemId,
            displayId: input.displayId,
            kind: input.kind,
            previousAssigneeUserId: input.previousAssigneeUserId ?? null,
          },
          reads: [],
          createdAt: now,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    console.error("[operations-work] assignment notification failed", {
      type,
      workItemId: input.workItemId,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  }
}

export function scheduleWorkAssignmentNotification(
  input: WorkAssignmentNotifyInput,
): void {
  void emitWorkAssignmentNotification(input).catch((error) => {
    console.error("[operations-work] assignment notification rejected", {
      workItemId: input.workItemId,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  });
}
