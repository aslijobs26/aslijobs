import { OperationsAuditLogModel } from "../rbac/operations-audit-log.model.js";
import { recordOperationsAuditEvent } from "../rbac/operations-audit.service.js";
import { OPERATIONS_REGISTRATION_AUDIT_ACTIONS } from "./operations-registration-awareness.constants.js";
import { OperationsNotificationModel } from "./operations-notification.model.js";
import type {
  EmitCandidateRegisteredInput,
  EmitEmployerRegisteredInput,
} from "./operations-registration-awareness.types.js";

function employerIdempotencyKey(employerId: string): string {
  return `employer.registered:${employerId}`;
}

function candidateIdempotencyKey(candidateId: string): string {
  return `candidate.registered:${candidateId}`;
}

/**
 * Best-effort side effects after a successful public registration completion.
 * Must never throw to the registration caller — failures are logged only.
 */
export async function emitEmployerRegisteredAwareness(
  input: EmitEmployerRegisteredInput,
): Promise<void> {
  const registeredAt = input.registeredAt ?? new Date();
  const actionPath = `/operations/employers/${input.employerId}`;

  try {
    await OperationsNotificationModel.updateOne(
      { idempotencyKey: employerIdempotencyKey(input.employerId) },
      {
        $setOnInsert: {
          idempotencyKey: employerIdempotencyKey(input.employerId),
          type: "employer.registered",
          title: "New Employer Registered",
          body: `${input.displayName} registered a new employer account.`,
          entityType: "employer",
          entityId: input.employerId,
          actionPath,
          actorName: "SYSTEM",
          metadata: {
            displayId: input.displayId,
            displayName: input.displayName,
            registeredAt: registeredAt.toISOString(),
          },
          reads: [],
          createdAt: registeredAt,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    console.error(
      "[operations-registration-awareness] employer notification failed",
      {
        eventType: "employer.registered",
        entityId: input.employerId,
        errorCategory: error instanceof Error ? error.name : "unknown",
      },
    );
  }

  try {
    const existingAudit = await OperationsAuditLogModel.findOne({
      action: OPERATIONS_REGISTRATION_AUDIT_ACTIONS.EMPLOYER_REGISTERED,
      targetType: "employer",
      targetId: input.employerId,
    })
      .select("_id")
      .lean();

    if (!existingAudit) {
      await recordOperationsAuditEvent({
        actorUserId: null,
        actorName: "SYSTEM",
        action: OPERATIONS_REGISTRATION_AUDIT_ACTIONS.EMPLOYER_REGISTERED,
        targetType: "employer",
        targetId: input.employerId,
        targetLabel: input.displayName,
        nextState: {
          registrationAwareness: "new",
          displayId: input.displayId,
        },
        metadata: {
          displayId: input.displayId,
          registeredAt: registeredAt.toISOString(),
          source: "public_registration",
        },
      });
    }
  } catch (error) {
    console.error(
      "[operations-registration-awareness] employer audit failed",
      {
        eventType: "employer.registered",
        entityId: input.employerId,
        errorCategory: error instanceof Error ? error.name : "unknown",
      },
    );
  }
}

export async function emitCandidateRegisteredAwareness(
  input: EmitCandidateRegisteredInput,
): Promise<void> {
  const registeredAt = input.registeredAt ?? new Date();
  const actionPath = `/operations/candidates/${input.candidateId}`;

  try {
    await OperationsNotificationModel.updateOne(
      { idempotencyKey: candidateIdempotencyKey(input.candidateId) },
      {
        $setOnInsert: {
          idempotencyKey: candidateIdempotencyKey(input.candidateId),
          type: "candidate.registered",
          title: "New Jobseeker Registered",
          body: `${input.displayName} created a new jobseeker account.`,
          entityType: "candidate",
          entityId: input.candidateId,
          actionPath,
          actorName: "SYSTEM",
          metadata: {
            displayId: input.displayId,
            displayName: input.displayName,
            registeredAt: registeredAt.toISOString(),
          },
          reads: [],
          createdAt: registeredAt,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    console.error(
      "[operations-registration-awareness] candidate notification failed",
      {
        eventType: "candidate.registered",
        entityId: input.candidateId,
        errorCategory: error instanceof Error ? error.name : "unknown",
      },
    );
  }

  try {
    const existingAudit = await OperationsAuditLogModel.findOne({
      action: OPERATIONS_REGISTRATION_AUDIT_ACTIONS.CANDIDATE_REGISTERED,
      targetType: "candidate",
      targetId: input.candidateId,
    })
      .select("_id")
      .lean();

    if (!existingAudit) {
      await recordOperationsAuditEvent({
        actorUserId: null,
        actorName: "SYSTEM",
        action: OPERATIONS_REGISTRATION_AUDIT_ACTIONS.CANDIDATE_REGISTERED,
        targetType: "candidate",
        targetId: input.candidateId,
        targetLabel: input.displayName,
        nextState: {
          registrationAwareness: "new",
          displayId: input.displayId,
        },
        metadata: {
          displayId: input.displayId,
          registeredAt: registeredAt.toISOString(),
          source: "public_registration",
        },
      });
    }
  } catch (error) {
    console.error(
      "[operations-registration-awareness] candidate audit failed",
      {
        eventType: "candidate.registered",
        entityId: input.candidateId,
        errorCategory: error instanceof Error ? error.name : "unknown",
      },
    );
  }
}

/** Fire-and-forget — registration must succeed even if this rejects. */
export function scheduleEmployerRegisteredAwareness(
  input: EmitEmployerRegisteredInput,
): void {
  void emitEmployerRegisteredAwareness(input).catch((error) => {
    console.error(
      "[operations-registration-awareness] employer emit rejected",
      {
        eventType: "employer.registered",
        entityId: input.employerId,
        errorCategory: error instanceof Error ? error.name : "unknown",
      },
    );
  });
}

export function scheduleCandidateRegisteredAwareness(
  input: EmitCandidateRegisteredInput,
): void {
  void emitCandidateRegisteredAwareness(input).catch((error) => {
    console.error(
      "[operations-registration-awareness] candidate emit rejected",
      {
        eventType: "candidate.registered",
        entityId: input.candidateId,
        errorCategory: error instanceof Error ? error.name : "unknown",
      },
    );
  });
}
