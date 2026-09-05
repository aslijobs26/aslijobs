import type { Types } from "mongoose";
import { OperationsAuditLogModel } from "./operations-audit-log.model.js";

export type OperationsAuditEventInput = {
  actorUserId?: Types.ObjectId | string | null;
  actorName?: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel?: string;
  previousState?: unknown;
  nextState?: unknown;
  reason?: string;
  metadata?: Record<string, unknown>;
};

function redactSecrets(value: unknown): unknown {
  if (!value || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item));
  }

  const blocked = new Set([
    "password",
    "passwordHash",
    "refreshToken",
    "refreshTokenHash",
    "accessToken",
    "token",
    "otp",
    "otpHash",
  ]);

  const output: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (blocked.has(key)) {
      continue;
    }
    output[key] = redactSecrets(nested);
  }
  return output;
}

export async function recordOperationsAuditEvent(
  input: OperationsAuditEventInput,
): Promise<void> {
  await OperationsAuditLogModel.create({
    actorUserId: input.actorUserId ?? null,
    actorName: input.actorName?.trim() || "",
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    targetLabel: input.targetLabel?.trim() || "",
    previousState: redactSecrets(input.previousState ?? null),
    nextState: redactSecrets(input.nextState ?? null),
    reason: input.reason?.trim() || "",
    metadata: redactSecrets(input.metadata ?? {}),
  });
}
