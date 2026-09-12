import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { MyWorkAssignDialog } from "../components/operations/my-work/MyWorkAssignDialog";
import { MyWorkWaitingReasonDialog } from "../components/operations/my-work/MyWorkWaitingReasonDialog";
import { MyWorkDetailActivity } from "../components/operations/my-work/detail/MyWorkDetailActivity";
import { MyWorkDetailHeader } from "../components/operations/my-work/detail/MyWorkDetailHeader";
import { MyWorkDetailSidePanel } from "../components/operations/my-work/detail/MyWorkDetailSidePanel";
import { workMutationErrorMessage } from "../components/operations/my-work/my-work-errors";
import {
  useClaimOperationsWork,
  useOperationsWorkDetail,
  useUpdateOperationsWorkDue,
  useUpdateOperationsWorkPriority,
  useUpdateOperationsWorkStatus,
} from "../hooks/use-operations-work";
import type { WorkItemPriority } from "../types/operations-work";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

function detailError(error: unknown): string {
  if (isOperationsSessionTransientError(error)) {
    return "The API server is temporarily unavailable.";
  }
  if (isAxiosError(error)) {
    if (error.response?.status === 404) return "Work item not found.";
    if (error.response?.status === 403) {
      return "You don't have permission to view this work item.";
    }
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Failed to load work item.";
}

export function OperationsMyWorkDetailPage() {
  const { workItemId } = useParams<{ workItemId: string }>();
  const detailQuery = useOperationsWorkDetail(workItemId);
  const claimMutation = useClaimOperationsWork();
  const statusMutation = useUpdateOperationsWorkStatus();
  const priorityMutation = useUpdateOperationsWorkPriority();
  const dueMutation = useUpdateOperationsWorkDue();
  const [assignOpen, setAssignOpen] = useState(false);
  const [waitingOpen, setWaitingOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const item = detailQuery.data;
  const busy =
    claimMutation.isPending ||
    statusMutation.isPending ||
    priorityMutation.isPending ||
    dueMutation.isPending;

  const subtitle = useMemo(
    () => item?.displayId ?? "Detail",
    [item?.displayId],
  );

  const run = async (fn: () => Promise<unknown>, fallback: string) => {
    setActionError(null);
    try {
      await fn();
    } catch (error) {
      setActionError(workMutationErrorMessage(error, fallback));
    }
  };

  return (
    <OperationsLayout
      title="Work Item"
      subtitle={subtitle}
      headerVariant="command"
    >
      <div className="mx-auto w-full min-w-0 max-w-[90rem]">
        {detailQuery.isPending && !item ? (
          <div className="h-[32rem] animate-pulse rounded-xl border border-border-subtle bg-surface" />
        ) : detailQuery.error && !item ? (
          <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
            {detailError(detailQuery.error)}
          </div>
        ) : item ? (
          <>
            <article className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
              <MyWorkDetailHeader
                item={item}
                actionError={actionError}
                busy={busy}
                onAssign={() => setAssignOpen(true)}
                onClaim={() =>
                  void run(
                    () =>
                      claimMutation.mutateAsync({
                        id: item.id,
                        expectedRevision: item.revision,
                      }),
                    "Failed to claim.",
                  )
                }
                onStatus={(input) => {
                  if (input.status === "waiting" && !input.waitingReason) {
                    setWaitingOpen(true);
                    return;
                  }
                  void run(
                    () =>
                      statusMutation.mutateAsync({
                        id: item.id,
                        input: {
                          status: input.status,
                          waitingReason: input.waitingReason,
                          expectedRevision: item.revision,
                        },
                      }),
                    "Failed to update status.",
                  );
                }}
                onPriority={(priority: WorkItemPriority) =>
                  void run(
                    () =>
                      priorityMutation.mutateAsync({
                        id: item.id,
                        priority,
                        expectedRevision: item.revision,
                      }),
                    "Failed to update priority.",
                  )
                }
                onDue={(dueAt) =>
                  void run(
                    () =>
                      dueMutation.mutateAsync({
                        id: item.id,
                        dueAt,
                        expectedRevision: item.revision,
                      }),
                    "Failed to update due date.",
                  )
                }
              />

              <div className="grid grid-cols-1 gap-3 border-t border-border-subtle bg-hero-bg/30 p-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.85fr)] lg:gap-3.5 lg:p-4">
                <MyWorkDetailActivity history={item.history} />
                <MyWorkDetailSidePanel item={item} />
              </div>
            </article>

            <MyWorkAssignDialog
              open={assignOpen}
              mode={item.assignedToUserId ? "reassign" : "assign"}
              item={item}
              onClose={() => setAssignOpen(false)}
              onSuccess={() => setActionError(null)}
            />
            <MyWorkWaitingReasonDialog
              open={waitingOpen}
              workTitle={item.title}
              isSubmitting={statusMutation.isPending}
              onClose={() => setWaitingOpen(false)}
              onConfirm={async (reason) => {
                await run(
                  () =>
                    statusMutation.mutateAsync({
                      id: item.id,
                      input: {
                        status: "waiting",
                        waitingReason: reason,
                        expectedRevision: item.revision,
                      },
                    }),
                  "Failed to update status.",
                );
                setWaitingOpen(false);
              }}
            />
          </>
        ) : null}
      </div>
    </OperationsLayout>
  );
}
